// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

interface IArbitratorManager {
    // Staking operations
    function stakeETH() external payable;
    function stakeNFT(uint256[] calldata tokenIds) external;
    function unstake() external;  // Withdraw all staked assets

    /// @notice Registers a new arbitrator by staking ETH
    /// @dev Allows an entity to become an arbitrator in the protocol by staking ETH
    /// @param defaultBtcAddress Bitcoin address for receiving arbitrator earnings set to revenueBtcAddress and operatorBtcAddress
    /// @param defaultBtcPubKey Public key corresponding to the Bitcoin address set to revenueBtcPubKey and operatorBtcPubKey
    /// @param feeRate Percentage fee (in basis points) that the arbitrator will charge for services (4 decimal places)
    /// @param btcFeeRate Percentage fee (in basis points) that the arbitrator will charge for services (4 decimal places)
    /// @param deadline Timestamp by which the registration must be completed (0 for no deadline)
    /// @dev Requires msg.value to meet the minimum ETH staking requirement
    /// @dev Sets the arbitrator's operator and revenue addresses to the sender by default
    /// @dev Emits an ArbitratorStatusChanged event upon successful registration
    function registerArbitratorByStakeETH(
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline) external payable;

    /// @notice Registers a new arbitrator by staking NFTs
    /// @dev Allows an entity to become an arbitrator in the protocol by staking NFTs
    /// @param tokenIds Array of NFT token IDs to be staked as collateral
    /// @param defaultBtcAddress Bitcoin address for receiving arbitrator earnings
    /// @param defaultBtcPubKey Public key corresponding to the Bitcoin address
    /// @param feeRate Percentage fee (in basis points) that the arbitrator will charge for services (4 decimal places)
    /// @param btcFeeRate Percentage fee (in basis points) that the arbitrator will charge for services (4 decimal places)
    /// @param deadline Timestamp by which the registration must be completed (0 for no deadline)
    /// @dev Requires a minimum number of NFTs to be staked
    /// @dev Sets the arbitrator's operator and revenue addresses to the sender by default
    /// @dev Emits an ArbitratorStatusChanged event upon successful registration
    function registerArbitratorByStakeNFT(
        uint256[] calldata tokenIds,
        string calldata defaultBtcAddress,
        bytes calldata defaultBtcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline) external;

    // Set operator information
    function setOperator(
        address operator,
        bytes calldata btcPubKey,
        string calldata btcAddress
    ) external;

    // Set revenue addresses
    function setRevenueAddresses(
        address ethAddress,
        bytes calldata btcPubKey,
        string calldata btcAddress
    ) external;
    
    /**
     * @dev Sets the fee rates for Ethereum and Bitcoin transactions.
     * @param ethFeeRate The fee rate for Ethereum transactions.
     * @param btcFeeRate The fee rate for Bitcoin transactions.
     */
    function setFeeRates(uint256 ethFeeRate, uint256 btcFeeRate) external;

    /**
     * @notice Set arbitrator deadline
     * @dev Only callable by arbitrator
     * @param deadline In seconds, Arbitrator end of term, must bigger than prev deadline
     */
    function setArbitratorDeadline(uint256 deadline) external;
    
    // Arbitrator status management
    function pause() external;    // Pause accepting new transactions
    function unpause() external;  // Resume accepting new transactions
    
    /**
     * @notice Set arbitrator to working status with specific transaction
     * @dev Only callable by authorized transaction manager
     * @param arbitrator The address of the arbitrator
     * @param transactionId The ID of the transaction
     */
    function setArbitratorWorking(address arbitrator, bytes32 transactionId) external;

    /**
     * @notice Release arbitrator from working status
     * @dev Only callable by authorized transaction manager
     * @param arbitrator The address of the arbitrator
     * @param transactionId The ID of the transaction
     */
    function releaseArbitrator(address arbitrator, bytes32 transactionId) external;

    /**
     * @notice Terminate an arbitrator and clear their stake
     * @dev Only callable by authorized compensation manager
     * @param arbitrator The address of the arbitrator to terminate
     */
    function terminateArbitratorWithSlash(address arbitrator) external;

