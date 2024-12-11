// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

interface IDAppRegistry {
    /**
     * @notice Registration fee amount
     */
    function REGISTRATION_FEE() external view returns (uint256);

    /**
     * @notice Register DApp
     * @param dappContract DApp contract address
     * @dev Requires payment of REGISTRATION_FEE in ETH
     */
    function registerDApp(address dappContract) external payable;

    /**
     * @notice Authorize DApp
     * @param dapp DApp address
     */
    function authorizeDApp(address dapp) external;

    /**
     * @notice Deregister DApp
     * @param dapp DApp address
     * @dev Set DApp status to Terminated and refunds the registration fee to the DApp owner
     */
    function deregisterDApp(address dapp) external;

    /**
     * @notice Check if DApp is registered
     * @param dapp DApp address
     * @return Returns true if DApp is registered, false otherwise
     */
    function isRegistered(address dapp) external view returns (bool);

    /**
     * @notice Check if DApp is active (authorized)
     * @param dapp DApp address
     * @return Returns true if DApp is active, false otherwise
     */
    function isActiveDApp(address dapp) external view returns (bool);

    /**
     * @notice Get DApp owner
     * @param dapp DApp address
     * @return DApp owner address
     */
    function getDAppOwner(address dapp) external view returns (address);

    /**
     * @notice Get DApp status
     * @param dapp DApp address
     * @return DApp status
     */
    function getDAppStatus(address dapp) external view returns (DataTypes.DAppStatus);

    /**
     * @notice DApp registration event
     * @param dapp DApp address
     * @param owner DApp owner
     */
    event DAppRegistered(address indexed dapp, address indexed owner);

    /**
     * @notice DApp authorization event
     * @param dapp DApp address
     */
    event DAppAuthorized(address indexed dapp);

    /**
     * @notice DApp suspension event
     * @param dapp DApp address
     */
    event DAppSuspended(address indexed dapp);

    /**
     * @notice DApp deregistration event
     * @param dapp DApp address
     */
    event DAppDeregistered(address indexed dapp);
}