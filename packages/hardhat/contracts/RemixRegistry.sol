pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract RemixRegistry is Ownable {

  event NewRemix(address[] authors, address contractAddress);

  mapping(address => address[]) registry; /*all Remix for this deployer*/

  constructor() {
    // what should we do on deploy?
  }

  function registerRemix(address[] calldata authors, address contractAddress) public {
    for (uint i = 0; i < authors.length; i++) {
      registry[authors[i]].push(contractAddress);  
    }
    emit NewRemix(authors, contractAddress);
  }

  function getRemixByAuthor(address author) public view returns(address[] memory) {
    return registry[author];
  }
}
