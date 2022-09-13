import { ConsoleSqlOutlined } from "@ant-design/icons";
import { IPFS_SERVER_HOST, IPFS_ENDPOINT, IPFS_SERVER_PORT, IPFS_SERVER_PROTOCOL, IPFS_AUTH } from "../constants";
import { Remix } from "./Remix";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");

export const ipfs = ipfsAPI({ host: IPFS_SERVER_HOST, port: IPFS_SERVER_PORT, protocol: IPFS_SERVER_PROTOCOL, headers: { authorization: IPFS_AUTH } });
const ipfsHost = IPFS_ENDPOINT

const { ethers, utils, Signer } = require("ethers");

/*
  ~ What it does? ~

  This is a wrapper for the RemixFactory contract, it does the JS checks and all.
  It creates an object that has the data of the object, as well as the contract, 
  the bytecode, ABI, etc. It will auto read the fields asynchronously and update the state
  the state can be used to trigger react changes.

  ~ How can I use? ~

  const remixFactory = new RemixFactory(address); <- will returns a ReadOnly RemixFactory class instance
  const remixFactory = new RemixFactory(address, signer); <- will returns a Read Write RemixFactory class instance

  */
export class RemixFactory {
    /**
     * The contructor of the RemixFactory class
     * @param {String} address The address of the RemixFactory 
     * @param {Signer} signer The signer to sign transaction with, provided by EthersJS
     */
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

    /**
     * Convenience function to know if any child has updated its state
     */
    get childrenState() {
        let state = 0;
        Object.keys(this.remixContracts).forEach((address) => {
            state += this.remixContracts[address].state;
        })
        return state;
    }


    /**
     * Wrapper function to get the Remix contract associated to an author
     * @param {String} author the address of the author 
     * @returns {String[]} The array of addresses that this person is an author of.
     */
    async getRemixByAuthor(author) {
        return this.contract.getRemixByAuthor(author)
    }

    /**
     * Internal function called to load all available Remixes deployed by the factory
     */
    loadRemixes() {
        this.contract.queryFilter("RemixDeployed").then((data) => {
            this.events["RemixDeployed"] = data.map((item) => {
                this.remixContracts[item.args.contractAddress] = new Remix(item.args.contractAddress, this.signer)
            })
            this.state++
        })
    }

    /**
     * Intnernal function to start a Listener on the deploy event. This is useful to update the UI when new remix are added.
     */
    startListener() {
        try {
            this.contract.on("RemixDeployed", (...events) => {
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

    /**
     * A function to add a callback to the internal callback array. Callbacks are executed on receiving a deploy event.
     * @param {Function} callback 
     */
    registerAddCallback(callback) {
        this.addCallbacks.push(callback)
    }

    /**
     * Wrapper function to deploy a remix object on Chain from the Factory contract.
     * @param {Remix} remix the remix contract to deploy 
     */
    async deploy(remix) {
        if (!this.signer) throw new Error("Signer is not set!");
        const tx = await this.contract.deploy(...remix.deployArgs);
        console.log("Transaction:", tx)
        return tx;
    }
}