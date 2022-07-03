const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { ethers, upgrades } = require("hardhat");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);
chai.use(chaiAsPromised);
const expect = chai.expect;

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("DeenDevelopersSBT", function () {
  it("Should set the owner for the proxy contract to deployer and implementation contract is 0x0..", async function () {
    const [owner] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

    const proxyAddress = contract.address;
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    const proxyOwner = await contract.owner();
    const implementationContract = await ethers.getContractAt("DeenDevelopersSBT", implementationAddress);
    const implementationOwner = await implementationContract.owner();

    expect(proxyAddress).to.not.be.null;
    expect(implementationAddress).to.not.be.null;
    expect(proxyOwner).to.be.equal(owner.address);
    expect(implementationOwner).to.be.equal(NULL_ADDRESS);
  });

  it("Should be upgradable", async function () {
    const [owner] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

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

  it("Should have contract name and symbol when deployed", async function () {
    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    expect(await contract.name()).to.be.equal('Deen Developers Hackathon');
    expect(await contract.symbol()).to.be.equal('DDH');
  });

  it("Should sucessfully mint when safemint called by owner", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

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

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();
    await expect(contract.connect(wallet1).safeMint(wallet1.address, 'ipfs://someuri')).to.eventually.be.rejectedWith('Ownable: caller is not the owner');
  });

  it("Should burn token by tokenid when burn is called by owner", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();
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

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    await expect(contract.connect(wallet1).burn(0)).to.eventually.be.rejectedWith('Ownable: caller is not the owner');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
  });

  it("Should burn token when burnMyToken is called and id is passed", async function () {
    const [owner, wallet1] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();
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

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');
    await contract.safeMint(wallet1.address, 'ipfs://someotheruri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);
    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');

    await expect(contract.connect(wallet2).burn(0)).to.eventually.be.rejectedWith('Ownable: caller is not the owner');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(2);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.tokenURI(1)).to.eventually.be.equal('ipfs://someotheruri');

    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
    await expect(contract.ownerOf(1)).to.eventually.be.equal(wallet1.address);
  });

  it("Should not burn token when pauseBurnMyToken but able to when unpauseBurnMyToken", async function () {
    const [owner, wallet1] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();
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

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

    await expect(contract.connect(wallet1).pauseBurnMyToken()).to.eventually.be.rejectedWith('Ownable: caller is not the owner');
    await expect(contract.connect(wallet1).unpauseBurnMyToken()).to.eventually.be.rejectedWith('Ownable: caller is not the owner');
  });
  it("Should not be able to transfer", async function () {
    const [owner, wallet1, wallet2] = await ethers.getSigners()

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

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

    const DeenDevelopersSBT = await ethers.getContractFactory("DeenDevelopersSBT");
    const contract = await upgrades.deployProxy(DeenDevelopersSBT, [], {
      initializer: "initialize",
    });

    await contract.deployed();

    await contract.safeMint(wallet1.address, 'ipfs://someuri');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);
    await expect(contract.connect(wallet1).approve(wallet2.address, 0)).to.eventually.be.rejectedWith('CannotApproveSBT()');
    await expect(contract.connect(wallet1).setApprovalForAll(wallet2.address, true)).to.eventually.be.rejectedWith('CannotApproveSBT()');

    await expect(contract.balanceOf(wallet1.address)).to.eventually.be.equal(1);

    await expect(contract.tokenURI(0)).to.eventually.be.equal('ipfs://someuri');
    await expect(contract.ownerOf(0)).to.eventually.be.equal(wallet1.address);
  });
});
