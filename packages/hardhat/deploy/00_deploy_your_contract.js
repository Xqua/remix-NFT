// deploy/00_deploy_your_contract.js
const ipfsAPI = require('ipfs-http-client');
const { globSource } = require('ipfs-http-client')
// const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
// const ipfsHost = "https://ipfs.io/ipfs/"
const ipfs = ipfsAPI({ host: '127.0.0.1', port: '5001', protocol: 'http' })
const ipfsHost = "http://localhost:8080/ipfs/"
const { utils } = require("ethers");

const buildArgs = (authors, parents = [], tokenURI = null) => {
  let authorsSplits = [10000]
  let parentsSplits = [];
  if (authors.length > 0) {
    const split = parseInt(10000 / (authors.length + parents.length))
    authorsSplits = authors.map(() => (split))
    parentsSplits = parents.map(() => (split))
    if (split * (authors.length + parents.length) != 10000) {
      authorsSplits[0] += 10000 - split * (authors.length + parents.length)
    }
  }
  if (!tokenURI) {
    tokenURI = "https://ipfs.io/ipfs/QmQB9UgvdA1fC1wHZcHZtNG1kDFnmkhnGTsDyU6zjquYbR/RMX_1_{id}.json"
  }
  let args = [
    tokenURI,   // string memory uri_,
    authors,  // address[] memory _authors,
    authorsSplits,// uint256[] memory _authorSplits,
    parents, // address[] memory _parents,
    parentsSplits, // uint256[] memory _parentSplits,
    utils.parseEther("0.01"), // uint256 _startingPrice,
    1000, // uint256 _increasePoints,
    utils.parseEther("0.1"), // uint256 _collectiblePrice,
    10000, // uint256 _rmxCountdown,
    100] // uint256 _royalties
  return args;
} 


module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const burner = "0xE8B791bF71366717D1B0bDe618CaD05d91448798"

  // First, we upload the metadata to IPFS and get the CID  
  const file = await ipfs.add(globSource("./RMXMetadata", { recursive: true }))
  console.log(file.cid.toString());
  const tokenUri_1 = ipfsHost + file.cid.toString() + "/RMX_1_{id}.json"
  const tokenUri_2 = ipfsHost + file.cid.toString() + "/RMX_2_{id}.json"
  const tokenUri_3 = ipfsHost + file.cid.toString() + "/RMX_3_{id}.json"

  console.log(tokenUri_1);

  const result = await deploy("RemixFactory", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args:[],
    log: true,
  });

  //const inter = new utils.Interface(result.abi);

  const remixFactory = await ethers.getContract("RemixFactory", deployer);

  args = buildArgs([deployer], [], tokenUri_1)

  const remix1 = await remixFactory.deploy(...args);
  const remix1Addr = await remixFactory.getRemixByAuthor(deployer)

  args = buildArgs([deployer, burner], [remix1Addr[remix1Addr.length-1]], tokenUri_2)
  
  const remix2 = await remixFactory.deploy(...args);

  args = buildArgs([deployer, burner], [remix1Addr[remix1Addr.length - 1]], tokenUri_3)

  const resultRemix = await deploy("Remix", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [""],
    log: true,
  });

  //const remix3 = await ethers.getContract("Remix", deployer);

  remixFactory.registerRemix(resultRemix.address)
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
