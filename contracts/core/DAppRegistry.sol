// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IDAppRegistry.sol";
import "../interfaces/IConfigManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";

/**
 * @title DAppRegistry
 * @notice Manages DApp registration and authorization in the BeLayer2 arbitration protocol
 */
contract DAppRegistry is IDAppRegistry, OwnableUpgradeable {
    // DApp status mapping
    mapping(address => DataTypes.DAppStatus) private dappStatus;
    
    // DApp owner mapping
    mapping(address => address) private dappOwner;

    // Registration fee amount
    uint256 public constant REGISTRATION_FEE = 10 ether;

    // Config manager reference
    IConfigManager public configManager;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
   
    /**
     * @notice Initialize the contract with default configuration values
     */
    function initialize(address _configManager) public initializer {
         __Ownable_init(msg.sender);
         if (_configManager == address(0)) {
            revert Errors.ZERO_ADDRESS();
        }
        configManager = IConfigManager(_configManager);
    }
    /**
     * @notice Register DApp
     * @param dappContract DApp contract address
     */
    function registerDApp(address dappContract) external payable {
        if (dappContract == address(0)) {
            revert Errors.ZERO_ADDRESS();
        }

        if (dappStatus[dappContract] != DataTypes.DAppStatus.None) {
            revert Errors.DAPP_ALREADY_REGISTERED();
        }

        if (msg.value != REGISTRATION_FEE) {
            revert Errors.INSUFFICIENT_FEE();
        }

        // Get system fee collector address from config manager
        address feeCollector = configManager.getSystemFeeCollector();
        
        // Transfer registration fee to system fee collector
        (bool success, ) = feeCollector.call{value: msg.value}("");
        if (!success) revert Errors.TRANSFER_FAILED();

        dappStatus[dappContract] = DataTypes.DAppStatus.Pending;
        dappOwner[dappContract] = msg.sender;

        emit DAppRegistered(dappContract, msg.sender);
    }

    /**
     * @notice Authorize DApp
     * @param dapp DApp address
     */
    function authorizeDApp(address dapp) external onlyOwner {
        if (dapp == address(0)) {
            revert Errors.ZERO_ADDRESS();
        }

        if (dappStatus[dapp] != DataTypes.DAppStatus.Pending) {
            revert Errors.DAPP_NOT_REGISTERED();
        }

        dappStatus[dapp] = DataTypes.DAppStatus.Active;

        emit DAppAuthorized(dapp);
    }

    /**
     * @notice Deregister DApp
     * @param dapp DApp address
     */
    function deregisterDApp(address dapp) external {
        if (dapp == address(0)) {
            revert Errors.ZERO_ADDRESS();
        }

        if (dappStatus[dapp] == DataTypes.DAppStatus.None) {
            revert Errors.DAPP_NOT_REGISTERED();
        }

        if (msg.sender != dappOwner[dapp] && msg.sender != owner()) {
            revert Errors.NOT_AUTHORIZED();
        }

        dappStatus[dapp] = DataTypes.DAppStatus.Terminated;

        emit DAppDeregistered(dapp);
    }

    /**
     * @notice Check if DApp is registered
     * @param dapp DApp address
     * @return Returns true if DApp is registered, false otherwise
     */
    function isRegistered(address dapp) external view returns (bool) {
        return dappStatus[dapp] == DataTypes.DAppStatus.Pending;
    }

    /**
     * @notice Check if DApp is active (authorized)
     * @param dapp DApp address
     * @return Returns true if DApp is active, false otherwise
     */
    function isActiveDApp(address dapp) external view returns (bool) {
        return dappStatus[dapp] == DataTypes.DAppStatus.Active;
    }

    /**
     * @notice Get DApp owner
     * @param dapp DApp address
     * @return DApp owner address
     */
    function getDAppOwner(address dapp) external view returns (address) {
        return dappOwner[dapp];
    }

    /**
     * @notice Get DApp status
     * @param dapp DApp address
     * @return DApp status
     */
    function getDAppStatus(address dapp) external view returns (DataTypes.DAppStatus) {
        return dappStatus[dapp];
    }

    /**
     * @notice Set config manager address
     * @param _configManager New config manager address
     */
    function setConfigManager(address _configManager) external onlyOwner {
        if (_configManager == address(0)) revert Errors.ZERO_ADDRESS();
        
        address oldConfigManager = address(configManager);
        configManager = IConfigManager(_configManager);
        
        emit ConfigManagerUpdated(oldConfigManager, _configManager);
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}
