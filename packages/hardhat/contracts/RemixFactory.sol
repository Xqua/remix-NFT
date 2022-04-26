pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "@openzeppelin/contracts/proxy/Clones.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "./Remix.sol";

contract RemixFactory is Ownable {

  address public remixImplementation;
  uint256 public count;

  event RemixDeployed(address[] authors, address contractAddress);

  mapping(address => address[]) registry; /*all Remix for this deployer*/

  constructor() {
    remixImplementation = address(new Remix(""));
    _transferOwnership(msg.sender);
  }

    /// @dev Construtor sets the token base URI, and external interfaces
    /// @param _uri String to prepend to token IDs
    /// @param _authors Addresses of creative work authors
    /// @param _authorSplits BPs to share with authors
    /// @param _parents Addresses of creative work parent contracts
    /// @param _parentSplits BPs to share with parents
    /// @param _startingPrice Starting perpetual auction price of RMX token
    /// @param _increasePoints BPs to increase RMX token price each time
    /// @param _collectiblePrice Initial price of collectible token
    /// @param _rmxCountdown How long holder has to create deriviative work after losing RMX token
    /// @param _royalties Base royalties for perpetual auction and secondary market
    function deploy(
        string memory _uri,
        address[] memory _authors,
        uint256[] memory _authorSplits,
        address[] memory _parents,
        uint256[] memory _parentSplits,
        uint256 _startingPrice,
        uint256 _increasePoints,
        uint256 _collectiblePrice,
        uint256 _rmxCountdown,
        uint256 _royalties
    ) public returns (address) {
    isAuthor(_authors);
    address clone = Clones.clone(remixImplementation); 
    Remix(payable(clone)).initialize(_uri, _authors, _authorSplits, _parents, _parentSplits, _startingPrice, _increasePoints, _collectiblePrice, _rmxCountdown, _royalties);
    registerRemix(clone);
    emit RemixDeployed(_authors, clone);
    return clone;
  }

  function registerRemix(address contractAddress) public {
    address[] memory authors;
    authors = Remix(payable(contractAddress)).getAuthors();

    for (uint i = 0; i < authors.length; i++) {
      registry[authors[i]].push(contractAddress);  
    }
    count++;
  }

  function getRemixByAuthor(address author) public view returns(address[] memory) {
    return registry[author];
  }

  function isAuthor(address[] memory _authors) internal view {
    bool isSendAuthor = false;
    for (uint256 _i = 0; _i < _authors.length; _i++) {
      if (_authors[_i] == msg.sender) {
        isSendAuthor = true;
      }
    }
    require(isSendAuthor, "The sender is not an author!");
  }

  function harvestMany(address[] memory _remixes, address _tokenAddress) public {
    for (uint256 _i = 0; _i < _remixes.length; _i++) {
      Remix(payable(_remixes[_i])).harvestRoyalties(_tokenAddress);
    }
  }

  function flag(address remixAddress) public onlyOwner {
    address[] memory args = new address[](2);
    args[0] = remixAddress;
    args[1] = address(this);
    Remix(payable(remixAddress)).flag(args);
  }

  function unflag(address remixAddress, uint256 index) public onlyOwner {
    address[] memory args = new address[](2);
    args[0] = remixAddress;
    args[1] = address(this);
    Remix(payable(remixAddress)).unflag(args, index);
  }

   //TODO probably add moderation functionality
}
