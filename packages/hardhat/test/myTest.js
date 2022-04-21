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
    utils.parseEther("0.01"), // uint256 _increasePoints,
    utils.parseEther("0.1"), // uint256 _collectiblePrice,
    10000, // uint256 _rmxCountdown,
    100] // uint256 _royalties
  return args;
} 

const addressZero = "0x0000000000000000000000000000000000000000";
  
  describe("Remix-NFT", function () {
    let RemixFactory;
    let Remix1, Remix2, Remix3;
    let args;
    let events;
    let owner, addr1, addr2, addrs;
  //const [owner, addr1, addr2] = await ethers.getSigners();

  describe("Remix", function () {

    beforeEach(async function () {
      // Get the ContractFactory and Signers here.
      RemixFactory = await ethers.getContractFactory("Remix");

      [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    });

    it("Should deploy Remix with no parents", async function () {
      args = buildArgs([owner.address])

      Remix1 = await RemixFactory.deploy(...args); 
    })

    it("Should deploy Remix with multiple authors", async function () {
      args = buildArgs([owner.address, addr1.address])

      Remix1 = await RemixFactory.deploy(...args);
    })

    it("Should have the correct arguments", async function () {
      args = buildArgs([])

      await expect(RemixFactory.deploy(...args))
        .to.be.revertedWith('There must be at least one author');

      args = buildArgs([owner.address])
      args[2] = [2000, 2000]

      await expect(RemixFactory.deploy(...args))
        .to.be.revertedWith('!length');

      args = buildArgs([owner.address], [owner.address])
      args[4] = []

      await expect(RemixFactory.deploy(...args))
        .to.be.revertedWith('!length');

      args = buildArgs([owner.address], [owner.address])

      await expect(RemixFactory.deploy(...args))
        .to.be.reverted;

      args = buildArgs([owner.address])
      args[2] = [2000]

      await expect(RemixFactory.deploy(...args))
        .to.be.revertedWith("!split total");
      
      args = buildArgs([owner.address])
      args[9] = 20000

      await expect(RemixFactory.deploy(...args))
        .to.be.revertedWith("max royalties exceeded");
    }) 

    it("Should deploy a Remix with parents", async function () {
      args = buildArgs([owner.address])

      Remix1 = await RemixFactory.deploy(...args); 

      args = buildArgs([owner.address], [Remix1.address], 1)

      Remix2 = await RemixFactory.deploy(...args); 

      const parent = await Remix2.parents(0);
      expect(parent == Remix2.address, "Contract did not save the parents")
      events = await Remix1.queryFilter("DerivativeIssued")
      expect(events.length == 1, "DerivativeIssue events missing")
    })

    it("Should emit the correct events", async function () {
      const args = buildArgs([owner.address])

      Remix1 = await RemixFactory.deploy(...args); 

      events = await Remix1.queryFilter("Finalized")
      expect(events.length == 1, "Finalized event number is not correct")

      events = await Remix1.queryFilter("Mint")
      expect(events.length == 2, "Mint event number is not correct")
      expect(events[0].args.tokenID == 3, "First mint is not badge")
      expect(events[1].args.tokenID == 0, "Second mint is not RMX")
    })

    it("Should require the RMX token", async () => {
      args = buildArgs([owner.address])

      Remix1 = await RemixFactory.deploy(...args); 

      args = buildArgs([addr1.address], [Remix1.address])

      await expect(RemixFactory.deploy(...args))
        .to.be.revertedWith("!license") 
    })

    describe("purchaseRmx()", function () {
      beforeEach( async function () {
        RemixFactory = await ethers.getContractFactory("Remix");

        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
      } )

      it("Should purchase the RMX", async function () {
        args = buildArgs([owner.address])

        Remix1 = await RemixFactory.deploy(...args); 
        overrides = { value: utils.parseEther("0.01")}

        await Remix1.connect(addr1).purchaseRMX(overrides)
      })
    })

    describe("purchaseCollectible()", function () {
      beforeEach(async function () {
        args = buildArgs([owner.address])

        Remix1 = await RemixFactory.deploy(...args);
      })

      it("Should purchase the Collectible", async function () {
        overrides = { value: utils.parseEther("0.1") }

        await Remix1.connect(addr1).purchaseCollectible(overrides)
        events = await Remix1.queryFilter("Mint")
        expect(events[2].args.tokenID == 1, "Collectible mint event not sent")

        expect(Remix1.balanceOf(owner.address, 1) == 0, "Owner still has collectible!")
        expect(Remix1.balanceOf(addr1.address, 1) == 1, "Collectible was not sent!")
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

        Remix1 = await RemixFactory.deploy(...args);

        args = buildArgs([owner.address], [Remix1.address])
        Remix2 = await RemixFactory.deploy(...args);

        args = buildArgs([owner.address, addr1.address], [Remix1.address, Remix2.address])
        Remix3 = await RemixFactory.deploy(...args);

        overrides = { value: utils.parseEther("0.2") }
        await Remix1.connect(addr2).purchaseCollectible(overrides)
        await Remix2.connect(addr2).purchaseCollectible(overrides)
        await Remix3.connect(addr2).purchaseCollectible(overrides)
      })

      it("Should have Eth in contracts", async () => {
        expect(await ethers.provider.getBalance(Remix1.address) == utils.parseEther("0.2"), "Remix1 does not have funds")
        expect(await ethers.provider.getBalance(Remix2.address) == utils.parseEther("0.2"), "Remix2 does not have funds")
        expect(await ethers.provider.getBalance(Remix3.address) == utils.parseEther("0.2"), "Remix3 does not have funds")
      })

      it("Should harvest to one authors", async () => {
        const before = await ethers.provider.getBalance(owner.address);
        await Remix1.harvestRoyalties(addressZero)
        const after = await ethers.provider.getBalance(owner.address);
        expect(after - before == parseInt(utils.parseEther("0.2")._hex, 16), "Owner did not receive funds")
      })

      it("Should harvest to multiple authors", async () => {
        const beforeOwner = await ethers.provider.getBalance(owner.address);
        const beforeAddr1 = await ethers.provider.getBalance(addr1.address);
        await Remix3.harvestRoyalties(addressZero)
        const afterOwner = await ethers.provider.getBalance(owner.address);
        const afterAddr1 = await ethers.provider.getBalance(addr1.address);
        expect(afterOwner - beforeOwner == parseInt(utils.parseEther("0.05")._hex, 16), "Owner did not receive funds")
        expect(afterAddr1 - beforeAddr1 == parseInt(utils.parseEther("0.05")._hex, 16), "Addr1 did not receive funds")
      })

      it("Should harvest and send up the chain once", async () => {
        const before = await ethers.provider.getBalance(Remix1.address);
        await Remix2.harvestRoyalties(addressZero)
        const after = await ethers.provider.getBalance(Remix1.address);
        expect(after - before == parseInt(utils.parseEther("0.1")._hex, 16), "Remix1 did not receive funds")
      })

      it("Should harvest and send up the chain to all parents", async () => {
        const beforeRemix1 = await ethers.provider.getBalance(Remix1.address);
        const beforeRemix2 = await ethers.provider.getBalance(Remix2.address);
        await Remix2.harvestRoyalties(addressZero)
        const afterRemix1 = await ethers.provider.getBalance(Remix1.address);
        const afterRemix2 = await ethers.provider.getBalance(Remix1.address);
        expect(afterRemix1 - beforeRemix1 == parseInt(utils.parseEther("0.05")._hex, 16), "Remix1 did not receive funds")
        expect(afterRemix2 - beforeRemix2 == parseInt(utils.parseEther("0.05")._hex, 16), "Remix1 did not receive funds")
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

        Remix1 = await RemixFactory.deploy(...args);
      })

      it("Should give the correct royalty info", async () => {
        value = utils.parseEther("1");
        const royaltyInfo = await Remix1.royaltyInfo(1, value)
        expect(royaltyInfo.receiver == Remix1.address, "Receiver address is not correct")
        expect(royaltyInfo.royaltyAmount == utils.parseEther("0.1"), "Royalties amount is not correct")

      })

      it("Should throw a wrong token ID if not collectible", async () => {
        value = utils.parseEther("0.1");
        await expect(Remix1.royaltyInfo(0, value))
          .to.revertedWith("Asking for royalties for a non purchasable token")
      })
    })

    describe("getAuthors()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address, addr1.address])

        Remix1 = await RemixFactory.deploy(...args);
      })

      it("Should give the correct authors string", async () => {
        const authorsRemix1 = await Remix1.getAuthors();
        expect(authorsRemix1 == [owner.address, addr1.address], "Authors are not correct")
      })
    })

    describe("getParents()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address])

        Remix1 = await RemixFactory.deploy(...args);

        args = buildArgs([owner.address], [Remix1.address])
        Remix2 = await RemixFactory.deploy(...args);
      })

      it("Should give the correct authors string", async () => {
        const parentsRemix1 = await Remix2.getParents();
        expect(parentsRemix1 == [Remix1.address], "Parents are not correct")
      })
    })

    describe("licenseActive()", function () {
      beforeEach(async () => {
        args = buildArgs([owner.address])

        Remix1 = await RemixFactory.deploy(...args);
      })

      it("Should be a valid licence is this is the author", async () => {
        const licence = await Remix1.licenseActive(owner.address);
        expect(licence == true, "Authors does not have the licence!")
      })

      it("Should be invalid licence is this is not the author", async () => {
        const licence = await Remix1.licenseActive(addr1.address);
        expect(licence == false, "Stranger has the licence without the RMX or being author!")
      })

      it("Should be valid if the address owns an RMX token", async () => {
        overrides = { value: utils.parseEther("0.1")}
        await Remix1.connect(addr1).purchaseRMX(overrides)
        const licence = await Remix1.licenseActive(addr1.address);
        expect(licence == true, "Owner of RMX does not have the licence!")
      })
    })
  })

  describe("RemixRegistry", function () {
    let RemixRegistryFactory, RemixFactory, registry;

    beforeEach(async () => {
      RemixRegistryFactory = await ethers.getContractFactory("RemixRegistry");
      RemixFactory = await ethers.getContractFactory("Remix");
    })

    it("Should deploy YourContract", async function () {
      registry = await RemixRegistryFactory.deploy();
    });

    describe("registerRemix()", function () {
      beforeEach(async () => {
        registry = await RemixRegistryFactory.deploy();

      })

      it("Should be able to register a remix", async function () {
        args = buildArgs([owner.address])
        const Remix = await RemixFactory.deploy(...args)
        await expect(registry.registerRemix([owner.address], Remix.address))
          .to.emit(registry, 'NewRemix')
          .withArgs([owner.address], Remix.address);
      });

      it("Should return the contracts list for an author", async function () {

      })
    });

    describe("getRemixByAuthor()", function () {
      beforeEach(async () => {
        registry = await RemixRegistryFactory.deploy();
      })

      it("Should return the contracts list for an author", async function () {
        args = buildArgs([owner.address])
        const Remix = await RemixFactory.deploy(...args)
        await registry.registerRemix([owner.address], Remix.address)
        const authors = await registry.getRemixByAuthor(owner.address)
        expect(authors == [Remix.address])
      });
    });

  });
});
