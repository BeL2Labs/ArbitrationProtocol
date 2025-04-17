// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/IArbitratorManager.sol";
import "./ConfigManager.sol";
import "./AssetManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";

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
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant FEE_RATE_MULTIPLIER = 10000;

    // Config manager reference for system parameters
    ConfigManager public configManager;

    // State variables
    address public transactionManager;
    address public compensationManager;
    AssetManager public assetManager;

    mapping(address => DataTypes.ArbitratorInfoExt) private arbitratorsExt;
    // Mapping of arbitrator addresses to their information
    mapping(address => DataTypes.ArbitratorInfo) private arbitrators;

    // Mapping to store ERC20 token stake amounts for arbitrators
    mapping(address => uint256) private erc20StakeAmounts;

    /**
     * @notice Ensures arbitrator is not currently handling any transactions
     * @dev Prevents critical state changes while arbitrator is working
     */
    modifier notWorking() {
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        if (arbitrator.activeTransactionId != bytes32(0)) {
            revert (Errors.ARBITRATOR_NOT_WORKING);
        }
        _;
    }

    modifier onlyTransactionManager() {
        if (msg.sender != transactionManager) 
            revert (Errors.NOT_TRANSACTION_MANAGER);
        _;
    }

    modifier onlyCompensationManager() {
        if (msg.sender != compensationManager) 
            revert (Errors.NOT_COMPENSATION_MANAGER);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with required addresses
     * @param _configManager Address of the ConfigManager contract
     */
    function initialize(
        address _configManager
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);

        if (_configManager == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }

        configManager = ConfigManager(_configManager);
    }

    function registerArbitratorByStakeETH(
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    ) external payable {
       _initializeArbitrator(
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );

        _validateStakeAmount(assetManager.calculateETHValue(msg.value));

        assetManager.depositETH{value: msg.value}(msg.sender);

        // Emit an event to notify the registration
        emit StakeAdded(msg.sender, address(0), msg.value, new uint256[](0));
        emit ArbitratorRegistered(
            msg.sender,
            msg.sender,
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
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

        _initializeArbitrator(
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );

        // Calculate total NFT value
        uint256 totalNftValue = assetManager.getNftValue(tokenIds);
        uint256 stakeValueInUSD = assetManager.calculateETHValue(totalNftValue);
        // Validate total stake
        _validateStakeAmount(stakeValueInUSD);

        // Emit events
        emit StakeAdded(msg.sender, address(assetManager.nftContract()), totalNftValue, tokenIds);
        emit ArbitratorRegistered(
            msg.sender,
            msg.sender, // operator
            msg.sender, // revenue ETH address
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );
    }

    /**
     * @notice Register arbitrator by staking ERC20 tokens
     * @param token The ERC20 token address to stake
     * @param amount The amount of tokens to stake
     * @param defaultBtcAddress Default Bitcoin address for the arbitrator
     * @param defaultBtcPubKey Default Bitcoin public key for the arbitrator
     * @param feeRate Fee rate for arbitration in ETH
     * @param btcFeeRate Fee rate for arbitration in BTC
     * @param deadline Deadline for the arbitrator's term
     */
    function registerArbitratorByStakeERC20(
        address token,
        uint256 amount,
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    ) external nonReentrant {
        if (token == address(0) || amount == 0) {
            revert (Errors.INVALID_PARAMETER);
        }
        if (!assetManager.isSupportToken(token)) {
            revert (Errors.TOKEN_NOT_SUPPORTED);
        }

        _initializeArbitrator(
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
            deadline
        );

        // Calculate token value and validate stake amount 
        _validateStakeAmount(assetManager.calculateAssetValue(token, amount));

        assetManager.depositERC20(msg.sender, token, amount);

        emit StakeAdded(msg.sender, token, amount, new uint256[](0));
        emit ArbitratorRegistered(
            msg.sender,
            msg.sender,
            msg.sender,
            defaultBtcAddress,
            defaultBtcPubKey,
            feeRate,
            btcFeeRate,
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
    ) internal {
        if (bytes(defaultBtcAddress).length == 0 || defaultBtcPubKey.length == 0 ) {
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

        // Check if the arbitrator is already registered
        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[arbitratorAddress];
        if (arbitrator.arbitrator != address(0)) {
            revert(Errors.ARBITRATOR_ALREADY_REGISTERED);
        }

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
        arbitratorsExt[arbitratorAddress].currentBTCFeeRate = btcFeeRate;
    }
    
    /**
     * @notice Stake ETH as collateral
     */
    function stakeETH() external payable override {
        if (msg.value == 0) {
            revert (Errors.INVALID_PARAMETER);
        }

        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        assetManager.depositETH{value: msg.value}(msg.sender);

        emit StakeAdded(msg.sender, address(0), msg.value, new uint256[](0));
    }

    /**
     * @notice Stake additional ERC20 tokens
     * @param amount The amount of tokens to stake
     */
    function stakeERC20(address token, uint256 amount) external nonReentrant {
        if (amount == 0 || token == address(0) || !assetManager.isSupportToken(token)) {
            revert(Errors.INVALID_PARAMETER);
        }
        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        assetManager.depositERC20(msg.sender, token, amount);

        emit StakeAdded(msg.sender, token, amount, new uint256[](0));
    }

    /**
     * @notice Allows arbitrators to stake NFTs
     * @param tokenIds Array of NFT token IDs to stake
     */
    function stakeNFT(uint256[] calldata tokenIds) external override {
        if (tokenIds.length == 0) revert (Errors.EMPTY_TOKEN_IDS);

        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        assetManager.depositNFTs(msg.sender, tokenIds);

        emit StakeAdded(msg.sender, address(assetManager.nftContract()), assetManager.getNftValue(tokenIds), tokenIds);
    }

    /**
     * @dev Validate total stake amount
     * @param stakeValueInUSD Total value being staked
     */
    function _validateStakeAmount(
        uint256 stakeValueInUSD
    ) internal view {
        uint256 minStake = configManager.getConfig(configManager.MIN_STAKE());
        uint256 maxStake = configManager.getConfig(configManager.MAX_STAKE());
        
        if (stakeValueInUSD < minStake) revert (Errors.INSUFFICIENT_STAKE);
        if (stakeValueInUSD > maxStake) revert (Errors.STAKE_EXCEEDS_MAX);
    }

    /**
     * @notice Allows arbitrators to withdraw their entire stake
     * @dev Can only be called when not handling any transactions
     * Withdraws entire stake amount at once
     */
    function unstake() external override nonReentrant notWorking {
        if(!isConfigModifiable(msg.sender)) revert (Errors.STAKE_STILL_LOCKED);

        DataTypes.ArbitratorAssets memory arbitratorAssets = assetManager.getArbitratorAssets(msg.sender);
        if (arbitratorAssets.ethAmount == 0
            && arbitratorAssets.nftTokenIds.length == 0
            && arbitratorAssets.erc20Amount == 0) {
            revert(Errors.NO_STAKE_AVAILABLE);
        }

        transferStakes(msg.sender, arbitratorAssets, msg.sender);
        emit StakeWithdrawn(msg.sender, 
            arbitratorAssets.ethAmount,
            arbitratorAssets.erc20Token,
            arbitratorAssets.erc20Amount,
            arbitratorAssets.nftContract,
            arbitratorAssets.nftTokenIds
        );
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
        if (operator == address(0)) {
            revert (Errors.INVALID_OPERATOR);
        }

        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
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
        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        DataTypes.ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        arbitrator.revenueETHAddress = ethAddress;
        arbitrator.revenueBtcPubKey = btcPubKey;
        arbitrator.revenueBtcAddress = btcAddress;
        
        emit RevenueAddressesSet(msg.sender, ethAddress, btcPubKey, btcAddress);
    }

    function setFeeRates(uint256 ethFeeRate, uint256 btcFeeRate) external override {
        if (ethFeeRate < configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE())
            || btcFeeRate < configManager.getConfig(configManager.TRANSACTION_MIN_BTC_FEE_RATE())) {
            revert (Errors.INVALID_FEE_RATE);
        }

        if (!isConfigModifiable(msg.sender)) {
            revert (Errors.CONFIG_NOT_MODIFIABLE);
        }

        arbitrators[msg.sender].currentFeeRate = ethFeeRate;
        arbitratorsExt[msg.sender].currentBTCFeeRate = btcFeeRate;

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
        if (arbitrator.paused) {
            revert (Errors.ALREADY_PAUSED);
        }
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
        if (!arbitrator.paused) {
            revert (Errors.NOT_PAUSED);
        }
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
        DataTypes.ArbitratorInfo memory arbitrator = arbitrators[arbitratorAddress];
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
        return isFrozenArbitrator(arbitratorInfo);
    }

    function isFrozenArbitrator(DataTypes.ArbitratorInfo memory arbitrator) private view returns(bool) {
        uint256 freeze_period = configManager.getArbitrationFrozenPeriod();
        if (arbitrator.lastSubmittedWorkTime == 0) {
            return false;
        }
        if (arbitrator.lastSubmittedWorkTime + freeze_period > block.timestamp) {
            return true;
        }
        return false;
    }

    function getArbitratorAssets(address arbitrator) external view returns (DataTypes.ArbitratorAssets memory) {
        return assetManager.getArbitratorAssets(arbitrator);
    }

    /**
     * @notice Get available stake amount for an arbitrator
     * @param arbitrator Address of the arbitrator
     * @return uint256 Available stake amount (ETH + NFT + erc20 in usd value)
     */
    function getAvailableStake(address arbitrator) public view override returns (uint256) {
        return assetManager.getArbitratorStakeValue(arbitrator);
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
        if (arbitratorInfo.arbitrator == address(0)
            || arbitratorInfo.activeTransactionId != bytes32(0)
            || isFrozenArbitrator(arbitratorInfo)) return false;

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
        DataTypes.ArbitratorInfo memory info = arbitrators[arbitrator];
        if (info.arbitrator == address(0)) revert (Errors.ARBITRATOR_NOT_REGISTERED);

        transferStakes(arbitrator, assetManager.getArbitratorAssets(msg.sender), compensationManager);

        emit ArbitratorTerminatedWithSlash(arbitrator);
    }

    function transferStakes(
        address arbitrator,
        DataTypes.ArbitratorAssets memory arbitratorAssets,
        address receiver) private {
        // Transfer staked ETH
        if (arbitratorAssets.ethAmount > 0) {
            assetManager.withdrawETH(arbitrator, receiver, arbitratorAssets.ethAmount);
        }

        // Transfer staked ERC20 tokens
        if (arbitratorAssets.erc20Token != address(0) && arbitratorAssets.erc20Amount > 0) {
            assetManager.withdrawERC20(arbitrator, arbitratorAssets.erc20Token, receiver, arbitratorAssets.erc20Amount);
        }

        // Transfer NFTs if any
        if (arbitratorAssets.nftTokenIds.length > 0) {
            assetManager.withdrawNFTs(arbitrator, receiver);
        }
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
     * @notice Get the arbitration fee based on the deadline
     * @param duration The duration for the transaction
     * @param arbitrator The address of the arbitrator
     * @return fee The calculated fee
     */
    function getFee(uint256 duration, address arbitrator) external view returns (uint256 fee) {
        uint256 feeRate = arbitrators[arbitrator].currentFeeRate;
        return _getFee(arbitrator, feeRate, duration);
    }

    function _getFee(address arbitrator, uint256 feeRate, uint256 duration) internal view returns (uint256) {
        // Calculate and validate fee
        // fee = stake * (duration / secondsPerYear) * (feeRate / feeRateMultiplier)
        uint256 totalStake = getAvailableStake(arbitrator);
        return (totalStake * duration * feeRate) / (SECONDS_PER_YEAR * FEE_RATE_MULTIPLIER);
    }

    function getBtcFee(uint256 duration, address arbitrator) external view returns (uint256 fee) {
        uint256 btcFeeRate = arbitratorsExt[arbitrator].currentBTCFeeRate;
        if (btcFeeRate > 0) {
            uint256 ethFee = _getFee(arbitrator, btcFeeRate, duration);
            return assetManager.ethToBTC(ethFee);
        }
        return 0;
    }

    // Setter for ConfigManager
    function setConfigManager(address _configManager) external onlyOwner {
        if (_configManager == address(0)) {
            revert (Errors.INVALID_PARAMETER);
        }
        configManager = ConfigManager(_configManager);
        emit ConfigManagerUpdated(address(_configManager));
    }

    /**
     * @notice Set the asset manager address
     * @dev Can only be called by the contract owner
     * @param _assetManager New asset manager address
     */
    function setAssetManager(address _assetManager) external onlyOwner {
        if (_assetManager == address(0))
            revert (Errors.ZERO_ADDRESS);

        assetManager = AssetManager(_assetManager);
        emit AssetManagerUpdated(_assetManager);
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}
