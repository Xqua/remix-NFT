import { useEffect, useState } from "react";
import {
    useEventListener,
} from "../hooks";
import { Remix } from "../helpers/Remix";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");
export const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

const { ethers } = require("ethers");

const DEBUG = true;

const useRemix = (remixFactory, userSigner) => {
    const [remixContracts, setRemixContracts] = useState(remixFactory.remixContracts);
    let lastIndex = 0;

    useEffect(() => {
        if (remixFactory && address) {
            try {
                remixFactory.contract.on("RemixDeployed", (...events) => {
                    const args = events[events.length - 1].args
                    if (!remixContracts[args.contractAddress]) {
                        remixContracts[args.contractAddress] = new Remix(args.contractAddress, userSigner)
                    }
                    setRemixContracts(remixContracts);
                });
                return () => {
                    remixFactory.contract.removeListener("RemixDeployed");
                };
            } catch (e) {
                console.log(e);
            }
        }
    }, [remixFactory, address]);

    return remixContracts;
};

const useAddressRemixes = ( remixFactory, address) => {
    const [myContracts, setMyContracts] = useState([]);

    const getContracts = async () => {
        const contractAddresses = await remixFactory.getRemixByAuthor(address);
        setMyContracts(contractAddresses);
    }
    
    useEffect(() => {
        if (remixFactory && address) {
            getContracts();
            try {
                remixFactory.contract.on("RemixDeployed", (...events) => {
                    const args = events[events.length - 1].args
                    if (args.authors.includes(address)) {
                        myContracts.push(args.contractAddress)
                        setMyContracts(myContracts)
                    }
                });
                return () => {
                    remixFactory.contract.removeListener("RemixDeployed");
                };
            } catch (e) {
                console.log(e);
            }
        }
    }, [remixFactory, address]);

    return myContracts;
};

export { useRemix, useAddressRemixes };
