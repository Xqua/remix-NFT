const { ethers } = require("hardhat");
const { utils } = require("ethers");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

const buildArgs = (authors, parents = []) => {
  let authorsSplits = [ 10000 ]
  let parentsSplits = [];
  if (authors.length > 0) {
    const split = parseInt(10000 / (authors.length + parents.length))
    authorsSplits = authors.map(() => (split))
    parentsSplits = parents.map(() => (split))
    if (split * (authors.length + parents.length) != 10000) {
      authorsSplits[0] += 10000 - split * (authors.length + parents.length)
    }
  }
  
  const tokenUri = "https://ipfs.io/ipfs/QmQB9UgvdA1fC1wHZcHZtNG1kDFnmkhnGTsDyU6zjquYbR/RMX_1_{id}.json"
  let args = [
    tokenUri,   // string memory uri_,
    authors,  // address[] memory _authors,
    authorsSplits,// uint256[] memory _authorSplits,
    parents, // address[] memory _parents,
    parentsSplits, // uint256[] memory _parentSplits,
    utils.parseEther("0.01"), // uint256 _startingPrice,
    100, // uint256 _increasePoints,
    utils.parseEther("0.1"), // uint256 _collectiblePrice,
    10000, // uint256 _rmxCountdown,
    1000] // uint256 _royalties
  return args;
} 

const addressZero = "0x0000000000000000000000000000000000000000";
  
