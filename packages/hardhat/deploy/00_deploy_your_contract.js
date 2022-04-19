// deploy/00_deploy_your_contract.js
const ipfsAPI = require('ipfs-http-client');
const { globSource } = require('ipfs-http-client')
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // First, we upload the metadata to IPFS and get the CID  
  const file = await ipfs.add(globSource("./RMXMetadata", { recursive: true }))
  console.log(file.cid.toString());
  const tokenUri_1 = "https://ipfs.io/ipfs/" + file.cid.toString() + "/RMX_1_{id}.json"
  const tokenUri_2 = "https://ipfs.io/ipfs/" + file.cid.toString() + "/RMX_2_{id}.json"
  const tokenUri_3 = "https://ipfs.io/ipfs/" + file.cid.toString() + "/RMX_3_{id}.json"

  await deploy("RemixRegistry", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [],
    log: true,
  });

  const registry = await ethers.getContract("RemixRegistry", deployer);
  const authors = [deployer];
  args = [
    tokenUri_1,   // string memory uri_,
    authors,  // address[] memory _authors,
    [10000],// uint256[] memory _authorSplits,
    [], // address[] memory _parents,
    [], // uint256[] memory _parentSplits,
    1000, // uint256 _startingPrice,
    1000, // uint256 _increasePoints,
    10000, // uint256 _collectiblePrice,
    10000, // uint256 _rmxCountdown,
    100] // uint256 _royalties


  console.log("Deployer is:", deployer)

  const remix1 = await deploy("Remix", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: args,
    log: true,
  });

  await registry.registerRemix(args[1], remix1.address);

  args[0] = tokenUri_2;
  args[1].push("0xE8B791bF71366717D1B0bDe618CaD05d91448798")
  args[2] = [4000, 5000];
  args[3].push(remix1.address)
  args[4].push(1000);

  const remix2 = await deploy("Remix", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: args,
    log: true,
  });

  await registry.registerRemix(args[1], remix2.address);


  // args[0] = tokenUri_3;

  // const remix3 = await deploy("Remix", {
  //   // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
  //   from: deployer,
  //   args: args,
  //   log: true,
  // });

  // await registry.registerRemix(args[1], remix3.address);
  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");
    
    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */
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
