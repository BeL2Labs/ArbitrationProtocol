// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IArbitratorManager.sol";
import "../interfaces/IBNFTInfo.sol";
import "./ConfigManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

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
            revert(Errors.NOT_TRANSACTION_MANAGER);
        if (!initialized)
            revert(Errors.NOT_INITIALIZED);
        _;
    }

    modifier onlyCompensationManager() {
        if (msg.sender != compensationManager) 
            revert(Errors.NOT_COMPENSATION_MANAGER);
        if (!initialized)
            revert(Errors.NOT_INITIALIZED);
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

        if (_configManager == address(0)) 
            revert(Errors.ZERO_ADDRESS);
        if (_nftContract == address(0))
            revert(Errors.ZERO_ADDRESS);
        if (_nftInfo == address(0))
            revert(Errors.ZERO_ADDRESS);
        configManager = ConfigManager(_configManager);
        nftContract = IERC721(_nftContract);
        nftInfo = IBNFTInfo(_nftInfo);
    }

    function registerArbitratorByStakeETH(
        address operator,
        address revenueAddress,
        string calldata btcAddress,
        bytes calldata btcPubKey,
        uint256 feeRate,
        uint256 deadline
    ) external payable override {
        // Check if the operator is not zero address
        require(operator != address(0), Errors.INVALID_OPERATOR);

        // Check if the revenue address is not zero address
        require(revenueAddress != address(0), Errors.INVALID_REVENUE_ADDRESS);

        // Check if the fee rate is within the allowed range
        require(feeRate >= configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE()), Errors.INVALID_FEE_RATE);

        // Check if the deadline is in the future
        require(deadline == 0 || deadline > block.timestamp, Errors.INVALID_DEADLINE);

        // Check total stake is within limits
        uint256 minStake = configManager.getConfig(configManager.MIN_STAKE());
        uint256 maxStake = configManager.getConfig(configManager.MAX_STAKE());

        if (msg.value < minStake) revert(Errors.INSUFFICIENT_STAKE);
        if (msg.value > maxStake) revert(Errors.STAKE_EXCEEDS_MAX);

        // Create a new arbitrator info struct
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        require(arbitrator.arbitrator == address(0), Errors.ARBITRATOR_ALREADY_REGISTERED);
        arbitrator.arbitrator = msg.sender;
        // Set the arbitrator's operator
        arbitrator.operator = operator;

        // Set the arbitrator's revenue address
        arbitrator.revenueETHAddress = revenueAddress;
        // Set the arbitrator's Bitcoin address and public key
        arbitrator.operatorBtcAddress = btcAddress;
        arbitrator.operatorBtcPubKey = btcPubKey;

        // Set the arbitrator's fee rate
        arbitrator.currentFeeRate = feeRate;

        // Set the arbitrator's deadline
        arbitrator.deadLine = deadline;

        // Update the arbitrator's ETH amount
        arbitrator.ethAmount += msg.value;

        // Emit an event to notify the registration
        emit StakeAdded(arbitrator.arbitrator, address(0), msg.value);
        emit ArbitratorRegistered(
            msg.sender,
            operator,
            revenueAddress,
            btcAddress,
            btcPubKey,
            feeRate,
            deadline
        );
    }

    /**
     * @notice Register an arbitrator by staking NFTs
     * @param tokenIds Array of NFT token IDs to stake
     * @param operator Address of the arbitrator's operator
     * @param revenueAddress Address to receive revenue
     * @param btcAddress Bitcoin address of the arbitrator
     * @param btcPubKey Bitcoin public key of the arbitrator
     * @param feeRate Fee rate for arbitration
     * @param deadline Optional deadline for arbitration availability
     */
    function registerArbitratorByStakeNFT(
        uint256[] calldata tokenIds,
        address operator,
        address revenueAddress,
        string calldata btcAddress,
        bytes calldata btcPubKey,
        uint256 feeRate,
        uint256 deadline
    ) external {
        // Validate operator address
        if (operator == address(0)) revert(Errors.INVALID_OPERATOR);

        // Validate revenue address
        if (revenueAddress == address(0)) revert(Errors.INVALID_REVENUE_ADDRESS);

        // Validate fee rate
        uint256 minFeeRate = configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE());
        if (feeRate < minFeeRate) revert(Errors.INVALID_FEE_RATE);

        // Validate deadline
        if (deadline != 0 && deadline <= block.timestamp) revert(Errors.INVALID_DEADLINE);

        // Validate token IDs
        if (tokenIds.length == 0) revert(Errors.EMPTY_TOKEN_IDS);

        // Check arbitrator is not already registered
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator != address(0)) revert(Errors.ARBITRATOR_ALREADY_REGISTERED);

        // Initialize arbitrator information
        arbitrator.arbitrator = msg.sender;
        arbitrator.operator = operator;
        arbitrator.revenueETHAddress = revenueAddress;
        arbitrator.operatorBtcAddress = btcAddress;
        arbitrator.operatorBtcPubKey = btcPubKey;
        arbitrator.currentFeeRate = feeRate;
        arbitrator.deadLine = deadline;

       // Calculate total NFT value
        uint256 totalNftValue = _calculateNFTValue(tokenIds);

        // Transfer NFTs and update arbitrator's token list
        _transferAndStoreNFTs(arbitrator, tokenIds);

        // Validate total stake
        _validateStakeAmount(arbitrator, totalNftValue);

        // Set or validate NFT contract
        _setOrValidateNFTContract(arbitrator);

        emit StakeAdded(msg.sender, address(nftContract), totalNftValue);
        // Emit arbitrator registration event
        emit ArbitratorRegistered(
            msg.sender,
            operator,
            revenueAddress,
            btcAddress,
            btcPubKey,
            feeRate,
            deadline
        );
    }

    /**
     * @notice Stake ETH as collateral
     */
    function stakeETH() external payable override {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        
        if (arbitrator.arbitrator == address(0)) {
           revert(Errors.ARBITRATOR_NOT_REGISTERED);
        }

        // Calculate total NFT value
        uint256 totalNftValue = getTotalNFTStakeValue(msg.sender);

        // Update ETH amount and calculate total stake
        uint256 newEthAmount = arbitrator.ethAmount + msg.value;
        arbitrator.ethAmount = newEthAmount;
        uint256 totalStakeValue = newEthAmount + totalNftValue;

        // Check total stake is within limits
        uint256 minStake = configManager.getConfig(configManager.MIN_STAKE());
        uint256 maxStake = configManager.getConfig(configManager.MAX_STAKE());
        
        if (totalStakeValue < minStake) revert(Errors.INSUFFICIENT_STAKE);
        if (totalStakeValue > maxStake) revert(Errors.STAKE_EXCEEDS_MAX);

        emit StakeAdded(arbitrator.arbitrator, address(0), msg.value);
    }

    /**
     * @notice Allows arbitrators to stake NFTs
     * @param tokenIds Array of NFT token IDs to stake
     */
    function stakeNFT(uint256[] calldata tokenIds) external override {
        if (tokenIds.length == 0) revert(Errors.EMPTY_TOKEN_IDS);

        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        
        // If first time staking, set arbitrator address
        if (arbitrator.arbitrator == address(0)) {
            revert(Errors.ARBITRATOR_NOT_REGISTERED);
        }

        // Calculate total NFT value
        uint256 totalNftValue = _calculateNFTValue(tokenIds);

        // Transfer NFTs and update arbitrator's token list
        _transferAndStoreNFTs(arbitrator, tokenIds);

        // Validate total stake
        _validateStakeAmount(arbitrator, totalNftValue);

        // Set or validate NFT contract
        _setOrValidateNFTContract(arbitrator);

        emit StakeAdded(msg.sender, address(nftContract), totalNftValue);
    }

    /**
     * @dev Calculate the total value of NFTs
     * @param tokenIds Array of token IDs to calculate value for
     * @return Total NFT value
     */
    function _calculateNFTValue(uint256[] calldata tokenIds) internal view returns (uint256) {
        uint256 totalNftValue = 0;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            (,BNFTVoteInfo memory info) = nftInfo.getNftInfo(tokenIds[i]);
            for (uint256 j = 0; j < info.infos.length; j++) {
                totalNftValue += info.infos[j].votes * (10 ** 10);
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
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftContract.transferFrom(msg.sender, address(this), tokenIds[i]);
            arbitrator.nftTokenIds.push(tokenIds[i]);
        }
    }

    /**
     * @dev Validate total stake amount
     * @param arbitrator Arbitrator storage reference
     * @param totalNftValue Total value of NFTs being staked
     */
    function _validateStakeAmount(
        DataTypes.ArbitratorInfo storage arbitrator, 
        uint256 totalNftValue
    ) internal view {
        uint256 totalStakeValue = arbitrator.ethAmount + totalNftValue;
        uint256 minStake = configManager.getConfig(configManager.MIN_STAKE());
        uint256 maxStake = configManager.getConfig(configManager.MAX_STAKE());
        
        if (totalStakeValue < minStake) revert(Errors.INSUFFICIENT_STAKE);
        if (totalStakeValue > maxStake) revert(Errors.STAKE_EXCEEDS_MAX);
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
            revert(Errors.INVALID_NFT_CONTRACT);
        }
    }

    /**
     * @notice Allows arbitrators to withdraw their entire stake
     * @dev Can only be called when not handling any transactions
     * Withdraws entire stake amount at once
     */
    function unstake() external override notWorking {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (isFrozenArbitrator(arbitrator)) revert(Errors.IS_FROZEN);
        require(arbitrator.ethAmount > 0 || arbitrator.nftTokenIds.length > 0, "NoStake");
        
        uint256 amount = arbitrator.ethAmount;
        arbitrator.ethAmount = 0;
        arbitrator.status = DataTypes.ArbitratorStatus.Terminated;
        
        // Transfer NFTs back to arbitrator if any
        if (arbitrator.nftContract != address(0) && arbitrator.nftTokenIds.length > 0) {
            for (uint256 i = 0; i < arbitrator.nftTokenIds.length; i++) {
                nftContract.transferFrom(
                    address(this),
                    msg.sender,
                    arbitrator.nftTokenIds[i]
                );
            }
            arbitrator.nftTokenIds = new uint256[](0);
            arbitrator.nftContract = address(0);
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
        
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert(Errors.ARBITRATOR_NOT_REGISTERED);
        
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
        if (arbitrator.arbitrator == address(0)) revert(Errors.ARBITRATOR_NOT_REGISTERED);
        arbitrator.revenueETHAddress = ethAddress;
        arbitrator.revenueBtcPubKey = btcPubKey;
        arbitrator.revenueBtcAddress = btcAddress;
        
        emit RevenueAddressesSet(msg.sender, ethAddress, btcPubKey, btcAddress);
    }

    /**
     * @notice Sets arbitrator's fee rate and term deadline
     * @param feeRate Fee rate in basis points (1% = 100)
     * @param deadline Unix timestamp for term end (0 for no end)
     * @dev Fee rate must be >= minimum rate from ConfigManager
     * Deadline must be in future if not zero
     */
    function setArbitratorParams(
        uint256 feeRate,
        uint256 deadline
    ) external override notWorking {
        require(feeRate >= configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE()), "FeeTooLow");
        require(deadline == 0 || deadline > block.timestamp, Errors.INVALID_DEADLINE);
        
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert(Errors.ARBITRATOR_NOT_REGISTERED);
        arbitrator.currentFeeRate = feeRate;
        arbitrator.deadLine = deadline;
        
        emit ArbitratorParamsSet(msg.sender, feeRate, deadline);
    }

    /**
     * @notice Pauses arbitrator services
     * @dev Can only be called when active and not working
     */
    function pause() external override notWorking {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert(Errors.ARBITRATOR_NOT_REGISTERED);
        require(arbitrator.status == DataTypes.ArbitratorStatus.Active, "Not active");
        arbitrator.status = DataTypes.ArbitratorStatus.Paused;
        
        emit ArbitratorPaused(msg.sender);
    }

    /**
     * @notice Resumes arbitrator services
     * @dev Can only be called when paused and not working
     */
    function unpause() external override notWorking {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.arbitrator == address(0)) revert(Errors.ARBITRATOR_NOT_REGISTERED);
        require(arbitrator.status == DataTypes.ArbitratorStatus.Paused, "not paused");
        arbitrator.status = DataTypes.ArbitratorStatus.Active;
        
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

    /**
     * @notice Check if an arbitrator is active and meets minimum stake requirement
     * @param arbitratorAddress Address of the arbitrator to check
     * @return bool True if arbitrator is active and meets minimum stake
     */
    function isActiveArbitrator(address arbitratorAddress) 
        external 
        view 
        override 
        returns (bool) 
    {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[arbitratorAddress];
        if (arbitrator.status != DataTypes.ArbitratorStatus.Active) {
            return false;
        }
        // no set deadline
        if (arbitrator.deadLine == 0) {
            return false;
        }
        // check deadline time in life circle
        if (arbitrator.deadLine <= block.timestamp) {
            return false;
        }
        // freeze lock time
        if (isFrozenArbitrator(arbitrator)) {
            return false;
        }
        uint256 totalStakeValue = this.getAvailableStake(arbitratorAddress);
        return totalStakeValue >= configManager.getConfig(configManager.MIN_STAKE());
    }

    function isFrozenArbitrator( DataTypes.ArbitratorInfo memory arbitrator) internal view returns(bool) {
        uint256 freeze_period = configManager.getArbitrationFrozenPeriod();
        if (arbitrator.lastCompletedWorkTime == 0) {
            return false;
        }
        if (arbitrator.lastCompletedWorkTime + freeze_period <= block.timestamp) {
            return false;
        }
        return false;
    }
    /**
     * @notice Get available stake amount for an arbitrator
     * @param arbitrator Address of the arbitrator
     * @return uint256 Available stake amount (ETH + NFT value)
     */
    function getAvailableStake(address arbitrator) external view override returns (uint256) {
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
     * @notice Checks if an arbitrator can unstake
     * @param arbitrator Address of the arbitrator
     * @return bool True if arbitrator is not working
     */
    function canUnStake(address arbitrator) external view returns (bool) {
        if (isFrozenArbitrator(arbitrators[arbitrator])) return false;
        return arbitrators[arbitrator].activeTransactionId == bytes32(0);
    }

    /**
     * @notice Checks if an arbitrator is paused
     * @param arbitrator Address of the arbitrator
     * @return bool True if arbitrator is paused
     */
    function isPaused(address arbitrator) external view returns (bool) {
        return arbitrators[arbitrator].status == DataTypes.ArbitratorStatus.Paused;
    }

    /**
     * @notice Set arbitrator to working status with specific transaction
     * @param arbitrator The address of the arbitrator
     * @param transactionId The ID of the transaction
     */
    function setArbitratorWorking(
        address arbitrator, 
        bytes32 transactionId
    ) external onlyTransactionManager {
        DataTypes.ArbitratorInfo storage arbitratorInfo = arbitrators[arbitrator];
        
        // Validate arbitrator state
        if (arbitratorInfo.status != DataTypes.ArbitratorStatus.Active)
            revert(Errors.ARBITRATOR_NOT_ACTIVE);
        if (arbitratorInfo.activeTransactionId != bytes32(0))
            revert(Errors.ARBITRATOR_ALREADY_WORKING);
            
        // Update arbitrator state
        arbitratorInfo.status = DataTypes.ArbitratorStatus.Working;
        arbitratorInfo.activeTransactionId = transactionId;
        
        emit ArbitratorStatusChanged(arbitrator, DataTypes.ArbitratorStatus.Working);
    }

    /**
     * @notice Release arbitrator from working status
     * @param arbitrator The address of the arbitrator
     * @param transactionId The ID of the transaction
     */
    function releaseArbitrator(
        address arbitrator, 
        bytes32 transactionId
    ) external onlyTransactionManager {
        DataTypes.ArbitratorInfo storage arbitratorInfo = arbitrators[arbitrator];
        
        // Validate arbitrator state
        if (arbitratorInfo.status != DataTypes.ArbitratorStatus.Working)
            revert(Errors.ARBITRATOR_NOT_WORKING);
        if (arbitratorInfo.activeTransactionId != transactionId)
            revert(Errors.INVALID_TRANSACTION_ID);
            
        // Update arbitrator state
        arbitratorInfo.status = DataTypes.ArbitratorStatus.Active;
        arbitratorInfo.activeTransactionId = bytes32(0);
        
        emit ArbitratorStatusChanged(arbitrator, DataTypes.ArbitratorStatus.Active);
    }

    /**
     * @notice Terminate an arbitrator and clear their stake
     * @dev Only callable by compensation manager, transfers all stake to compensation manager
     * @param arbitrator The address of the arbitrator to terminate
     */
    function terminateArbitratorWithSlash(address arbitrator) external override onlyCompensationManager {
        DataTypes.ArbitratorInfo storage info = arbitrators[arbitrator];
        if (info.arbitrator == address(0)) revert(Errors.ARBITRATOR_NOT_REGISTERED);

        // Set status to terminated
        info.status = DataTypes.ArbitratorStatus.Terminated;
        
        // Transfer ETH stake to compensation manager
        uint256 ethAmount = info.ethAmount;
        if (ethAmount > 0) {
            info.ethAmount = 0;
            (bool success, ) = compensationManager.call{value: ethAmount}("");
            if (!success) revert(Errors.TRANSFER_FAILED);
        }

        // Transfer NFTs to compensation manager if any
        if (info.nftContract != address(0) && info.nftTokenIds.length > 0) {
            for (uint256 i = 0; i < info.nftTokenIds.length; i++) {
                IERC721(info.nftContract).transferFrom(
                    address(this),
                    compensationManager,
                    info.nftTokenIds[i]
                );
            }
            info.nftTokenIds = new uint256[](0);
        }

        emit ArbitratorStatusChanged(arbitrator, DataTypes.ArbitratorStatus.Terminated);
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
                totalValue += info.infos[j].votes * (10 ** 10);
            }
        }

        return totalValue;
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
         if (initialized) revert(Errors.ALREADY_INITIALIZED);
          if (_transactionManager == address(0)) revert(Errors.ZERO_ADDRESS);
          if (_compensationManager == address(0)) revert(Errors.ZERO_ADDRESS);
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
        if (_transactionManager == address(0)) revert(Errors.ZERO_ADDRESS);
        address oldManager = transactionManager;
        transactionManager = _transactionManager;
        emit TransactionManagerUpdated(oldManager, _transactionManager);
    }

    /**
     * @notice Set the compensation manager address
     * @param _compensationManager New compensation manager address
     */
    function setCompensationManager(address _compensationManager) external override onlyOwner {
        if (_compensationManager == address(0)) revert(Errors.ZERO_ADDRESS);
        address oldManager = compensationManager;
        compensationManager = _compensationManager;
        emit CompensationManagerUpdated(oldManager, _compensationManager);
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}
