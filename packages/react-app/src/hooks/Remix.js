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
    const [remixContracts, setRemixContracts] = useState(remixFactory ? remixFactory.remixContracts : {});

    useEffect(() => {
        if (remixFactory) {
            setRemixContracts(remixFactory.remixContracts);
        }
    }, [remixFactory.state]);

    return remixContracts;
};

const useAddressRemixes = ( remixFactory, address) => {
    const [myContracts, setMyContracts] = useState([]);

    const getContracts = async () => {
        remixFactory.getRemixByAuthor(address).then((contractAddresses) => {
            setMyContracts(contractAddresses);
        })
    }
    
    useEffect(() => {
        if (remixFactory.contract && address) {
            getContracts();
            try {
                remixFactory.contract.on("RemixDeployed", (...events) => {
                    const args = events[events.length - 1].args
                    if (args.authors.includes(address) && !myContracts.includes(args.contractAddress)) {
                        let contracts = [...myContracts];
                        contracts.push(args.contractAddress)
                        setMyContracts(contracts)
                    }
                });
                return () => {
                    remixFactory.contract.removeListener("RemixDeployed");
                };
            } catch (e) {
                console.log(e);
            }
        }
    }, [remixFactory, address, remixFactory.state]);

    return myContracts;
};

export { useRemix, useAddressRemixes };
