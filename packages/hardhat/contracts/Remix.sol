pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";

interface IRemix {
    function requestDerivative(address) external returns (bool);
}

///
/// @dev Interface for the NFT Royalty Standard
///
interface IERC2981 is IERC165 {
    /// ERC165 bytes to add to interface array - set in parent contract
    /// implementing this standard
    ///
    /// bytes4(keccak256("royaltyInfo(uint256,uint256)")) == 0x2a55205a
    /// bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    /// _registerInterface(_INTERFACE_ID_ERC2981);

    /// @notice Called with the sale price to determine how much royalty
    //          is owed and to whom.
    /// @param _tokenId - the NFT asset queried for royalty information
    /// @param _salePrice - the sale price of the NFT asset specified by _tokenId
    /// @return receiver - address of who should be sent the royalty payment
    /// @return royaltyAmount - the royalty payment amount for _salePrice
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);
}

contract Remix is ERC1155Supply, IERC2981, ERC165Storage {
    using SafeERC20 for IERC20;

    enum TokenTypes {
        RMX,
        Collectible,
        Derivative,
        Badge
    }

    uint256 public royalties; /*Royalties for secondary sales of tokens*/

    // Remix tokens
    uint256 public countdownTime; /*Amount of time after recieving badge that holder can mint derivative*/
    mapping(address => uint256) canMintUntil; /*Track how long license is valid for per holder*/

    // Perpetual auction
    uint256 public minPurchasePrice; /*Next lowest price that rmx token can be purchased for on perpetual auction*/
    uint256 public increasePoints; /*BP to increment RMX token price by*/

    // Collectible token
    uint256 public collectiblePrice; /*Initial price of collectible token*/

    bool public hasBeenPurchased; /*Track if RMX token has been purchased once*/

    address[] public authors; /* List of authors */
    uint256[] public authorsSplits; /* List of authors splits */
    address[] public parents; /* List of authors splits */
    uint256[] public parentsSplits; /* List of authors splits */
    address public currentRMXOwner;

    address[] public splitAddresses; /*Addresses to receive splits including parent contracts and authors*/
    mapping(address => uint256) public splits; /*Amount of splits to send*/

    // ERC165 Helpers
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    // Events
    event RMXPurchased(address holder, uint256 tokenId, uint256 amount);
    event RMXCountdownStarted(address buyer, uint256 expiration);
    event CollectiblePurchased(address buyer, uint256 tokenId, uint256 amount);
    event RoyaltiesHarvested(address[] recipients, address tokenAddress, uint256[] amounts);
    event DerivativeIssued(address dst);
    event Finalized(address[] authors, bool success); // todo better
    event BadgeIssued(uint256 tokenId, address dst);
    event RoyaltyReceived(uint256 amount);
    event ParentAdded(address parent);
    event Mint(address dst, uint256 tokenID);

    /// @dev Construtor sets the token base URI, and external interfaces
    /// @param uri_ String to prepend to token IDs
    /// @param _authors Addresses of creative work authors
    /// @param _authorSplits BPs to share with authors
    /// @param _parents Addresses of creative work parent contracts
    /// @param _parentSplits BPs to share with parents
    /// @param _startingPrice Starting perpetual auction price of RMX token
    /// @param _increasePoints BPs to increase RMX token price each time
    /// @param _collectiblePrice Initial price of collectible token
    /// @param _rmxCountdown How long holder has to create deriviative work after losing RMX token
    /// @param _royalties Base royalties for perpetual auction and secondary market
    constructor(
        string memory uri_,
        address[] memory _authors,
        uint256[] memory _authorSplits,
        address[] memory _parents,
        uint256[] memory _parentSplits,
        uint256 _startingPrice,
        uint256 _increasePoints,
        uint256 _collectiblePrice,
        uint256 _rmxCountdown,
        uint256 _royalties
    ) ERC1155(uri_) {
        require(_authors.length > 0, "There must be at least one author");
        require(_authors.length == _authorSplits.length, "!length"); /*Check input constraint*/
        require(_parents.length == _parentSplits.length, "!length"); /*Check input constraint*/

        authors = _authors;
        authorsSplits = _authorSplits;
        parents = _parents;
        parentsSplits = _parentSplits;

        uint256 _splitSum; /*Initialize split sum to check that sum of all splits is 10000*/

        bool senderIsAuthor = false;

        for (uint256 _i = 0; _i < _authors.length; _i++) {
            /*Add splits for authors*/
            if (msg.sender == _authors[_i]) {
                senderIsAuthor = true;
            }
            splitAddresses.push(_authors[_i]); /*Add split address for each author*/
            splits[_authors[_i]] = _authorSplits[_i]; /*Add split amount for each author*/
            _splitSum += _authorSplits[_i]; /*Add splits to working sum*/
            _mintBadge(_authors[_i]); /*Mint a badge to each author*/
        }

        for (uint256 _j = 0; _j < _parents.length; _j++) {
            /*Add splits for parent tokens*/
            splitAddresses.push(_parents[_j]); /*Add split address for each parent token*/
            splits[_parents[_j]] = _parentSplits[_j]; /*Add split amount for each parent token*/
            _splitSum += _parentSplits[_j]; /*Add splits to working sum*/
            //require(IRemix(_parents[_j]).requestDerivative(msg.sender)); /*Request derivatives from each specified parent*/
        }

        require(_splitSum == 10000, "!split total"); /*Ensure valid split total*/
        require(_royalties < 10000, "max royalties exceeded"); /*Ensure royalties are below max possible*/

        collectiblePrice = _collectiblePrice; /*Set initial collectible price*/
        countdownTime = _rmxCountdown; /*Set RMX countdown time*/
        royalties = _royalties; /*Set royalties*/
        minPurchasePrice = _startingPrice; /*First purchase price - active immediately*/
        increasePoints = _increasePoints; /*Set the amount to increase*/
        
        if (senderIsAuthor) {
            _mintRMX(msg.sender);
        } else {
            _mintRMX(_authors[0]);
        }
        //_mint(msg.sender, uint256(TokenTypes.RMX), 1, ""); /*Mint RMX token to deployer*/

        _registerInterface(_INTERFACE_ID_ERC2981);
        emit Finalized(_authors, true);
    }

    /// @dev Purchase remix token on perpetual auction
    function purchaseRmx() public payable {
        require(msg.value >= minPurchasePrice, "Not enough"); /*Must send at least min purchase price*/
        require(
            (balanceOf(msg.sender, uint256(TokenTypes.RMX)) == 0),
            "Buyer already owns the RMX"
        ); 
        require( (balanceOf(currentRMXOwner, uint256(TokenTypes.RMX)) == 1),
            "Owner does not own the RMX token"
        );

        minPurchasePrice =
            (minPurchasePrice * (10000 + increasePoints)) /
            10000; /*Increment the next purchase price*/

        if (hasBeenPurchased) {
            /*If token is being purchased first time keep ETH in contract and distribute via harvest*/
            uint256 _toSend = (msg.value * (10000 - royalties)) / 10000; /*Send amount to owner less royalties*/
            (bool _success, ) = currentRMXOwner.call{value: _toSend}("");
            require(_success, "could not send"); // TODO WETH fallback?
        } else {
            hasBeenPurchased = true; /*Set purchased so we skip this next time*/
        }

        safeTransferFrom(
            currentRMXOwner,
            msg.sender,
            uint256(TokenTypes.RMX),
            1,
            ""
        ); /*Send RMX token to new owner*/

        canMintUntil[currentRMXOwner] = block.timestamp + countdownTime; /*Start countdown for previous owner*/
        currentRMXOwner = msg.sender;
        _mintBadge(msg.sender); /*Mint a badge to new owner*/
        emit RMXPurchased(msg.sender, uint256(TokenTypes.RMX), msg.value);
    }

    /// @dev Purchase collectible token from initial creator
    function purchaseCollectible() external payable {
        require(totalSupply(uint256(TokenTypes.Collectible)) == 0, "Collectible already Puchased/Minted"); /*Only allow 1 to be minted TODO parameter?*/
        require(msg.value >= collectiblePrice, "The price is bellow the value set!"); /*Must send at least the min value*/
        _mintCollectible(msg.sender);
        // _mint(msg.sender, uint256(TokenTypes.Collectible), 1, ""); /*Mint collectible to buyer*/
        emit CollectiblePurchased(msg.sender, uint256(TokenTypes.Collectible), msg.value);
    }

    /// @dev Harvest royalties and perform one generation of splits
    /// @param _token 0 address if ETH, non-0 address if ERC20
    function harvestRoyalties(address _token) public {
        if (_token == address(0)) {
            _performSplit(address(this).balance); /*Harvest ETH*/
        } else {
            _performSplit(_token, IERC20(_token).balanceOf(address(this))); /*Harvest ERC20s*/
        }
    }

    /// @dev Request derivative by a child token contract
    /// @param _minter Address of user whose badge to use
    function requestDerivative(address _minter) external {
        // TODO: maybe add a check that the contract calling is a RMX contract?
        require(licenseActive(_minter), "!license"); /*TODO is this safe? Should require pre approval of minter?*/
        // TODO additional validations
        _mintDerivative(msg.sender);
        emit DerivativeIssued(_minter)
        //_mint(msg.sender, uint256(TokenTypes.Derivative), 1, "");
    }

    /// @dev Emit an event when ETH is received
    receive() external payable {
        emit RoyaltyReceived(msg.value);
    }

    /*****************
    External & public view interfaces
    *****************/
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (address(this), (_salePrice * royalties) / 10000);
    }

    function getAuthors() public view returns (address[] memory, uint256[] memory) {
        return (authors, authorsSplits);
    }

    function getParents() public view returns (address[] memory, uint256[] memory) {
        return (parents, parentsSplits);
    }

    function licenseActive(address _holder) public view returns (bool) {
        bool isAuthor = false;
        for (uint i = 0; i < authors.length; i++) {
            if (_holder == authors[i]) {
                isAuthor = true;
                break;
            }
        }
        return
            (isAuthor) ||
            (canMintUntil[_holder] > block.timestamp) ||
            (balanceOf(_holder, uint256(TokenTypes.RMX)) == 1);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165Storage, IERC165, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /*****************
    Hooks & Internal utils
    *****************/
    /// @dev Mint badge to license purchaser - nontransferable
    /// @param _recipient Where to send badge
    function _mintBadge(address _recipient) internal {
        _mint(_recipient, uint256(TokenTypes.Badge), 1, "");
        emit Mint(_recipient, uint256(TokenTypes.Badge));
    }

    /// @dev Mint RMX - nontransferable
    /// @param _recipient Where to send badge
    function _mintRMX(address _recipient) internal {
        _mint(_recipient, uint256(TokenTypes.RMX), 1, "");
        currentRMXOwner = _recipient;
        emit Mint(_recipient, uint256(TokenTypes.RMX));
    }

    /// @dev Mint Derivative - nontransferable
    /// @param _recipient Where to send badge
    function _mintDerivative(address _recipient) internal {
        _mint(_recipient, uint256(TokenTypes.Derivative), 1, "");
        emit Mint(_recipient, uint256(TokenTypes.Derivative));
    }

    /// @dev Mint Collectible - nontransferable
    /// @param _recipient Where to send badge
    function _mintCollectible(address _recipient) internal {
        _mint(_recipient, uint256(TokenTypes.Collectible), 1, "");
        emit Mint(_recipient, uint256(TokenTypes.Collectible));
    }

    /// @dev Perform ETH splits
    function _performSplit(uint256 _total) internal {
        uint256[] memory amounts = new uint256[](splitAddresses.length);
        for (uint256 _i = 0; _i < splitAddresses.length; _i++) {
            uint256 _toSend = (splits[splitAddresses[_i]] * _total) / 10000;
            amounts[_i] = _toSend;
            (bool _success, ) = splitAddresses[_i].call{value: _toSend}("");
            require(_success, "could not send");
        }
        emit RoyaltiesHarvested(splitAddresses, address(0), amounts);
    }

    /// @dev Perform ERC20 splits
    function _performSplit(address _tokenAddress, uint256 _total) internal {
        uint256[] memory amounts = new uint256[](splitAddresses.length);
        IERC20 _token = IERC20(_tokenAddress);
        for (uint256 _i = 0; _i < splitAddresses.length; _i++) {
            uint256 _toSend = (splits[splitAddresses[_i]] * _total) / 10000;
            amounts[_i] = _toSend;
            require(
                _token.transfer(splitAddresses[_i], _toSend),
                "could not send"
            );
        }
        emit RoyaltiesHarvested(splitAddresses, _tokenAddress, amounts);
    }

    /// @dev restrict transfers to remix & collectible tokens
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data); /*Trigger parent hook to track supplies*/
        for (uint256 _i = 0; _i < ids.length; _i++) {
            require(
                to == address(0) ||
                    from == address(0) ||
                    ids[_i] == uint256(TokenTypes.RMX) ||
                    ids[_i] == uint256(TokenTypes.Badge) ||
                    ids[_i] == uint256(TokenTypes.Collectible),
                "!transferable"
            );
        }
    }
}
