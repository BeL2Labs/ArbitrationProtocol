// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

interface IArbitratorManager {
    // Staking operations
    function stakeETH() external payable;
    function stakeNFT(uint256[] calldata tokenIds) external;
    function unstake() external;  // Withdraw all staked assets

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
    
    // Set arbitrator parameters
    function setArbitratorParams(
        uint256 feeRate,
        uint256 deadline  // In seconds, Arbitrator end of term
    ) external;
    
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

    // Query interfaces
    function getArbitratorInfo(address arbitrator) external view returns (DataTypes.ArbitratorInfo memory);
    function isActiveArbitrator(address arbitrator) external view returns (bool);
    function getAvailableStake(address arbitrator) external view returns (uint256);
    function getTotalNFTStakeValue(address arbitrator) external view returns (uint256);

    /**
     * @notice Check if the given operator address is the operator of the arbitrator
     * @param arbitrator The address of the arbitrator
     * @param operator The address to check
     * @return True if the operator is the arbitrator's operator, false otherwise
     */
    function isOperatorOf(address arbitrator, address operator) external view returns (bool);

    /**
     * @notice Check if the arbitrator can unstake their funds
     * @param arbitrator The address of the arbitrator
     * @return True if the arbitrator can unstake, false otherwise
     */
    function canUnstake(address arbitrator) external view returns (bool);

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

    // Events
    event ArbitratorStatusChanged(address indexed arbitrator, DataTypes.ArbitratorStatus status);
    event Initialized(address indexed transactionManager, address indexed compensationManager);
    event StakeAdded(
        address indexed arbitrator, 
        address indexed assetAddress,  // 0x0 for ETH
        uint256 amount
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
    
    event ArbitratorParamsSet(
        address indexed arbitrator,
        uint256 feeRate,
        uint256 deadline
    );
    
    event ArbitratorPaused(address indexed arbitrator);
    event ArbitratorUnpaused(address indexed arbitrator);
    event TransactionManagerUpdated(address indexed oldManager, address indexed newManager);
    event CompensationManagerUpdated(address indexed oldManager, address indexed newManager);
}