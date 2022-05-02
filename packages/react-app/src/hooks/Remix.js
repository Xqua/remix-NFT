import { useEffect, useState } from "react";

var createGraph = require('ngraph.graph');

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

const useRemixGraph = (remixFactory) => {
    const [graph, setGraph] = useState(createGraph())

    useEffect(() => {
        console.log(">>>>>>> Updating remix Contracts: ", remixFactory.remixContracts)
        if (remixFactory.remixContracts) {
            console.log("Creating graph!")
            const newGraph = createGraph();
            Object.keys(remixFactory.remixContracts).forEach((remixAddress) => {
                console.log("Adding Node:", remixAddress)
                newGraph.addNode(remixAddress);
                remixFactory.remixContracts[remixAddress].children.forEach((childAddress) => {
                    newGraph.addNode(childAddress);
                    newGraph.addLink(remixAddress, childAddress);
                    console.log("Adding Link to:", childAddress)
                })
                remixFactory.remixContracts[remixAddress].parents.forEach((parentAddress) => {
                    newGraph.addNode(parentAddress);
                    newGraph.addLink(parentAddress, remixAddress);
                    console.log("Adding Link to:", parentAddress)
                })
            })
            setGraph(newGraph);
        }
    }, [remixFactory, remixFactory.state, remixFactory.remixContracts, remixFactory.childrenState])

    return graph;
}

export { useRemix, useAddressRemixes, useRemixGraph };
