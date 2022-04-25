import { ConsoleSqlOutlined } from "@ant-design/icons";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");
export const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

const { ethers, utils } = require("ethers");


const getFromIPFS = async hashToGet => {
    for await (const file of ipfs.get(hashToGet)) {
        if (!file.content) continue;
        const content = new BufferList();
        for await (const chunk of file.content) {
            content.append(chunk);
        }
        return content;
    }
};

const readJSONFromIPFS = async (uri) => {
    const ipfsHash = uri.replace("https://ipfs.io/ipfs/", "");
    try {
        const jsonManifestBuffer = await getFromIPFS(ipfsHash);
        const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
        return jsonManifest;
    } catch (e) {
        console.log("Error reading JSON from IPFS", e);
        return {};
    }
}

const getERC20Info = async (address, blockchain = "ethereum") => {
    const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${blockchain}/assets/${address}/info.json`
    const info = JSON.parse(await fetch(url));
    info.logo = `https://github.com/trustwallet/assets/raw/master/blockchains/${blockchain}/assets/${address}/logo.png`
    return info
}

/*
  ~ What it does? ~

  This is a wrapper for the Remix contract, it does the JS checks and all.
  It creates an object that has the data of the object, as well as the contract, 
  the bytecode, ABI, etc. It will auto read the fields asynchronously and update the state
  the state can be used to trigger react changes.

  ~ How can I use? ~

  const remix = new Remix(); <- will returns a new Remix empty contract object, useful for deployement
  const remix = new Remix(address); <- will returns a ReadOnly Remix contract object
  const remix = new Remix(address, signer); <- will returns a Read Write Remix contract object

  */
export class Remix {
    constructor(address, signer) {
        this.state = 0;
        this.address = address;
        this.signer = signer;
        this.currency = "ETH"
        this.artifact = require("../contracts/Remix.json");
        this.events = {}
        this.authors = []
        this.parents = []
        this.isAuthor = false;
        if (address) {
            if (signer) {
                this.contract = new ethers.Contract(this.address, this.artifact.abi, signer);
            } else {
                this.contract = new ethers.Contract(this.address, this.artifact.abi);
            }
            this.loadData();
            this.loadEvents();
        }
    }

    

    get children() {
        if (this.events.DerivativeIssued) {
            return this.events.DerivativeIssued.map((data) => (data.args.dst))
        }
        return [];
    } 

    get deployArgs() {
        return [
            this.uri,
            this.authors,
            this.authorsSplits,
            this.parents,
            this.parentsSplits,
            utils.parseEther(this.RMXPrice.toString()),
            utils.parseEther(this.RMXincrease.toString()),
            utils.parseEther(this.NFTprice.toString()),
            this.maxRMXTime,
            this.royalty
        ];
    }

    get isCollectibleAvailable() {
        if (!this.currentCollectibleOwner) return null
        if (this.currentCollectibleOwner != "0x0000000000000000000000000000000000000000") return false;
        return true;
    }

    get priceHistory() {
        let prices = []
        if (this.events.CollectiblePurchased) {
            this.events.CollectiblePurchased.forEach((data) => {
                prices.push({token:"Collectible", price: utils.formatEther(data.args.amount)})
            })
        }
        if (this.events.RMXPurchased) {
            this.events.RMXPurchased.forEach((data) => {
                prices.push({ token: "RMX", price: utils.formatEther(data.args.amount) })
            })
        }
        return prices;
    }

    get activity() {
        let activity = []
        let selectedEvent = [
            "BadgeIssued",
            "CollectiblePurchased",
            "DerivativeIssued",
            "Mint",
            "ParentAdded",
            "RMXPurchased",
            "RoyaltiesHarvested",
            "RoyaltyReceived",
            "TransferBatch",
            "TransferSingle"
        ]
        selectedEvent.forEach((eventName) => {
            if (this.events[eventName]) activity = activity.concat(this.events[eventName]);
        })
        activity.sort(function (a, b) {
            return a.blockNumber - b.blockNumber;
        });
        return activity;
    }

    async valueHeld() {
        const result = await this.contract.getRoyalties();
        const values = []
        for (let i = 0; i < result[0].length; i++) {
            let tokenName, logo, value;
            if (result[0][i] == "0x0000000000000000000000000000000000000000") {
                tokenName = "Eth"
                logo = "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg"
                value = parseFloat(utils.formatEther(result[1][i]))
            } else {
                const info = await getERC20Info(result[0][i]);
                tokenName = info.name;
                logo = info.logo;
                value = parseFloat(utils.formatUnits(result[1][i], info.decimals))
            }
            values.push({
                token: tokenName,
                logo: logo,
                value: value,
                address: result[0][i]
            })
        }
        return values
    }

