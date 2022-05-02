// deploy/00_deploy_your_contract.js
const ipfsAPI = require('ipfs-http-client');
const { globSource } = require('ipfs-http-client')
// const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
// const ipfsHost = "https://ipfs.io/ipfs/"
const ipfs = ipfsAPI({ host: '127.0.0.1', port: '5001', protocol: 'http' })
const ipfsHost = "http://localhost:8080/ipfs/"
const { utils } = require("ethers");
const { none } = require('ramda');

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

const uploadMetadata = async (collectible, rmx, file, name, description, cid) => {
  const collectibleMetadata = {}
  collectibleMetadata.name = name;
  collectibleMetadata.description = description;
  collectibleMetadata.image = ipfsHost + cid.toString() + "/" + collectible;
  
  const RMXMetadata = {}
  RMXMetadata.name = name + " - RMX";
  RMXMetadata.description = "RMX: " + description;
  RMXMetadata.image = ipfsHost + cid.toString() + "/" + rmx;
  RMXMetadata.file = ipfsHost + cid.toString() + "/" + file;
  
  let files = [];
  files.push({
    path: "metadata/0.json",
    content: JSON.stringify(collectibleMetadata),
  });

  files.push({
    path: "metadata/1.json",
    content: JSON.stringify(RMXMetadata),
  });

  let hash;
  for await (const result of ipfs.addAll(files)) {
    if (result.path === "metadata") {
      hash = result.cid.toString();
    }
  }
  const uri = ipfsHost + hash + "/{id}.json";

  return uri;
} 

module.exports = async ({ getNamedAccounts, deployments }) => {
  console.log("Deploying example remixes");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const burner = "0xE8B791bF71366717D1B0bDe618CaD05d91448798"

  // First, we upload the metadata to IPFS and get the CID  
  const one = await ipfs.add(globSource("./assets/01", { recursive: true }))
  const tokenUri_1 = await uploadMetadata("01_collectible.gif", "01_RMX.gif", "01_files.gif", "BrokenCubes", "A work on destructuring structures.", one.cid)
  const two = await ipfs.add(globSource("./assets/02", { recursive: true }))
  const tokenUri_2 = await uploadMetadata("02_collectible.png", "02_RMX.png", "02_files.zip", "PWords", "Collaborative play on words strating with P, rendered as WordCloud.", two.cid)
  const three = await ipfs.add(globSource("./assets/03", { recursive: true }))
  const tokenUri_3 = await uploadMetadata("03_collectible.png", "03_RMX.png", "03_files.svg", "PWords framed", "A framed version of PWords.", three.cid)

  // Deploys three remix token to populate 
  const remixFactory = await ethers.getContract("RemixFactory", deployer);

  // Deploy Remix 1 with no child
  args = buildArgs([deployer], [], tokenUri_1)
  await remixFactory.deploy(...args);
  
  // Deploy Remix 2 with no child and author is default burner waller
  args = buildArgs([deployer, burner], [], tokenUri_2)
  await remixFactory.deploy(...args);
  const remix2Addr = await remixFactory.getRemixByAuthor(burner)

  args = buildArgs([deployer], [remix2Addr[remix2Addr.length - 1]], tokenUri_3)
  await remixFactory.deploy(...args);
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
