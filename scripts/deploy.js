const { ethers, upgrades } = require("hardhat");

async function main() {
  const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
  const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
    initializer: "initialize",
  });

  await contract.deployed();

  console.log("DeenDevelopersSBT deployed to:", contract.address);
}

main();