    async purchaseCollectible(price) {
        let overrides = {
            value: utils.parseEther(price.toString())     // ether in this case MUST be a string
        };
        const result = await this.contract.purchaseCollectible(overrides)
        this.state++
        this.loadData()
        return result;
    }

    async purchaseRMX(price) {
        let overrides = {
            value: utils.parseEther(price.toString())     // ether in this case MUST be a string
        };
        const result = await this.contract.purchaseRMX(overrides)
        this.state++
        this.loadData()
        return result;
    }

    async harvest(tokenAddress) {
        await this.contract.harvestRoyalties(tokenAddress)
        this.state++;
    }

    getTokenName(tokenID) {
        switch (tokenID) {
            case 0:
                return "RMX"
            case 1:
                return "Collectible"
            case 2:
                return "Derivative"
            case 3:
                return "Badge"
        }
    }

    startRMXPurchaseListener() {
        try {
            this.contract.on("RMXPurchased", (...events) => {
                console.log("New RMXPurchased Event!")
                const args = events[events.length - 1].args
                this.contract.minPurchasePrice().then((data) => {
                    this.RMXPrice = parseFloat(utils.formatEther(data));
                    this.state++;
                });
            });
            return () => {
                this.contract.removeListener("RMXPurchased");
            };
        } catch (e) {
            console.log(e);
        }
    }

    startCollectiblePurchaseListener() {
        try {
            this.contract.on("CollectiblePurchased", (...events) => {
                console.log("New CollectiblePurchased Event!")
                const args = events[events.length - 1].args
                this.contract.collectiblePrice().then((data) => {
                    this.CollectiblePrice = parseFloat(utils.formatEther(data));
                    this.state++;
                });
            });
            return () => {
                this.contract.removeListener("CollectiblePurchased");
            };
        } catch (e) {
            console.log(e);
        }
    }

    startRoyalitiesListener() {
        try {
            this.contract.on("RoyaltiesHarvested", (...events) => {
                console.log("New RoyaltiesHarvested Event!")
                const args = events[events.length - 1].args
                this.state++;
            });
            return () => {
                this.contract.removeListener("RoyaltiesHarvested");
            };
        } catch (e) {
            console.log(e);
        }

        try {
            this.contract.on("RoyaltyReceived", (...events) => {
                console.log("New RoyaltyReceived Event!")
                const args = events[events.length - 1].args
                this.state++;
            });
            return () => {
                this.contract.removeListener("RoyaltyReceived");
            };
        } catch (e) {
            console.log(e);
        }
    }

    loadEvents() {
        const eventNames = Object.keys(this.contract.interface.events).map(key => (this.contract.interface.events[key].name))
        eventNames.forEach((eventName) => {
            this.contract.queryFilter(eventName).then((data) => {
                this.events[eventName] = data.map((item) => (
                    {
                        args:item.args,
                        blockNumber: item.blockNumber,
                        transactionHash: item.transactionHash,
                        event: item.event
                    }
                    ))
                this.state++
            })
        })
        this.startRMXPurchaseListener();
        this.startCollectiblePurchaseListener();
        this.startRoyalitiesListener();
    }

    loadData() {
        this.contract.getAuthorsAndSplits().then((data) => {
            this.authors = data[0];
            this.authorsSplits = data[1];
            if (this.signer) {
                this.authors.forEach((author) => { if (author == this.signer.address) this.isAuthor = true; })
            }
            this.state++;
        });
        this.contract.getParentsAndSplits().then((data) => {
            this.parents = data[0];
            this.parentsSplits = data[1];
            this.state++;
        });
        if (this.signer) {
            this.signer.getAddress().then((address) => {
                this.contract.licenseActive(address).then((data) => {
                    this.canDerive = data;
                    this.state++;
                });
            });
        } else {
            this.canDerive = false;
            this.state++;
        }
        this.contract.collectiblePrice().then((data) => {
            this.CollectiblePrice = parseFloat(utils.formatEther(data));
            this.state++;
        });
        this.contract.minPurchasePrice().then((data) => {
            this.RMXPrice = parseFloat(utils.formatEther(data));
            this.state++;
        });
        this.contract.uri(0).then((data) => {
            this.uri = data;
            this.state++;
            readJSONFromIPFS(this.uri.replace(/{(.*?)}/, 1)).then((data) => {
                this.CollectibleMetadata = data;
                this.state++;
            });
            readJSONFromIPFS(this.uri.replace(/{(.*?)}/, 0)).then((data) => {
                this.RMXMetadata = data;
                this.state++;
            });
        });
        this.contract.currentCollectibleOwner().then((data) => {
            this.currentCollectibleOwner = data;
            this.state++;
        })
    }

