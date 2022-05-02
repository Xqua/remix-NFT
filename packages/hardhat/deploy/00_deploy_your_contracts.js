// deploy/00_deploy_your_contract.js
const ipfsAPI = require('ipfs-http-client');
const { globSource } = require('ipfs-http-client')
// const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
// const ipfsHost = "https://ipfs.io/ipfs/"
const ipfs = ipfsAPI({ host: '127.0.0.1', port: '5001', protocol: 'http' })
const ipfsHost = "http://localhost:8080/ipfs/"
const { utils } = require("ethers");
const { none } = require('ramda');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy("RemixFactory", {
    from: deployer,
    args:[],
    log: true,
  });

  const resultRemix = await deploy("Remix", {
    from: deployer,
    args: [""],
    log: true,
  });
};
module.exports.tags = ["Remix"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
