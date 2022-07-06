const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { ethers, upgrades } = require("hardhat");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);
chai.use(chaiAsPromised);
const expect = chai.expect;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_ADMIN_ROLE = ethers.utils.formatBytes32String("");
const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
const deployContract = async () => {
  const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
  const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
    kind: 'uups',
    initializer: "initialize",
  });

  await contract.deployed();
  return contract
}


describe("DeenDevelopersSBT", function () {
  it("Should set the owner for the proxy contract to deployer and implementation contract is 0x0..", async function () {
    const [owner] = await ethers.getSigners()
    const contract = await deployContract();

    const proxyAddress = contract.address;
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
    const hasMinterRole = await contract.hasRole(MINTER_ROLE, owner.address);
    const implementationContract = await ethers.getContractAt("DeenDevelopersSBT", implementationAddress);
    const implementationHasAdminRole = await implementationContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
    const implementationHasMinterRole = await implementationContract.hasRole(MINTER_ROLE, owner.address);


    expect(proxyAddress).to.not.be.null;
    expect(implementationAddress).to.not.be.null;
    expect(hasAdminRole).to.be.true;
    expect(hasMinterRole).to.be.true;
    expect(implementationHasAdminRole).to.be.false;
    expect(implementationHasMinterRole).to.be.false;
  });

  it("Should be upgradable by Admin", async function () {
    const [owner] = await ethers.getSigners()
    const contract = await deployContract();

    const proxyAddress = contract.address;
    const implementationAddressV1 = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    await expect(contract.burnMyToken(4)).to.eventually.be.rejectedWith('ERC721: invalid token ID');

    const TestUpgradable = await ethers.getContractFactory("TestUpgradable");
    const contractV2 = await upgrades.upgradeProxy(proxyAddress, TestUpgradable);

    await contractV2.deployed();
    const implementationAddressV2 = await upgrades.erc1967.getImplementationAddress(proxyAddress);


    expect(proxyAddress).to.be.properAddress;
    expect(proxyAddress).to.be.equal(contractV2.address);
    expect(implementationAddressV1).to.be.properAddress;
    expect(implementationAddressV2).to.be.properAddress;
    expect(implementationAddressV1).to.not.equal(implementationAddressV2);

    await expect(contract.burnMyToken(4)).to.eventually.be.rejectedWith('this is a upgraded function with new logic');
    await expect(contractV2.burnMyToken(4)).to.eventually.be.rejectedWith('this is a upgraded function with new logic');
    await expect(contractV2.newFunction()).to.eventually.be.equal('this is a new function');
  });

  it("Should not be upgradable by none Admins", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();

    const proxyAddress = contract.address;
    const implementationAddressV1 = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    await expect(contract.burnMyToken(4)).to.eventually.be.rejectedWith('ERC721: invalid token ID');

    const TestUpgradable = await ethers.getContractFactory("TestUpgradable");

    await expect(
      upgrades.upgradeProxy(proxyAddress, await TestUpgradable.connect(wallet1))
    ).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE.toString()}`);
    const afterImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);


    expect(proxyAddress).to.be.properAddress;
    expect(implementationAddressV1).to.be.properAddress;
    expect(afterImplementationAddress).to.be.properAddress;
    expect(implementationAddressV1).to.equal(afterImplementationAddress);

    await expect(contract.burnMyToken(4)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
  });

  it("Should have contract name and symbol when deployed", async function () {
    const contract = await deployContract();

    expect(await contract.name()).to.be.equal('Deen Developers Hackathon');
    expect(await contract.symbol()).to.be.equal('DDH');
  });

  it("Should sucessfully mint when safemint called by owner", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()
    const contract = await deployContract();

    await expect(contract.safeMint(wallet1.address, 'ipfs://someuri'))
      .to.emit(contract, 'Transfer')
      .withArgs(NULL_ADDRESS, wallet1.address, 0); // from, to, tokenId

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);

    await expect(contract.safeMint(wallet1.address, 'ipfs://someotheruri'))
      .to.emit(contract, 'Transfer')
      .withArgs(NULL_ADDRESS, wallet1.address, 1);

    await expect(contract.safeMint(wallet2.address, 'ipfs://anotheruri'))
      .to.emit(contract, 'Transfer')
      .withArgs(NULL_ADDRESS, wallet2.address, 2);

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.balanceOf(wallet2.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');
    await expect(contract.tokenURI(2)).to.eventually.be.equal('ipfs://anotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(2)).to.eventually.be.equal(wallet2.address);
  });

  it("Should failure to mint when safemint called by non owner", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();

    await expect(contract.connect(wallet1).safeMint(wallet1.address, 'ipfs://someuri')).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${MINTER_ROLE}`);
  });

  it("Should burn token by tokenid when burn is called by owner", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()
    const contract = await deployContract();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');
    await contract.safeMint(wallet2.address, 'ipfs://anotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    const brurnTx = await contract.burn(0);
    await brurnTx.wait();

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);
    await expect(contract.balanceOf(wallet2.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');
    await expect(contract.tokenURI(2)).to.eventually.be.equal('ipfs://anotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(2)).to.eventually.be.equal(wallet2.address);
  });

  it("Should not burn token when burn is called by non owner", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();


    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    await expect(contract.connect(wallet1).burn(0)).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
  });

  it("Should burn token when burnMyToken is called and id is passed", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    const brurnTx = await contract.connect(wallet1).burnMyToken(0);
    await brurnTx.wait();

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
  });

  it("Should not burn token when burnMyToken by wallet that doesn't own the token", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()
    const contract = await deployContract();


    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    await expect(contract.connect(wallet2).burn(0)).to.eventually.be.rejectedWith(`AccessControl: account ${wallet2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
  });

  it("Should not burn token when pauseBurnMyToken but able to when unpauseBurnMyToken", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    await contract.pauseBurnMyToken();
    await expect(contract.connect(wallet1).burnMyToken(0)).to.eventually.be.rejectedWith('Pausable: paused');
    await contract.unpauseBurnMyToken();
    const brurnTx = await contract.connect(wallet1).burnMyToken(0);
    await brurnTx.wait();

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.rejectedWith('ERC721: invalid token ID');
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
  });

  it("Should not pauseBurnMyToken or unpauseBurnMyToken if not owner", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();


    await expect(contract.connect(wallet1).pauseBurnMyToken()).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
    await expect(contract.connect(wallet1).unpauseBurnMyToken()).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
  });
  it("Should not be able to transfer", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()
    const contract = await deployContract();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);
    await expect(contract.connect(wallet1).transferFrom(wallet1.address, wallet2.address, 0)).to.eventually.be.rejectedWith('CannotTransferSBT()');
    await expect(contract.connect(wallet1)["safeTransferFrom(address,address,uint256)"](wallet1.address, wallet2.address, 0)).to.eventually.be.rejectedWith('CannotTransferSBT()');
    await expect(contract.connect(wallet1)["safeTransferFrom(address,address,uint256,bytes)"](wallet1.address, wallet2.address, 0, ethers.utils.formatBytes32String('hello'))).to.eventually.be.rejectedWith('CannotTransferSBT()');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
  });
  it("Should not be able to approve", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()
    const contract = await deployContract();


    await contract.safeMint(wallet1.address, 'ipfs://someuri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);
    await expect(contract.connect(wallet1).approve(wallet2.address, 0)).to.eventually.be.rejectedWith('CannotApproveSBT()');
    await expect(contract.connect(wallet1).setApprovalForAll(wallet2.address, true)).to.eventually.be.rejectedWith('CannotApproveSBT()');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
  });
  it("only admin can grant or revoke roles", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()
    const contract = await deployContract();
    await expect(contract.connect(wallet1).grantRole(DEFAULT_ADMIN_ROLE, wallet2.address)).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
    await expect(contract.connect(wallet1).grantRole(MINTER_ROLE, wallet2.address)).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
    await expect(contract.connect(wallet1).revokeRole(DEFAULT_ADMIN_ROLE, wallet2.address)).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
    await expect(contract.connect(wallet1).revokeRole(MINTER_ROLE, wallet2.address)).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
  });
  it("Minter should only be able to mint tokens, not burn, pause or upgrade", async function () {
    const [owner, minter, wallet2] = await ethers.getSigners()
    const contract = await deployContract();
    await expect(contract.grantRole(MINTER_ROLE, minter.address))
      .to.emit(contract, 'RoleGranted')
      .withArgs(MINTER_ROLE, minter.address, owner.address);
    await expect(contract.connect(minter).safeMint(wallet2.address, 'ipfs://someuri'))
      .to.emit(contract, 'Transfer')
      .withArgs(NULL_ADDRESS, wallet2.address, 0);
    await expect(contract.connect(minter).burn(0)).to.eventually.be.rejectedWith(`AccessControl: account ${minter.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
    await expect(contract.connect(minter).pauseBurnMyToken()).to.eventually.be.rejectedWith(`AccessControl: account ${minter.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
    await expect(contract.connect(minter).unpauseBurnMyToken()).to.eventually.be.rejectedWith(`AccessControl: account ${minter.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);

    const TestUpgradable = await ethers.getContractFactory("TestUpgradable");

    await expect(
      upgrades.upgradeProxy(contract.address, await TestUpgradable.connect(minter))
    ).to.eventually.be.rejectedWith(`AccessControl: account ${minter.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE.toString()}`);
  });
  it("admin should be able to revoke minter role", async function () {
    const [owner, minter, wallet2] = await ethers.getSigners()
    const contract = await deployContract();
    await expect(contract.grantRole(MINTER_ROLE, minter.address))
      .to.emit(contract, 'RoleGranted')
      .withArgs(MINTER_ROLE, minter.address, owner.address);
    await expect(contract.connect(minter).safeMint(wallet2.address, 'ipfs://someuri'))
      .to.emit(contract, 'Transfer')
      .withArgs(NULL_ADDRESS, wallet2.address, 0);
    await expect(contract.revokeRole(MINTER_ROLE, minter.address))
      .to.emit(contract, 'RoleRevoked')
      .withArgs(MINTER_ROLE, minter.address, owner.address);
    await expect(contract.connect(minter).safeMint(wallet2.address, 'ipfs://someuri')).to.eventually.be.rejectedWith(`AccessControl: account ${minter.address.toLowerCase()} is missing role ${MINTER_ROLE}`);
  });
  it("admin should be able to grant and revoke admin role", async function () {
    const [owner, admin2, wallet2] = await ethers.getSigners()
    const contract = await deployContract();
    await expect(contract.grantRole(DEFAULT_ADMIN_ROLE, admin2.address))
      .to.emit(contract, 'RoleGranted')
      .withArgs(DEFAULT_ADMIN_ROLE, admin2.address, owner.address);
    await expect(contract.connect(admin2).pauseBurnMyToken())
      .to.emit(contract, 'Paused')
      .withArgs(admin2.address);
    await expect(contract.revokeRole(DEFAULT_ADMIN_ROLE, admin2.address))
      .to.emit(contract, 'RoleRevoked')
      .withArgs(DEFAULT_ADMIN_ROLE, admin2.address, owner.address);
    await expect(contract.connect(admin2).pauseBurnMyToken()).to.eventually.be.rejectedWith(`AccessControl: account ${admin2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
  });
  it("update the baseURI only admin", async function () {
    const [owner, wallet1] = await ethers.getSigners()
    const contract = await deployContract();
    await expect(contract.updateBaseURI('http://newuri.com/'))
      .to.emit(contract, 'UpdatedBaseURI')
      .withArgs('', 'http://newuri.com/');
    await expect(contract.connect(wallet1).updateBaseURI('http://failed.com/')).to.eventually.be.rejectedWith(`AccessControl: account ${wallet1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`);
  });
  it("token owner and admin can switch URI", async function () {
    const [admin, tokenOwner, tokenOwner2] = await ethers.getSigners()
    const contract = await deployContract();
    await contract.updateBaseURI('http://newuri.com/');
    await contract.safeMint(tokenOwner.address, 'ipfs://someuri');
    await contract.safeMint(tokenOwner.address, 'ipfs://someuri1');
    await contract.safeMint(tokenOwner2.address, 'ipfs://someuri2');
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await contract.connect(tokenOwner).switchURI(0);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('http://newuri.com/0');
    await contract.connect(tokenOwner).switchURI(0);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someuri1');
    await contract.connect(tokenOwner).switchURI(1);
    await expect(contract.tokenURI(1)).to.eventually.be.equal('http://newuri.com/1');
    await expect(contract.connect(tokenOwner).switchURI(2)).to.eventually.be.rejectedWith(`UnauthorizedCaller()`);
    await expect(contract.tokenURI(2)).to.eventually.be.equal('ipfs://someuri2');
    await contract.connect(tokenOwner2).switchURI(2);
    await expect(contract.tokenURI(2)).to.eventually.be.equal('http://newuri.com/2');
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await contract.connect(admin).switchURI(0);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('http://newuri.com/0');
    await contract.connect(admin).switchURI(0);
  });
});