    get isValid() {
        if (!this.uri) return false;
        if (!this.RMXMetadata) return false;
        if (!this.CollectibleMetadata) return false;
        if (!this.CollectiblePrice) return false;
        if (!this.RMXPrice) return false;
        if (!this.RMXincrease) return false;
        if (!this.royalty) return false;
        if (!this.maxRMXTime) return false;
        if (!this.authors) return false;
        if (!this.authorsSplits) return false;
        if (this.authors.length == 0) return false;
        if (this.authors.length != this.authorsSplits.length) return false;
        if (this.parents.length != this.parentsSplits.length) return false;
        if (!this.RMXMetadata.name) return false;
        if (!this.RMXMetadata.description) return false;
        if (!this.RMXMetadata.image) return false;
        if (!this.RMXMetadata.files) return false;
        if (!this.CollectibleMetadata.name) return false;
        if (!this.CollectibleMetadata.description) return false;
        if (!this.CollectibleMetadata.image) return false;
        return true;
    }

    async uploadMetadata() {
        console.log("About to upload metadata:", this.RMXMetadata, this.CollectibleMetadata)
        let files = [];
        if (!this.RMXMetadata)
            throw new Error("Remix Metadata are not set!")
        files.push({
            path: "metadata/0.json",
            content: JSON.stringify(this.RMXMetadata),
        });
        if (!this.CollectibleMetadata)
            throw new Error("Collectible Metadata are not set!")
        files.push({
            path: "metadata/1.json",
            content: JSON.stringify(this.CollectibleMetadata),
        });

        let cid;
        for await (const result of ipfs.addAll(files)) {
            if (result.path == "metadata") {
                cid = result.cid;
            }
        }
        const hash = cid.toString();
        this.uri = "https://ipfs.io/ipfs/" + hash + "/{id}.json";
        return (hash, this.uri);
    }

    async deploy() {
        if (!this.isValid)
            throw "Not all fields have been set!";
        if (!this.signer)
            throw "Signer has not been defined!";
        const factory = new ethers.ContractFactory(this.artifact.abi, this.artifact.bytecode, this.signer);
        const contract = await factory.deploy();
        if (!contract.address)
            throw "There was an unknown error and the address of the contract is not avaiable";
        await contract.initialize(...this.deployArgs);
        this.address = contract.address;
        this.contract = new ethers.Contract(this.address, this.artifact.abi, this.signer);
        return this.contract;
    }
}

export class RemixFactory {
    constructor(address, signer) {
        if (!address) throw new Error("Please set the address of the RemixFactory!")
        this.address = address;
        this.signer = signer;
        this.artifact = require("../contracts/RemixFactory.json");
        this.remixContracts = {}
        this.events = {};
        this.state = 0;
        this.addCallbacks = [];
        if (address) {
            if (signer) {
                this.contract = new ethers.Contract(this.address, this.artifact.abi, signer);
                this.loadRemixes();
                this.startListener()
            } else {
                this.contract = new ethers.Contract(this.address, this.artifact.abi);
            }
        }
    }

    async getRemixByAuthor(author) {
        return this.contract.getRemixByAuthor(author)
    }

    loadRemixes() {
        this.contract.queryFilter("RemixDeployed").then((data) => {
            this.events["RemixDeployed"] = data.map((item) => {
                this.remixContracts[item.args.contractAddress] = new Remix(item.args.contractAddress, this.signer)
            })
            this.state++
        })
    }

    startListener() {
        try {
            this.contract.on("RemixDeployed", (...events) => {
                console.log("New RemixDeployed Event!")
                const args = events[events.length - 1].args
                if (!this.remixContracts[args.contractAddress]) {
                    this.remixContracts[args.contractAddress] = new Remix(args.contractAddress, this.signer)
                    this.addCallbacks.forEach((callback) => {
                        callback(this.remixContracts[args.contractAddress])
                    })
                    this.state++
                }
            });
            return () => {
                this.contract.removeListener("RemixDeployed");
            };
        } catch (e) {
            console.log(e);
        }
    }

    registerAddCallback(callback) {
        this.addCallbacks.push(callback)
    }

    async deploy(remix) {
        let contractsBefore = await this.getRemixByAuthor(remix.authors[0])
        console.log("Deploying with Remix:", remix)
        if (!this.signer) throw new Error("Signer is not set!");
        console.log("About to deploy with: ", remix.deployArgs)
        const tx = await this.contract.deploy(...remix.deployArgs);
        let contractsAfter = await this.getRemixByAuthor(remix.authors[0])

        if (contractsBefore.length == contractsAfter.length)
            throw new Error("There was an unknown error and the address of the contract is not avaiable");
        const newContractAddress = contractsAfter[contractsAfter.length-1];
        const newRemix = new Remix(newContractAddress, this.signer)
        this.remixContracts[newContractAddress] = newRemix;
        this.state++
        return newRemix;
    }
}