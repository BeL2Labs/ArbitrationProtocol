// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IArbitratorManager.sol";
import "../interfaces/IBNFTInfo.sol";
import "./ConfigManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "hardhat/console.sol";

/**
 * @title ArbitratorManager
 * @notice Contract for managing arbitrators in the BeLayer2 arbitration protocol
 * @dev This contract handles arbitrator registration, staking, and lifecycle management
 *
 * Key features:
 * - Arbitrator staking and unstaking
 * - Operator and revenue address management
 * - Fee rate and term duration configuration
 * - Arbitrator status control (pause/unpause)
 *
 * Security considerations:
 * - All stake withdrawals require arbitrator to be in non-working state
 * - Minimum stake and fee rate requirements from ConfigManager
 * - Status changes are protected against invalid state transitions
 */
contract ArbitratorManager is 
    IArbitratorManager,
    ReentrancyGuardUpgradeable, 
    OwnableUpgradeable 
{
    // Constants
    address public constant zeroAddress = address(0);

    // Config manager reference for system parameters
    ConfigManager public configManager;
    
    // NFT contract reference
    IERC721 public nftContract;
    IBNFTInfo public nftInfo;

    // Mapping of arbitrator addresses to their information
    mapping(address => DataTypes.ArbitratorInfo) private arbitrators;
    
    // State variables
    address public transactionManager;
    address public compensationManager;
    bool private initialized;
    mapping(address => DataTypes.ArbitratorInfoExt) private arbitratorsExt;

    /**
     * @notice Ensures arbitrator is not currently handling any transactions
     * @dev Prevents critical state changes while arbitrator is working
     */
    modifier notWorking() {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        require(arbitrator.activeTransactionId == bytes32(0), "ArbitratorWorking");
        _;
    }

    modifier onlyTransactionManager() {
        if (msg.sender != transactionManager) 
            revert (Errors.NOT_TRANSACTION_MANAGER);
        if (!initialized)
            revert (Errors.NOT_INITIALIZED);
        _;
    }

    modifier onlyCompensationManager() {
        if (msg.sender != compensationManager) 
            revert (Errors.NOT_COMPENSATION_MANAGER);
        if (!initialized)
            revert (Errors.NOT_INITIALIZED);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with required addresses
     * @param _configManager Address of the ConfigManager contract
     * @param _nftContract Address of the NFT contract
     * @param _nftInfo Address of the NFT info contract
     */
    function initialize(
        address _configManager,
        address _nftContract,
        address _nftInfo
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);

        if (_configManager == address(0)
            || _nftContract == address(0)
            || _nftInfo == address(0)) {
            revert (Errors.ZERO_ADDRESS);
        }

        configManager = ConfigManager(_configManager);
        nftContract = IERC721(_nftContract);
        nftInfo = IBNFTInfo(_nftInfo);
    }

    // Helper function to validate inputs
    function _validateInputs(
        string calldata revenueBtcAddress,
        bytes calldata revenueBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    ) private view {
        if (bytes(revenueBtcAddress).length == 0 || revenueBtcPubKey.length == 0 ) {
            revert (Errors.INVALID_PARAMETER);
        }
        
        // Validate fee rate
        uint256 minFeeRate = configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE());
        if (feeRate < minFeeRate) revert (Errors.INVALID_FEE_RATE);

        // Validate btc fee rate
        uint256 minBtcFeeRate = configManager.getConfig(configManager.TRANSACTION_MIN_BTC_FEE_RATE());
        if (btcFeeRate < minBtcFeeRate) revert (Errors.INVALID_BTC_FEE_RATE);

        // Validate deadline
        if (deadline != 0 && deadline <= block.timestamp) revert (Errors.INVALID_DEADLINE);
    }

    // Helper function to get or create arbitrator info
    function _getOrCreateArbitratorInfo(address sender) private returns (DataTypes.ArbitratorInfo storage) {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[sender];
        
        if (arbitrator.arbitrator == zeroAddress) {
            arbitrator.arbitrator = sender;
        }

        return arbitrator;
    }

    function registerArbitratorByStakeETH(
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    ) external payable {
       DataTypes.ArbitratorInfo storage arbitrator = _initializeArbitrator(
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );
        _validateStakeAmount(msg.value, 0);
        arbitrator.ethAmount += msg.value;

        // Emit an event to notify the registration
        emit StakeAdded(arbitrator.arbitrator, address(0), msg.value, new uint256[](0));
        emit ArbitratorRegistered(
            msg.sender,
            arbitrator.operator,
            arbitrator.revenueETHAddress,
            arbitrator.revenueBtcAddress,
            arbitrator.revenueBtcPubKey,
            feeRate,
            deadline
        );
    }

    function registerArbitratorByStakeNFT(
        uint256[] calldata tokenIds,
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    ) external nonReentrant {
         // Validate token IDs
        if (tokenIds.length == 0) revert (Errors.EMPTY_TOKEN_IDS);

        DataTypes.ArbitratorInfo storage arbitrator = _initializeArbitrator(
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );

        // Calculate total NFT value
        uint256 totalNftValue = _calculateNFTValue(tokenIds);

        // Transfer NFTs and update arbitrator's token list
        _transferAndStoreNFTs(arbitrator, tokenIds);

        // Validate total stake
        _validateStakeAmount(arbitrator.ethAmount, totalNftValue);

        // Set or validate NFT contract
        _setOrValidateNFTContract(arbitrator);

        // Emit events
        
        emit StakeAdded(msg.sender, address(nftContract), totalNftValue, tokenIds);
        emit ArbitratorRegistered(
            msg.sender,
            arbitrator.operator, // operator
            arbitrator.revenueETHAddress, // revenue ETH address
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            deadline
        );
    }

    function _initializeArbitrator(
        address arbitratorAddress,
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    ) internal returns (DataTypes.ArbitratorInfo storage) {
        // Check if the arbitrator is already registered
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[arbitratorAddress];
        if (arbitrator.arbitrator != address(0)) {
            revert(Errors.ARBITRATOR_ALREADY_REGISTERED);
        }

        _validateInputs(
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );

        // Initialize basic information
        arbitrator.arbitrator = arbitratorAddress;
        arbitrator.operator = arbitratorAddress;
        arbitrator.revenueETHAddress = arbitratorAddress;
        arbitrator.revenueBtcAddress = defaultBtcAddress;
        arbitrator.revenueBtcPubKey = defaultBtcPubKey;
        arbitrator.operatorBtcAddress = defaultBtcAddress;
        arbitrator.operatorBtcPubKey = defaultBtcPubKey;
        arbitrator.currentFeeRate = feeRate;
        arbitrator.deadLine = deadline;

        // Initialize extension information
        DataTypes.ArbitratorInfoExt storage arbitratorExt = arbitratorsExt[arbitratorAddress];
        arbitratorExt.currentBTCFeeRate = btcFeeRate;

        return arbitrator;
    }
    
    /**
     * @notice Stake ETH as collateral
     */
    function stakeETH() external payable override {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        
        if (arbitrator.arbitrator == address(0)) {
           revert (Errors.ARBITRATOR_NOT_REGISTERED);
        }
        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        // Calculate total NFT value
        uint256 totalNftValue = getTotalNFTStakeValue(msg.sender);

        // Update ETH amount and calculate total stake
        uint256 newEthAmount = arbitrator.ethAmount + msg.value;
        arbitrator.ethAmount = newEthAmount;

        _validateStakeAmount(newEthAmount, totalNftValue);

        emit StakeAdded(arbitrator.arbitrator, address(0), msg.value,new uint256[](0));
    }

    /**
     * @notice Allows arbitrators to stake NFTs
     * @param tokenIds Array of NFT token IDs to stake
     */
    function stakeNFT(uint256[] calldata tokenIds) external override {
        if (tokenIds.length == 0) revert (Errors.EMPTY_TOKEN_IDS);

        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        
        // If first time staking, set arbitrator address
        if (arbitrator.arbitrator == address(0)) {
            revert (Errors.ARBITRATOR_NOT_REGISTERED);
        }
        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        // Calculate total NFT value
        uint256 totalNftValue = _calculateNFTValue(tokenIds);

        // Transfer NFTs and update arbitrator's token list
        _transferAndStoreNFTs(arbitrator, tokenIds);

        // Validate total stake
        _validateStakeAmount(arbitrator.ethAmount, totalNftValue);

        // Set or validate NFT contract
        _setOrValidateNFTContract(arbitrator);

        emit StakeAdded(msg.sender, address(nftContract), totalNftValue, tokenIds);
    }

    /**
     * @dev Calculate the total value of NFTs
     * @param tokenIds Array of token IDs to calculate value for
     * @return Total NFT value
     */
    function _calculateNFTValue(uint256[] calldata tokenIds) internal view returns (uint256) {
        uint256 totalNftValue = 0;
        uint256 votes = 0;
        uint256 power = 10 ** 10;
        // Calculate value for newly staked NFTs
        for (uint256 i = 0; i < tokenIds.length; i++) {
            (,BNFTVoteInfo memory info) = nftInfo.getNftInfo(tokenIds[i]);
            for (uint256 j = 0; j < info.infos.length; j++) {
                votes = uint256(info.infos[j].votes);
                (bool success, uint256 value) = Math.tryMul(votes, power);
                if (!success) revert("Overflow");
                totalNftValue += value;
            }
        }
        
        // Calculate value for existing arbitrator's NFTs
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        for (uint256 i = 0; i < arbitrator.nftTokenIds.length; i++) {
            (,BNFTVoteInfo memory info) = nftInfo.getNftInfo(arbitrator.nftTokenIds[i]);
            for (uint256 j = 0; j < info.infos.length; j++) {
                votes = uint256(info.infos[j].votes);
                (bool success, uint256 value) = Math.tryMul(votes, power);
                if (!success) revert("Overflow");
                totalNftValue += value;
            }
        }
        
        return totalNftValue;
    }

    /**
     * @dev Transfer NFTs to contract and store in arbitrator's token list
     * @param arbitrator Arbitrator storage reference
     * @param tokenIds Array of token IDs to transfer
     */
    function _transferAndStoreNFTs(
        DataTypes.ArbitratorInfo storage arbitrator, 
        uint256[] calldata tokenIds
    ) internal {
        bool isApproved = nftContract.isApprovedForAll(msg.sender, address(this));
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (!isApproved) {
                if(nftContract.getApproved(tokenIds[i]) != address(this)) {
                    revert("NoApprove");
                }
            }
            nftContract.transferFrom(msg.sender, address(this), tokenIds[i]);
            arbitrator.nftTokenIds.push(tokenIds[i]);
        }
    }

    /**
     * @dev Validate total stake amount
     * @param ethAmount Arbitrator's ethAmount
     * @param totalNftValue Total value of NFTs being staked
     */
    function _validateStakeAmount(
        uint256 ethAmount, 
        uint256 totalNftValue
    ) internal view {
        uint256 totalStakeValue = ethAmount + totalNftValue;
        uint256 minStake = configManager.getConfig(configManager.MIN_STAKE());
        uint256 maxStake = configManager.getConfig(configManager.MAX_STAKE());
        
        if (totalStakeValue < minStake) revert (Errors.INSUFFICIENT_STAKE);
        if (totalStakeValue > maxStake) revert (Errors.STAKE_EXCEEDS_MAX);
    }

    /**
     * @dev Set or validate NFT contract address
     * @param arbitrator Arbitrator storage reference
     */
    function _setOrValidateNFTContract(
        DataTypes.ArbitratorInfo storage arbitrator
    ) internal {
        if (arbitrator.nftContract == address(0)) {
            arbitrator.nftContract = address(nftContract);
        } else if (arbitrator.nftContract != address(nftContract)) {
            revert (Errors.INVALID_NFT_CONTRACT);
        }
    }

    /**
     * @notice Allows arbitrators to withdraw their entire stake
     * @dev Can only be called when not handling any transactions
     * Withdraws entire stake amount at once
     */
    function unstake() external override nonReentrant notWorking {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if(!isConfigModifiable(arbitrator.arbitrator)) revert (Errors.STAKE_STILL_LOCKED);
        require(arbitrator.ethAmount > 0 || arbitrator.nftTokenIds.length > 0, "NoStake");
        
        uint256 amount = arbitrator.ethAmount;
        arbitrator.ethAmount = 0;

        // Transfer NFTs back to arbitrator if any
        if (arbitrator.nftContract != address(0) && arbitrator.nftTokenIds.length > 0) {
            uint256[] memory nftTokenIds = arbitrator.nftTokenIds;
            arbitrator.nftTokenIds = new uint256[](0);
            arbitrator.nftContract = address(0);

            for (uint256 i = 0; i < nftTokenIds.length; i++) {
                nftContract.transferFrom(
                    address(this),
                    msg.sender,
                    nftTokenIds[i]
                );
            }
        }

        if (amount > 0) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "TransferFailed");
        }
        
        emit StakeWithdrawn(msg.sender, zeroAddress, amount);
    }

    /**
     * @notice Sets or updates arbitrator's operator details
     * @param operator Address of the operator
     * @param btcPubKey Bitcoin public key of the operator
     * @param btcAddress Bitcoin address of the operator
     * @dev Operator address cannot be zero address
     */
    function setOperator(
        address operator,
        bytes calldata btcPubKey,
        string calldata btcAddress
    ) external override {
        require(operator != address(0), "InvalidOperator");

        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);
        
        arbitrator.operator = operator;
        arbitrator.operatorBtcPubKey = btcPubKey;
        arbitrator.operatorBtcAddress = btcAddress;
        
        emit OperatorSet(msg.sender, operator, btcPubKey, btcAddress);
    }

    /**
     * @notice Sets or updates arbitrator's revenue addresses for Bitcoin
     * @param btcPubKey Bitcoin public key for receiving revenue
     * @param btcAddress Bitcoin address for receiving revenue
     */
    function setRevenueAddresses(
        address ethAddress,
        bytes calldata btcPubKey,
        string calldata btcAddress
    ) external override {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);

        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        arbitrator.revenueETHAddress = ethAddress;
        arbitrator.revenueBtcPubKey = btcPubKey;
        arbitrator.revenueBtcAddress = btcAddress;
        
        emit RevenueAddressesSet(msg.sender, ethAddress, btcPubKey, btcAddress);
    }

    function setFeeRates(uint256 ethFeeRate, uint256 btcFeeRate) external override {
        require(ethFeeRate >= configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE()), "FeeTooLow");
        require(btcFeeRate >= configManager.getConfig(configManager.TRANSACTION_MIN_BTC_FEE_RATE()), Errors.INVALID_BTC_FEE_RATE);

        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);
        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        arbitrator.currentFeeRate = ethFeeRate;
        DataTypes.ArbitratorInfoExt storage arbitratorExt = arbitratorsExt[msg.sender];
        arbitratorExt.currentBTCFeeRate = btcFeeRate;

        emit ArbitratorFeeRateUpdated(msg.sender, ethFeeRate, btcFeeRate);
    }

    /**
     * @notice Set arbitrator deadline
     * @dev Only callable by arbitrator
     * @param deadline In seconds, Arbitrator end of term, must bigger than prev deadline
     */
    function setArbitratorDeadline(uint256 deadline) external override {
        if (deadline <= block.timestamp) revert (Errors.INVALID_DEADLINE);
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);

        if (arbitrator.deadLine > 0 && deadline <= arbitrator.deadLine) revert (Errors.INVALID_DEADLINE);
        arbitrator.deadLine = deadline;

        emit ArbitratorDeadlineUpdated(msg.sender, deadline);
    }

    /**
     * @notice Pauses arbitrator services
     * @dev Can only be called when active and not working
     */
    function pause() external override {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);
        require(isActiveArbitrator(msg.sender), "Not active");
        arbitrator.paused = true;
        
        emit ArbitratorPaused(msg.sender);
    }

    /**
     * @notice Resumes arbitrator services
     * @dev Can only be called when paused and not working
     */
    function unpause() external override {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);
        require(arbitrator.paused, "not paused");
        arbitrator.paused = false;
        
        emit ArbitratorUnpaused(msg.sender);
    }

    /**
     * @notice Retrieves arbitrator information
     * @param arbitratorAddress Address of the arbitrator
     * @return ArbitratorInfo struct containing all arbitrator details
     */
    function getArbitratorInfo(address arbitratorAddress) 
        external 
        view 
        override 
        returns (DataTypes.ArbitratorInfo memory) 
    {
        return arbitrators[arbitratorAddress];
    }

    function getArbitratorInfoExt(address arbitrator) external view returns (DataTypes.ArbitratorInfoExt memory) {
        return arbitratorsExt[arbitrator];
    }

    /**
     * @notice Check if an arbitrator is active and meets minimum stake requirement
     * @param arbitratorAddress Address of the arbitrator to check
     * @return bool True if arbitrator is active and meets minimum stake
     */
    function isActiveArbitrator(address arbitratorAddress) 
        public
        view 
        override 
        returns (bool) 
    {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[arbitratorAddress];
        if (arbitrator.deadLine > 0 && arbitrator.deadLine <= block.timestamp) {
            return false;
        }

        uint256 totalStakeValue = getAvailableStake(arbitrator.arbitrator);
        if (totalStakeValue < configManager.getConfig(configManager.MIN_STAKE())) {
            return false;
        }

        // freeze lock time
        if (isFrozenArbitrator(arbitrator)) {
            return false;
        }

        if (arbitrator.activeTransactionId != bytes32(0)) {
            return false;
        }

        if (arbitrator.paused) {
            return false;
        }

        return true;
    }

    function isFrozenStatus(address arbitrator) external view returns (bool) {
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitrators[arbitrator];
        if (arbitratorInfo.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);
        return isFrozenArbitrator(arbitratorInfo);
    }

    function isFrozenArbitrator(DataTypes.ArbitratorInfo memory arbitrator) internal view returns(bool) {
        uint256 freeze_period = configManager.getArbitrationFrozenPeriod();
        if (arbitrator.lastSubmittedWorkTime == 0) {
            return false;
        }
        if (arbitrator.lastSubmittedWorkTime + freeze_period > block.timestamp) {
            return true;
        }
        return false;
    }

    /**
     * @notice Get available stake amount for an arbitrator
     * @param arbitrator Address of the arbitrator
     * @return uint256 Available stake amount (ETH + NFT value)
     */
    function getAvailableStake(address arbitrator) public view override returns (uint256) {
        DataTypes.ArbitratorInfo storage info = arbitrators[arbitrator];
        uint256 totalNftValue = getTotalNFTStakeValue(arbitrator);
        return info.ethAmount + totalNftValue;
    }

    /**
     * @notice Checks if an address is an operator of an arbitrator
     * @param arbitrator Address of the arbitrator
     * @param operator Address to check
     * @return bool True if operator is associated with arbitrator
     */
    function isOperatorOf(address arbitrator, address operator) external view returns (bool) {
        return arbitrators[arbitrator].operator == operator;
    }

    /**
     * @notice Checks if the config of the arbitrator can change
     * @param arbitrator Address of the arbitrator
     * @return bool True if the config can change
     */
    function isConfigModifiable(address arbitrator) public view returns (bool) {
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitrators[arbitrator];
        if (arbitratorInfo.arbitrator == address(0)) return false;
        if (arbitratorInfo.activeTransactionId != bytes32(0)) return false;
        if (isFrozenArbitrator(arbitratorInfo)) return false;

        return true;
    }

    /**
     * @notice Checks if an arbitrator is paused
     * @param arbitrator Address of the arbitrator
     * @return bool True if arbitrator is paused
     */
    function isPaused(address arbitrator) external view returns (bool) {
        return arbitrators[arbitrator].paused;
    }

    /**
     * @notice Set arbitrator to working with specific transaction
     * @param arbitrator The address of the arbitrator
     * @param transactionId The ID of the transaction
     */
    function setArbitratorWorking(
        address arbitrator, 
        bytes32 transactionId
    ) external onlyTransactionManager {
        DataTypes.ArbitratorInfo storage arbitratorInfo = arbitrators[arbitrator];
        if (!isActiveArbitrator(arbitrator)) {
            revert (Errors.ARBITRATOR_NOT_ACTIVE);
        }

        // Update arbitrator state
        arbitratorInfo.activeTransactionId = transactionId;
        
        emit ArbitratorWorking(arbitrator, transactionId);
    }

    /**
     * @notice Release arbitrator from working
     * @param arbitrator The address of the arbitrator
     * @param transactionId The ID of the transaction
     */
    function releaseArbitrator(
        address arbitrator, 
        bytes32 transactionId
    ) external onlyTransactionManager {
        DataTypes.ArbitratorInfo storage arbitratorInfo = arbitrators[arbitrator];
        
        if (arbitratorInfo.activeTransactionId != transactionId)
            revert (Errors.INVALID_TRANSACTION_ID);
            
        // Update arbitrator state
        arbitratorInfo.activeTransactionId = bytes32(0);

        emit ArbitratorReleased(arbitrator, transactionId);
    }

    /**
     * @notice Terminate an arbitrator and clear their stake
     * @dev Only callable by compensation manager, transfers all stake to compensation manager
     * @param arbitrator The address of the arbitrator to terminate
     */
    function terminateArbitratorWithSlash(address arbitrator) external override onlyCompensationManager {
        DataTypes.ArbitratorInfo storage info = arbitrators[arbitrator];
        if (info.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);

        // Transfer ETH stake to compensation manager
        uint256 ethAmount = info.ethAmount;
        if (ethAmount > 0) {
            info.ethAmount = 0;
            (bool success, ) = compensationManager.call{value: ethAmount}("");
            if (!success) revert (Errors.TRANSFER_FAILED);
        }

        // Transfer NFTs to compensation manager if any
        if (info.nftContract != address(0) && info.nftTokenIds.length > 0) {
            uint256[] memory nftTokenIds = info.nftTokenIds;
            info.nftTokenIds = new uint256[](0);
            info.nftContract = address(0);

            for (uint256 i = 0; i < nftTokenIds.length; i++) {
                nftContract.transferFrom(
                    address(this),
                    compensationManager,
                    nftTokenIds[i]
                );
            }
        }

        emit ArbitratorTerminatedWithSlash(arbitrator);
    }

    /**
     * @notice Calculate total stake value in NFTs
     * @param arbitrator Address of the arbitrator
     * @return Total stake NFT value in ETH
     */
    function getTotalNFTStakeValue(address arbitrator) public view returns (uint256) {
        DataTypes.ArbitratorInfo storage arbiInfo = arbitrators[arbitrator];
        uint256 totalValue = 0;

        // Add NFT values
        for (uint256 i = 0; i < arbiInfo.nftTokenIds.length; i++) {
            (,BNFTVoteInfo memory info) = nftInfo.getNftInfo(arbiInfo.nftTokenIds[i]);
            for (uint256 j = 0; j < info.infos.length; j++) {
                // Convert from 8 decimals to 18 decimals by multiplying by 10^10
                (bool success, uint256 value) = Math.tryMul(uint256(info.infos[j].votes), 10 ** 10);
                if (!success) revert("Overflow");
                totalValue += value;
            }
        }

        return totalValue;
    }

    /**
     * @notice Freeze an arbitrator's after submitted transactions
     * @param arbitrator Address of the arbitrator
     */
    function frozenArbitrator(address arbitrator) external override onlyTransactionManager {

        // Get the arbitrator's info
        DataTypes.ArbitratorInfo storage arbitratorInfo = arbitrators[arbitrator];

        // Ensure the arbitrator exists and is active
        if (arbitratorInfo.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);
        if (arbitratorInfo.activeTransactionId == bytes32(0)) revert (Errors.ARBITRATOR_NOT_WORKING);

        // Set the last submitted work time to current timestamp to trigger freeze
        arbitratorInfo.lastSubmittedWorkTime = block.timestamp;
        // Emit event about arbitrator being frozen
        emit ArbitratorFrozen(arbitrator);
    }

    /**
     * @notice Initialize both transaction and compensation manager addresses
     * @dev This function can only be called once to set up the initial manager addresses
     * @param _transactionManager Address of the transaction manager contract
     * @param _compensationManager Address of the compensation manager contract
     * @custom:security Both addresses are checked for zero address to prevent invalid initialization
     * @custom:event Emits an Initialized event with both manager addresses
     */
    function initTransactionAndCompensationManager(address _transactionManager, address _compensationManager) external override onlyOwner {
         if (initialized) revert (Errors.ALREADY_INITIALIZED);
          if (_transactionManager == address(0) || _compensationManager == address(0)) revert (Errors.ZERO_ADDRESS);

          transactionManager = _transactionManager;
          compensationManager = _compensationManager;
          initialized = true;
          emit InitializedManager(transactionManager, compensationManager);
    }

    /**
     * @notice Set the transaction manager address
     * @param _transactionManager New transaction manager address
     */
    function setTransactionManager(address _transactionManager) external override onlyOwner {
        if (_transactionManager == address(0)) revert (Errors.ZERO_ADDRESS);
        address oldManager = transactionManager;
        transactionManager = _transactionManager;
        emit TransactionManagerUpdated(oldManager, _transactionManager);
    }

    /**
     * @notice Set the compensation manager address
     * @param _compensationManager New compensation manager address
     */
    function setCompensationManager(address _compensationManager) external override onlyOwner {
        if (_compensationManager == address(0)) revert (Errors.ZERO_ADDRESS);
        address oldManager = compensationManager;
        compensationManager = _compensationManager;
        emit CompensationManagerUpdated(oldManager, _compensationManager);
    }

    /**
     * @notice Set the NFT contract address
     * @dev Can only be called by the contract owner
     * @param _nftContract New NFT contract address
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        if (_nftContract == address(0)) 
            revert (Errors.ZERO_ADDRESS);
        
        address oldNFTContract = address(nftContract);
        nftContract = IERC721(_nftContract);
        
        emit NFTContractUpdated(oldNFTContract, _nftContract);
    }

    // Add a gap for future storage variables
    uint256[49] private __gap;
}
