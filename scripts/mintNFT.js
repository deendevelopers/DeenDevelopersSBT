const { ethers, upgrades } = require("hardhat");
require('dotenv').config()

async function main() {
  const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
  const contract = await DeenDevelopersSBT.attach(process.env.CONTRACT_ADDRESS);

  const safeMintTx = await contract.safeMint(process.env.TO_ADDRESS, process.env.TOKEN_URI);
  const safeMintRx = await safeMintTx.wait();

  console.log("Minted to:", process.env.TO_ADDRESS);
}

main();
