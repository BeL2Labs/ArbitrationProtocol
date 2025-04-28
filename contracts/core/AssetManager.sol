// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/IBNFTInfo.sol";
import "../interfaces/IAssetOracle.sol";
import "../interfaces/ITokenWhitelist.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";

/**
 * @title AssetManager
 * @notice Contract for managing arbitrator assets in the BeLayer2 arbitration protocol
 * @dev This contract handles the storage and transfer of staked ETH, ERC20 tokens and NFTs
 */
contract AssetManager is ReentrancyGuardUpgradeable, OwnableUpgradeable {
    address private constant ETH_TOKEN =
        address(0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4);
    address private constant BTC_TOKEN =
        address(0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1);

    // State variables
    address public arbitratorManager;
    IERC721 public nftContract;
    IBNFTInfo public nftInfo;
    IAssetOracle public assetOracle;
    ITokenWhitelist public tokenWhitelist;

    // Mappings
    mapping(address => uint256) public ethBalances;
    mapping(address => address) public erc20Tokens;
    mapping(address => uint256) public erc20Balances;
    mapping(address => uint256[]) public nftTokenIds;

    // Events
    event ETHDeposited(address indexed arbitrator, uint256 amount);
    event ETHWithdrawn(
        address indexed arbitrator,
        address indexed recipient,
        uint256 amount
    );
    event ERC20Deposited(
        address indexed arbitrator,
        address indexed token,
        uint256 amount
    );
    event ERC20Withdrawn(
        address indexed arbitrator,
        address indexed token,
        address indexed recipient,
        uint256 amount
    );
    event NFTDeposited(address indexed arbitrator, uint256[] tokenIds);
    event NFTWithdrawn(
        address indexed arbitrator,
        address indexed recipient,
        uint256[] tokenIds
    );
    event NFTContractUpdated(address indexed nftContract);

    // Modifiers
    modifier onlyArbitratorManager() {
        if (msg.sender != arbitratorManager) {
            revert("not arbitrator manager");
        }
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _arbitratorManager,
        address _nftContract,
        address _nftInfo,
        address _assetOracle,
        address _tokenWhitelist
    ) public initializer virtual {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);

        if (
            _arbitratorManager == address(0) ||
            _nftContract == address(0) ||
            _nftInfo == address(0) ||
            _assetOracle == address(0) ||
            _tokenWhitelist == address(0)
        ) {
            revert(Errors.ZERO_ADDRESS);
        }

        arbitratorManager = _arbitratorManager;
        nftContract = IERC721(_nftContract);
        nftInfo = IBNFTInfo(_nftInfo);
        assetOracle = IAssetOracle(_assetOracle);
        tokenWhitelist = ITokenWhitelist(_tokenWhitelist);
    }

    function depositETH(
        address arbitrator
    ) external payable onlyArbitratorManager {
        if (arbitrator == address(0) || msg.value == 0) {
            revert(Errors.INVALID_PARAMETER);
        }
        ethBalances[arbitrator] += msg.value;
        emit ETHDeposited(arbitrator, msg.value);
    }

    function withdrawETH(
        address arbitrator,
        address recipient,
        uint256 amount
    ) external onlyArbitratorManager {
        if (arbitrator == address(0) || amount == 0 || recipient == address(0)) {
            revert(Errors.INVALID_PARAMETER);
        }
        if (ethBalances[arbitrator] < amount) {
            revert(Errors.INSUFFICIENT_BALANCE);
        }

        ethBalances[arbitrator] -= amount;
        (bool success, ) = payable(recipient).call{value: amount}("");
        if (!success) {
            revert(Errors.TRANSFER_FAILED);
        }

        emit ETHWithdrawn(arbitrator, recipient, amount);
    }

    function depositERC20(
        address arbitrator,
        address token,
        uint256 amount
    ) external onlyArbitratorManager {
        if (
            arbitrator == address(0) ||
            amount == 0 ||
            token == address(0) ||
            !tokenWhitelist.isWhitelisted(token)
        ) {
            revert(Errors.INVALID_PARAMETER);
        }

        // check if staked token
        address stakedToken = erc20Tokens[arbitrator];
        if (stakedToken != address(0) && stakedToken != token) {
            revert(Errors.TOKEN_NOT_SUPPORTED);
        }

        if (stakedToken == address(0)) {
            erc20Tokens[arbitrator] = token;
        }

        erc20Balances[arbitrator] += amount;
        if (!IERC20(token).transferFrom(arbitrator, address(this), amount)) {
            revert(Errors.TRANSFER_FAILED);
        }

        emit ERC20Deposited(arbitrator, token, amount);
    }

    function withdrawERC20(
        address arbitrator,
        address token,
        address recipient,
        uint256 amount
    ) external onlyArbitratorManager {
        if (
            arbitrator == address(0) ||
            amount == 0 ||
            token == address(0) ||
            recipient == address(0)
        ) {
            revert(Errors.INVALID_PARAMETER);
        }

        if (erc20Tokens[arbitrator] != token) {
            revert(Errors.TOKEN_NOT_SUPPORTED);
        }

        if (erc20Balances[arbitrator] < amount) {
            revert(Errors.INSUFFICIENT_BALANCE);
        }

        erc20Balances[arbitrator] -= amount;

        // if balance is 0, clear token record
        if (erc20Balances[arbitrator] == 0) {
            erc20Tokens[arbitrator] = address(0);
        }

        if (!IERC20(token).transfer(recipient, amount)) {
            revert(Errors.TRANSFER_FAILED);
        }

        emit ERC20Withdrawn(arbitrator, token, recipient, amount);
    }

    function depositNFTs(
        address arbitrator,
        uint256[] calldata tokenIds
    ) external onlyArbitratorManager {
        if (arbitrator == address(0) || tokenIds.length == 0) {
            revert(Errors.INVALID_PARAMETER);
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftContract.transferFrom(arbitrator, address(this), tokenIds[i]);
            nftTokenIds[arbitrator].push(tokenIds[i]);
        }

        emit NFTDeposited(arbitrator, tokenIds);
    }

    function withdrawNFTs(
        address arbitrator,
        address recipient
    ) external onlyArbitratorManager {
        if (arbitrator == address(0) || recipient == address(0)) {
            revert(Errors.INVALID_PARAMETER);
        }

        uint256[] memory tokenIds = nftTokenIds[arbitrator];
        if (tokenIds.length == 0) {
            revert(Errors.EMPTY_TOKEN_IDS);
        }

        // clear tokenIds record
        delete nftTokenIds[arbitrator];

        for (uint256 i = 0; i < tokenIds.length; i++) {
            nftContract.transferFrom(address(this), recipient, tokenIds[i]);
        }

        emit NFTWithdrawn(arbitrator, recipient, tokenIds);
    }

    function getArbitratorAssets(
        address arbitrator
    ) external view returns (DataTypes.ArbitratorAssets memory) {
        return
            DataTypes.ArbitratorAssets({
                ethAmount: ethBalances[arbitrator],
                erc20Token: erc20Tokens[arbitrator],
                erc20Amount: erc20Balances[arbitrator],
                nftContract: address(nftContract),
                nftTokenIds: nftTokenIds[arbitrator]
            });
    }

    function getArbitratorStakeValue(
        address arbitrator
    ) external view returns (uint256) {
        uint256 ethValue = ethBalances[arbitrator] + getNftValue(nftTokenIds[arbitrator]);
        ethValue += calculateAssetValueInETH(
            erc20Tokens[arbitrator],
            erc20Balances[arbitrator]
        );
        return ethValue;
    }

    function calculateAssetValueInETH(
        address token,
        uint256 amount
    ) public view returns (uint256) {
        if (amount == 0 || token == address(0)) {
            return 0;
        }

        uint256 tokenPrice = assetOracle.assetPrices(token);
        uint256 ethPrice = assetOracle.assetPrices(ETH_TOKEN);
        uint8 decimals = IERC20Metadata(token).decimals();

        // Convert token value to ETH: (amount * tokenPrice / 10^decimals) / ethPrice * 10^18
        return (amount * tokenPrice * 1e18) / (ethPrice * (10 ** decimals));
    }

    function ethToBTC(uint256 amount) external view returns (uint256) {
        uint256 eth_price = assetOracle.assetPrices(ETH_TOKEN);
        uint256 btc_price = assetOracle.assetPrices(BTC_TOKEN);
        //(eth_amount * eth_price / 1e18)/(btc_price)*1e8
        uint256 satoshi = (amount * eth_price * 1e8) / (btc_price * 1e18);
        if (satoshi < 1000) {
            satoshi = 1000;
        }
        return satoshi;
    }

    function getNftValue(
        uint256[] memory tokenIds
    ) public view returns (uint256) {
        uint256 nftValue;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            (, BNFTVoteInfo memory info) = nftInfo.getNftInfo(tokenIds[i]);
            for (uint256 j = 0; j < info.infos.length; j++) {
                uint256 votes = uint256(info.infos[j].votes);
                nftValue += votes * 10 ** 10;
            }
        }

        return nftValue;
    }

    function isSupportToken(address token) external view returns (bool) {
        return tokenWhitelist.isWhitelisted(token);
    }

    /**
     * @notice Set the NFT contract address
     * @dev Can only be called by the contract owner
     * @param _nftContract New NFT contract address
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        if (_nftContract == address(0)) revert(Errors.ZERO_ADDRESS);

        nftContract = IERC721(_nftContract);

        emit NFTContractUpdated(_nftContract);
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}
