import { ConsoleSqlOutlined } from "@ant-design/icons";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");
export const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

const { ethers } = require("ethers");

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
        this.artifcat = require("../contracts/Remix.json");
        this.events = {}
        if (address) {
            if (signer) {
                this.contract = new ethers.Contract(this.address, this.artifcat.abi, signer);
            } else {
                this.contract = new ethers.Contract(this.address, this.artifcat.abi);
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
            this.RMXPrice,
            this.RMXincrease,
            this.NFTprice,
            this.maxRMXTime,
            this.royalty
        ];
    }

    get isCollectibleAvailable() {
        if (this.events.CollectiblePurchased) {
            return this.events.CollectiblePurchased.length == 0;
        } 
        return false;
    }

    get priceHistory() {
        if (this.events.CollectiblePurchased) {
            return this.events.CollectiblePurchased.map((data) => (data.amount))
        }
        return [];
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
    }

    loadData() {
        this.contract.getAuthors().then((data) => {
            this.authors = data[0];
            this.authorsSplits = data[1];
            this.state++;
        });
        this.contract.getParents().then((data) => {
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
            this.CollectiblePrice = parseInt(data._hex, 16);
            this.state++;
        });
        this.contract.minPurchasePrice().then((data) => {
            this.RMXPrice = parseInt(data._hex, 16);
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
    }

    get isValid() {
        if (!this.uri ||
            !this.RMXMetadata ||
            !this.CollectibleMetadata ||
            !this.CollectiblePrice ||
            !this.RMXPrice ||
            !this.RMXincrease ||
            !this.royalty ||
            !this.maxRMXTime ||
            !this.authors || this.authors.length == 0 ||
            !this.authorsSplits || this.authorsSplits.length != this.authors.length) 
            {
            return false;
            }
        if (this.parent.length > 0) {
            if (!this.parentsSplits || this.parents.length != this.parentsSplits.length) {
                return false;
            }
        }
        return true;
    }

    async uploadMetadata() {
        let files = [];
        if (!this.RMXMetadata)
            throw "Remix Metadata are not set!"
        files.push({
            path: "metadata/0.json",
            content: JSON.stringify(this.RMXMetadata),
        });
        if (!this.CollectibleMetadata)
            throw "Collectible Metadata are not set!"
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
        // if (!this.isValid)
        //     throw "Not all fields have been set!";
        if (!this.signer)
            throw "Signer has not been defined!";
        const factory = new ethers.ContractFactory(this.artifcat.abi, this.artifcat.bytecode, this.signer);
        const result = await factory.deploy(...this.deployArgs);
        if (!result.address)
            throw "There was an unknown error and the address of the contract is not avaiable";
        this.address = result.address;
        this.contract = new ethers.Contract(this.address, this.artifcat.abi, this.signer);
        return this.contract;
    }

    async registerContract(registryContract) {
        if (!registryContract)
            throw "No contract passed";
        if (!this.address)
            throw "The contract address is not set";
        if (!this.signer)
            throw "No signer set!";
        const registerResult = await registryContract.registerRemix(this.authors, this.address);
        return registerResult;
    }
}

export default Remix;
