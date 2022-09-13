// deploy/00_deploy_your_contract.js

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
module.exports.tags = ["RemixFactory"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
