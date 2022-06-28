const hre = require("hardhat");

async function main() {
  const DeenDevelopersSBT = await hre.ethers.getContractFactory("DeenDevelopersSBT");
  const contract = await DeenDevelopersSBT.deploy();

  await contract.deployed();

  console.log("DeenDevelopersSBT deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