describe("Remix-NFT", function () {
  let RemixFactory;
  let Remix1, Remix2, Remix3;
  let args;
  let events;
  let owner, addr1, addr2, addrs;
  
  const deployRemix = async (args, signer) => {
    let contract;
    if (signer) {
      contract = await RemixFactory.connect(signer).deploy("")
      contract.connect(signer).initialize(...args);
    } else {
      contract = await RemixFactory.deploy("")
      contract.initialize(...args);
    }
    return contract;
  }
  //const [owner, addr1, addr2] = await ethers.getSigners();

  describe("Remix", function () {

    beforeEach(async function () {
      // Get the ContractFactory and Signers here.
      RemixFactory = await ethers.getContractFactory("Remix");

      [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    });

    it("Should deploy Remix with no parents", async function () {
      args = buildArgs([owner.address])

      Remix1 = await deployRemix(args); 
    })

    it("Should deploy Remix with multiple authors", async function () {
      args = buildArgs([owner.address, addr1.address])

      Remix1 = await deployRemix(args);
    })

    it("Should have the correct arguments", async function () {
      args = buildArgs([])
      let contract = await RemixFactory.deploy("")
      await expect(contract.initialize(...args))
        .to.be.revertedWith('There must be at least one author');

      args = buildArgs([owner.address])
      args[2] = [2000, 2000]

      contract = await RemixFactory.deploy("")
      await expect(contract.initialize(...args))
        .to.be.revertedWith('!length');

      args = buildArgs([owner.address], [owner.address])
      args[4] = []

      contract = await RemixFactory.deploy("")
      await expect(contract.initialize(...args))
        .to.be.revertedWith('!length');

      args = buildArgs([owner.address], [owner.address])

      contract = await RemixFactory.deploy("")
      await expect(contract.initialize(...args))
        .to.be.reverted;

      args = buildArgs([owner.address])
      args[2] = [2000]

      contract = await RemixFactory.deploy("")
      await expect(contract.initialize(...args))
        .to.be.revertedWith("!split total");
      
      args = buildArgs([owner.address])
      args[9] = 20000

      contract = await RemixFactory.deploy("")
      await expect(contract.initialize(...args))
        .to.be.revertedWith("max royalties exceeded");
    }) 

    it("Should deploy a Remix with parents", async function () {
      args = buildArgs([owner.address])

      Remix1 = await deployRemix(args); 
      
      args = buildArgs([owner.address], [Remix1.address])
      
      Remix2 = await deployRemix(args); 

      const parents = await Remix2.getParents();
      expect(parents, "Contract did not save the parents").to.eql([Remix1.address])
      events = await Remix1.queryFilter("DerivativeIssued")
      expect(events, "DerivativeIssue events missing").to.have.length(1);
    })

    it("Should emit the correct events on initialize", async function () {
      const args = buildArgs([owner.address])

      Remix1 = await RemixFactory.deploy("")
      await expect(Remix1.initialize(...args), "Did not emit finalize!")
        .to.emit(Remix1, "Finalized")
        .withArgs([owner.address], true)

      events = await Remix1.queryFilter("Finalized")
      expect(events.length, "Finalized event number is not correct").to.eql(1)
    })

    it("Should require the RMX token", async () => {
      args = buildArgs([owner.address])

      Remix1 = await deployRemix(args); 

      args = buildArgs([addr1.address], [Remix1.address])

      let contract = await RemixFactory.connect(addr1).deploy("")
      await expect(contract.connect(addr1).initialize(...args))
        .to.be.revertedWith("!license") 

      contract = await RemixFactory.connect(addr1).deploy("")
      await expect(contract.connect(owner).initialize(...args))
        .to.be.revertedWith("!license") 

      overrides = { value: utils.parseEther("0.01") }

      await Remix1.connect(addr1).purchaseRMX(overrides)

      contract = await RemixFactory.connect(addr1).deploy("")
      await contract.connect(owner).initialize(...args)
    })



    describe("purchaseRmx()", function () {
      beforeEach( async function () {
        RemixFactory = await ethers.getContractFactory("Remix");

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
      } )

      it("Should purchase the RMX", async function () {
        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args); 
        overrides = { value: utils.parseEther("0.01")}

        await Remix1.connect(addr1).purchaseRMX(overrides)
      })
    })

    describe("purchaseCollectible()", function () {
      beforeEach(async function () {
        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args);
      })

      it("Should purchase the Collectible", async function () {
        overrides = { value: utils.parseEther("0.1") }

        await Remix1.connect(addr1).purchaseCollectible(overrides)
        
        expect(await Remix1.balanceOf(addr1.address, 0), "Collectible was not sent!").to.equal(1)
      })

      it ("Should emit the Collectible Purchased event", async function () {
        overrides = { value: utils.parseEther("0.1") }

        await expect(Remix1.connect(addr1).purchaseCollectible(overrides))
          .to.emit(Remix1, "CollectiblePurchased")
          .withArgs(addr1.address, utils.parseEther("0.1"))
      })

      it ("Should emit the Mint event", async function () {
        overrides = { value: utils.parseEther("0.1") }

        await expect(Remix1.connect(addr1).purchaseCollectible(overrides))
          .to.emit(Remix1, "Mint")
          .withArgs(addr1.address, 0)
      })

      it("Should fail if not enough value", async function () {
        overrides = { value: utils.parseEther("0.01") }

        await expect(Remix1.connect(addr1).purchaseCollectible(overrides))
          .to.be.revertedWith("The price is bellow the value set!")
      }) 
    })

    describe("harvestRoyalties()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args);

        args = buildArgs([owner.address], [Remix1.address])
        Remix2 = await deployRemix(args);

        args = buildArgs([owner.address, addr1.address], [Remix1.address, Remix2.address])
        Remix3 = await deployRemix(args);

        overrides = { value: utils.parseEther("0.2") }
        await Remix1.connect(addr2).purchaseCollectible(overrides)
        await Remix2.connect(addr2).purchaseCollectible(overrides)
        await Remix3.connect(addr2).purchaseCollectible(overrides)
      })

      it("Should have Eth in contracts", async () => {
        expect(await ethers.provider.getBalance(Remix1.address), "Remix1 does not have funds").to.equal(utils.parseEther("0.2"))
        expect(await ethers.provider.getBalance(Remix2.address), "Remix2 does not have funds").to.equal(utils.parseEther("0.2"))
        expect(await ethers.provider.getBalance(Remix3.address), "Remix3 does not have funds").to.equal(utils.parseEther("0.2"))
      })

      it("Should harvest to one authors", async () => {
        const royalties = await ethers.provider.getBalance(Remix1.address);
        const before = await ethers.provider.getBalance(owner.address);
        await Remix1.connect(addr1).harvestRoyalties(addressZero)
        const after = await ethers.provider.getBalance(owner.address);
        expect(after.sub(before), "Owner did not receive funds").to.equal(royalties)
      })

      it("Should harvest to multiple authors", async () => {
        const royalties = await ethers.provider.getBalance(Remix3.address);
        const beforeOwner = await ethers.provider.getBalance(owner.address);
        const beforeAddr1 = await ethers.provider.getBalance(addr1.address);
        await Remix3.connect(addr2).harvestRoyalties(addressZero)
        const afterOwner = await ethers.provider.getBalance(owner.address);
        const afterAddr1 = await ethers.provider.getBalance(addr1.address);
        expect(afterOwner.sub(beforeOwner), "Owner did not receive funds").to.equal(royalties.div(4))
        expect(afterAddr1.sub(beforeAddr1), "Addr1 did not receive funds").to.equal(royalties.div(4))
      })

      it("Should harvest and send up the chain once", async () => {
        const royalties = await ethers.provider.getBalance(Remix1.address);
        const before = await ethers.provider.getBalance(Remix1.address);
        await Remix2.harvestRoyalties(addressZero)
        const after = await ethers.provider.getBalance(Remix1.address);
        expect(after.sub(before), "Remix1 did not receive funds").to.equal(royalties.div(2))
      })

      it("Should harvest and send up the chain to all parents", async () => {
        const royalties = await ethers.provider.getBalance(Remix3.address);
        const beforeRemix1 = await ethers.provider.getBalance(Remix1.address);
        const beforeRemix2 = await ethers.provider.getBalance(Remix2.address);
        await Remix3.harvestRoyalties(addressZero)
        const afterRemix1 = await ethers.provider.getBalance(Remix1.address);
        const afterRemix2 = await ethers.provider.getBalance(Remix1.address);
        expect(afterRemix1.sub(beforeRemix1), "Remix1 did not receive funds").to.equal(royalties.div(4))
        expect(afterRemix2.sub(beforeRemix2), "Remix2 did not receive funds").to.equal(royalties.div(4))
      })

      it("Should work for ERC20", async () => {
        throw Error("Not yet implemented!");
      })
    })

    describe("receive()", function () {
      it("Should receive ERC20", async () => {
        throw Error("Not yet implemented!");
      })
    })

    describe("royaltyInfo()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args);
      })

      it("Should give the correct royalty info", async () => {
        value = utils.parseEther("1");
        const royaltyInfo = await Remix1.royaltyInfo(0, value)
        expect(royaltyInfo.receiver, "Receiver address is not correct").to.equal(Remix1.address)
        expect(royaltyInfo.royaltyAmount, "Royalties amount is not correct").to.equal(utils.parseEther("0.1"))
      })

      it("Should throw a wrong token ID if not collectible", async () => {
        value = utils.parseEther("0.1");
        await expect(Remix1.royaltyInfo(1, value))
          .to.revertedWith("Asking for royalties for a non purchasable token")
      })
    })

    describe("getAuthors()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address, addr1.address])

        Remix1 = await deployRemix(args);
      })

      it("Should give the correct authors array", async () => {
        const authorsRemix1 = await Remix1.getAuthors();
        expect(authorsRemix1, "Authors are not correct").to.eql([owner.address, addr1.address])
      })
    })

    describe("getParents()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args);

        args = buildArgs([owner.address], [Remix1.address])
        Remix2 = await deployRemix(args);
      })

      it("Should give the correct parents array", async () => {
        const parentsRemix1 = await Remix2.getParents();
        expect(parentsRemix1, "Parents are not correct").to.eql([Remix1.address])
      })
    })

    describe("licenseActive()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args);
      })

      it("Should be a valid licence is this is the author", async () => {
        const licence = await Remix1.licenseActive(owner.address);
        expect(licence == true, "Authors does not have the licence!").to.be.true
      })

      it("Should be invalid licence is this is not the author", async () => {
        const licence = await Remix1.licenseActive(addr1.address);
        expect(licence == false, "Stranger has the licence without the RMX or being author!").to.be.true
      })

      it("Should be valid if the address owns an RMX token", async () => {
        overrides = { value: utils.parseEther("0.1")}
        await Remix1.connect(addr1).purchaseRMX(overrides)
        const licence = await Remix1.licenseActive(addr1.address);
        expect(licence == true, "Owner of RMX does not have the licence!").to.be.true
      })
    })

    describe("Flag", function () {
      beforeEach(async () => {
        overrides = { value: utils.parseEther("0.1") }

        args = buildArgs([owner.address])

        Remix1 = await deployRemix(args);
        await Remix1.connect(addr1).purchaseRMX(overrides)

        args = buildArgs([addr1.address], [Remix1.address])
        Remix2 = await deployRemix(args, addr1);
        await Remix2.connect(addr2).purchaseRMX(overrides)

        args = buildArgs([addr2.address], [Remix2.address])
        Remix3 = await deployRemix(args, addr2);
      })

      it("Should flag from first parent", async () => {
        await Remix3.connect(addr1).flag([Remix3.address, Remix2.address])
        expect(await Remix3.isFlagged(), "The contract has not been flagged").to.be.true
      })

      it("Should flag from any parent", async () => {
        await Remix3.connect(owner).flag([Remix3.address, Remix2.address, Remix1.address])
        expect(await Remix3.isFlagged(), "The contract has not been flagged").to.be.true
      })

      it("Should register the flagging parent in mapping", async () => {
        await Remix3.connect(addr1).flag([Remix3.address, Remix2.address])
        expect(await Remix3.flaggingParentsExists(Remix2.address), "The contract has not been flagged").to.be.true
        expect(await Remix3.getFlaggingParents()).to.be.an('array').that.include(Remix2.address);
      })

      it("Should allow multiple flags", async () => {
        await Remix3.connect(addr1).flag([Remix3.address, Remix2.address])
        expect(await Remix3.isFlagged(), "The contract has not been flagged").to.be.true
        
        await Remix3.connect(owner).flag([Remix3.address, Remix2.address, Remix1.address])
        expect(await Remix3.isFlagged(), "The contract has not been flagged").to.be.true

        expect(await Remix3.getFlaggingParents()).to.be.an('array').that.eql([Remix2.address, Remix1.address]);

        await Remix3.connect(addr1).unflag([Remix3.address, Remix2.address], 0)
        expect(await Remix3.isFlagged(), "The contract should still be flagged").to.be.true

        await Remix3.connect(owner).unflag([Remix3.address, Remix2.address, Remix1.address], 0)
        expect(await Remix3.isFlagged(), "The contract should not be flagged").to.be.false
      })

      it("Should emit the Flag signal", async () => {
        await expect(Remix3.connect(addr1).flag([Remix3.address, Remix2.address]))
          .to.emit(Remix3, "Flagged").withArgs(addr1.address, Remix3.address)
      })

      it("Should only allow an author of a parent to flag", async () => {
        await expect(Remix2.connect(addr2).flag([Remix2.address, Remix1.address]))
          .to.be.reverted
        expect(await Remix2.isFlagged(), "The contract been flagged when it wasn't supposed to be!")
          .to.be.false
      })
    })

    describe("UnFlag", function () {
      beforeEach(async () => {
        overrides = { value: utils.parseEther("0.1") }

        args = buildArgs([owner.address])
        Remix1 = await deployRemix(args, owner);
        await Remix1.connect(addr1).purchaseRMX(overrides)
        
        args = buildArgs([addr1.address], [Remix1.address])
        Remix2 = await deployRemix(args, addr1);
        await Remix2.connect(addr2).purchaseRMX(overrides)
        
        args = buildArgs([addr2.address], [Remix2.address])
        Remix3 = await deployRemix(args);
        
        await Remix2.connect(owner).flag([Remix2.address, Remix1.address])
        await Remix3.connect(addr1).flag([Remix3.address, Remix2.address])
        await Remix3.connect(owner).flag([Remix3.address, Remix2.address, Remix1.address])
      })

      it ("Should unflag from a direct parent", async () => {
        expect(await Remix2.isFlagged(), "The starting contract has not been flagged").to.be.true
        await Remix2.connect(owner).unflag([Remix2.address, Remix1.address], 0)
        expect(await Remix2.isFlagged(), "The contract has not been unflagged").to.be.false
      })

      it("Should unflag from any parent", async () => {
        expect(await Remix3.isFlagged(), "The starting contract has not been flagged").to.be.true
        expect(await Remix3.getFlaggingParents(), "The parent is not flagging to begingin with!")
          .to.be.an('array').that.include(Remix1.address);
        await Remix3.connect(owner).unflag([Remix3.address, Remix2.address, Remix1.address], 1)
        expect(await Remix3.getFlaggingParents(), "The parent has not been removed from the flaggers")
          .to.be.an('array').that.does.not.include(Remix1.address);
      })

      it("Should verify that the parent chain is valid", async () => {
        await expect(Remix3.connect(addr2).unflag([Remix3.address, Remix1.address, Remix2.address], 0))
          .to.be.reverted
      })

      it("Should verifiy the that the index corresponds to the correct parent", async () => {
        await expect(Remix3.connect(owner).unflag([Remix3.address, Remix2.address, Remix1.address], 0))
          .to.be.reverted
      })

      it("Should allow to be multiply flagged and partially unflagged", async () => {
        await Remix3.connect(addr1).unflag([Remix3.address, Remix2.address], 0)
        expect(await Remix3.isFlagged(), "The contract should still be flagged").to.be.true

        await Remix3.connect(owner).unflag([Remix3.address, Remix2.address, Remix1.address], 0)
        expect(await Remix3.isFlagged(), "The contract should not be flagged").to.be.false
      })

      it("Should emit the UnFlag signal", async () => {
        await expect(Remix2.connect(owner).unflag([Remix2.address, Remix1.address], 0))
          .to.emit(Remix2, "UnFlagged").withArgs(owner.address, Remix2.address)
      })

      it("Should not allow a non author of a valid parent to unflag", async () => {
        expect(await Remix2.isFlagged(), "The starting contract has not been flagged").to.be.true
        await expect(Remix2.connect(addr2).unflag([Remix2.address, Remix1.address], 0))
          .to.be.reverted
      })

      it("Should allow to reflag", async () => {
        await Remix2.connect(owner).unflag([Remix2.address, Remix1.address], 0)
        expect(await Remix2.isFlagged(), "The contract has not been unflagged").to.be.false
        await Remix2.connect(owner).flag([Remix2.address, Remix1.address])
        expect(await Remix2.isFlagged(), "The contract has not been flagged").to.be.true
        await Remix2.connect(owner).unflag([Remix2.address, Remix1.address], 0)
        expect(await Remix2.isFlagged(), "The contract has not been unflagged").to.be.false
      })
    })
  })


  describe("RemixFactory", function () {
    let RemixFactoryFactory, RemixFactory, factory;
    let Remix1, Remix2, Remix3;

    beforeEach(async () => {
      RemixFactoryFactory = await ethers.getContractFactory("RemixFactory");
      RemixFactory = await ethers.getContractFactory("Remix");
    })

    it("Should deploy the Remix Factory proxy contract", async function () {
      factory = await RemixFactoryFactory.deploy();
    });

    describe("Flag", function () {
      beforeEach(async () => {
        factory = await RemixFactoryFactory.deploy();
        args = buildArgs([addr1.address])
        await factory.connect(addr1).deploy(...args);
        events = await factory.queryFilter("RemixDeployed")
        Remix1 = RemixFactory.attach(events[events.length - 1].args.contractAddress);
      })

      it("Should let the owner flag a remix", async () => {
        await factory.connect(owner).flag(Remix1.address)
        expect(await Remix1.isFlagged(), "The remix has not been flagged!").to.be.true
      })

      it("Should only let the owner flag a remix", async () => {
        await expect(factory.connect(addr1).flag(Remix1.address))
          .to.be.reverted
        expect(await Remix1.isFlagged(), "The remix has not been flagged!").to.be.false
      })
    })

    describe("UnFlag", function () {
      beforeEach(async () => {
        factory = await RemixFactoryFactory.deploy();
        args = buildArgs([addr1.address])
        await factory.connect(addr1).deploy(...args);
        events = await factory.queryFilter("RemixDeployed")
        Remix1 = RemixFactory.attach(events[events.length - 1].args.contractAddress);
        await factory.flag(Remix1.address);
      })

      it("Should let the owner unflag a remix", async () => {
        await factory.connect(owner).unflag(Remix1.address, 0)
        expect(await Remix1.isFlagged(), "The remix has not been unflagged!").to.be.false
      })

      it("Should only let the owner unflag a remix", async () => {
        await expect(factory.connect(addr1).unflag(Remix1.address, 0))
          .to.be.reverted
        expect(await Remix1.isFlagged(), "The remix has been unflagged but wasn't supposed to be!").to.be.true
      })
    })

    describe("deploy()", function () {
      beforeEach(async () => {
        factory = await RemixFactoryFactory.deploy();
      })

      it("Should be able to deploy a remix", async function () {
        args = buildArgs([owner.address])
        await expect(factory.deploy(...args))
          .to.emit(factory, 'RemixDeployed')
      });
    });

    describe("getRemixByAuthor()", function () {
      beforeEach(async () => {
        factory = await RemixFactoryFactory.deploy();
      })

      it("Should return the contracts list for an author", async function () {
        args = buildArgs([owner.address])
        const remix1 = await factory.deploy(...args)
        const remix2 = await factory.deploy(...args)
        events = await factory.queryFilter("RemixDeployed")
        
        const authors = await factory.getRemixByAuthor(owner.address)
        expect(authors).to.eql([events[0].args.contractAddress, events[1].args.contractAddress])
      });
    });

  });
});
