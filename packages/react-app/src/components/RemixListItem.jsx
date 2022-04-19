import React, {useState, useEffect } from "react";
import { List, Skeleton, Avatar, Space } from 'antd';


export default function RemixListItem(props) {
    const [remix, setRemix] = useState(props.remix ? props.remix : {});
    
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
                    avatar={<Avatar shape="square" size={64} src={remix?.RMXMetadata?.image} />}
                    title={remix?.RMXMetadata?.name}
                    description={remix?.RMXMetadata?.description}
                    />
                <Space>
                    {props.CTA1}
                    {props.CTA2}
                </Space>
            </Skeleton>
        </List.Item>
    )
}