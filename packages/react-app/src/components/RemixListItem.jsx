import React, {useState, useEffect, useContext } from "react";
import { List, Skeleton, Avatar, Space, Modal } from 'antd';
import { Link } from "react-router-dom";
import { RemixContext } from "../helpers"
import { RemixContainer } from ".";


export default function RemixListItem(props) {
    const [remix, setRemix] = useState(props.remix ? props.remix : {});
    const [remixContext, setRemixContext] = useContext(RemixContext);
    const [selectedRemix, setSelectedRemix] = useState();
    const [isModalVisible, setIsModalVisible] = useState(false);
    //const writeContract = useContractLoader(props.signer, { chainId: props.localChainId, customAddresses: { "Remix": remix.address } }); 

    useEffect(() => {
        setRemix(props.remix)
    }, [props.remix])

    useEffect(() => {
        setRemix({ ...props.remix })
        console.log("Remix updated!", remix)
    }, [props.remix.state])

    const isLoading = () => {
        if (remix == null) return true;
        if (remix.RMXMetadata == null) return true;
        if (remix.RMXMetadata.image == null) return true;
        if (remix.RMXMetadata.name == null) return true;
        if (remix.RMXMetadata.description == null) return true;
        return false;
    }

    return (
        <List.Item key={remix.address}>
            <Skeleton avatar active paragraph={{ rows: 1 }} loading={isLoading()} >
                <List.Item.Meta
                    onClick={() => { setSelectedRemix(remixContext.remixContracts[remix.address] ); setIsModalVisible(true)}}
                    avatar={<Avatar shape="square" size={64} src={remix?.RMXMetadata?.image} />}
                    title={remix?.RMXMetadata?.name}
                    description={remix?.RMXMetadata?.description}
                    />  
                <Space>
                    {props.CTA1}
                    {props.CTA2}
                </Space>
            </Skeleton>
            <Modal 
                title={selectedRemix?.RMXMetadata?.name} 
                visible={isModalVisible} 
                onOk={() => setIsModalVisible(false)} 
                onCancel={() => setIsModalVisible(false)}
                width={"90%"}
            >
                <RemixContainer remix={selectedRemix} />
            </Modal>
        </List.Item>
    )
}