    /**
     * @notice Freezes an arbitrator's status after submitted transactions
     * @dev Only callable by authorized transaction manager
     * @param arbitrator The address of the arbitrator to be frozen
     */
    function frozenArbitrator(address arbitrator) external;
    function isFrozenStatus(address arbitrator) external view returns (bool);

    // Query interfaces
    function getArbitratorInfo(address arbitrator) external view returns (DataTypes.ArbitratorInfo memory);
    function getArbitratorInfoExt(address arbitrator) external view returns (DataTypes.ArbitratorInfoExt memory);
    function isActiveArbitrator(address arbitrator) external view returns (bool);
    function getAvailableStake(address arbitrator) external view returns (uint256);
    function getTotalNFTStakeValue(address arbitrator) external view returns (uint256);
    function isConfigModifiable(address arbitrator) external view returns (bool);
    /**
     * @notice Get the arbitration fee based on the deadline
     * @param duration The duration for the transaction
     * @param arbitrator The address of the arbitrator
     * @return fee The calculated fee
     */
    function getFee(uint256 duration, address arbitrator) external view returns (uint256 fee);
    function getBtcFee(uint256 duration, address arbitrator) external view returns (uint256 fee);

    /**
     * @notice Check if the given operator address is the operator of the arbitrator
     * @param arbitrator The address of the arbitrator
     * @param operator The address to check
     * @return True if the operator is the arbitrator's operator, false otherwise
     */
    function isOperatorOf(address arbitrator, address operator) external view returns (bool);

    /**
     * @notice Check if the arbitrator is paused
     * @param arbitrator The address of the arbitrator
     * @return True if the arbitrator is paused, false otherwise
     */
    function isPaused(address arbitrator) external view returns (bool);
    
    // Manager address setters
    function setTransactionManager(address _transactionManager) external;
    function setCompensationManager(address _compensationManager) external;
    function initTransactionAndCompensationManager(address _transactionManager, address _compensationManager) external;
    function setNFTContract(address _nftContract) external;
    function setAssetOracle(address _assetOracle) external;

    // Events
    event InitializedManager(address indexed transactionManager, address indexed compensationManager);
    event StakeAdded(
        address indexed arbitrator, 
        address indexed assetAddress,  // 0x0 for ETH
        uint256 amount,
        uint256[] nftTokenIds
    );
    
    event StakeWithdrawn(
        address indexed arbitrator,
        address indexed assetAddress,  // 0x0 for ETH
        uint256 amount
    );
    
    event OperatorSet(
        address indexed arbitrator,
        address indexed operator,
        bytes btcPubKey,
        string btcAddress
    );
    
    event RevenueAddressesSet(
        address indexed arbitrator,
        address ethAddress,
        bytes btcPubKey,
        string btcAddress
    );

    event ArbitratorFeeRateUpdated(
        address indexed arbitrator,
        uint256 ethFeeRate,
        uint256 btcFeeRate
    );

    event ArbitratorDeadlineUpdated(address indexed arbitrator, uint256 deadline);
    
    event ArbitratorPaused(address indexed arbitrator);
    event ArbitratorUnpaused(address indexed arbitrator);
    event ArbitratorFrozen(address indexed arbitrator);
    event ArbitratorTerminatedWithSlash(address indexed arbitrator);
    event ArbitratorWorking(address indexed arbitrator, bytes32 indexed transactionId);
    event ArbitratorReleased(address indexed arbitrator, bytes32 indexed transactionId);

    event TransactionManagerUpdated(address indexed oldManager, address indexed newManager);
    event CompensationManagerUpdated(address indexed oldManager, address indexed newManager);
    event ArbitratorRegistered(
        address indexed arbitrator,
        address indexed operator,
        address revenueAddress,
        string btcAddress,
        bytes btcPubKey,
        uint256 feeRate,
        uint256 btcFeeRate,
        uint256 deadline
    );
    event NFTContractUpdated(address indexed oldNFTContract, address indexed newNFTContract);

    event AssetOracleUpdated(address indexed assetOracle);
    event ConfigManagerUpdated(address indexed newConfigManager);
}