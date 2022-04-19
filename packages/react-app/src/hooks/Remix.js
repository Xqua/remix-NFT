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

const useRemix = (localProvider, readContracts, userSigner) => {
    const [remixContracts, setRemixContracts] = useState({});
    let lastIndex = 0;

    const newRemixEvents = useEventListener(readContracts, "RemixRegistry", "NewRemix", localProvider, 1);

    useEffect(() => { 
        newRemixEvents.slice(lastIndex).forEach((event) => {
            if (!remixContracts[event.contractAddress]) {
                remixContracts[event.contractAddress] = new Remix(event.contractAddress, userSigner)
            }
            lastIndex++;
        })
        setRemixContracts({...remixContracts});
    }, 
        [newRemixEvents]);

    return remixContracts;
};

export default useRemix;
