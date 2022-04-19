import React, {useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Divider, Card, Row, Col, Statistic, Image, Skeleton } from 'antd';
import { DollarOutlined, ShareAltOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import Blockies from "react-blockies";
import {
    useContractLoader,
} from "../hooks";


export default function RemixCard(props) {
    const [remix, setRemix] = useState(props.remix ? props.remix : {});
    let history = useHistory();
    
    //const writeContract = useContractLoader(props.signer, { chainId: props.localChainId, customAddresses: { "Remix": remix.address } }); 

    useEffect(() => {
        setRemix(props.remix)
    }, [props.remix])

    useEffect(() => {
        setRemix({ ...props.remix })
        console.log("Remix updated!", remix)
    }, [props.remix.state])

    const { Meta } = Card;

    return (
        <Card
            style={{ width: 300 }}
            cover={
                remix?.CollectibleMetadata == null ? 
                <Skeleton.Image active style={{width:300, height:200}} />
                :
                <Image
                    alt={remix?.CollectibleMetadata?.name}
                    src={remix?.CollectibleMetadata?.image}
                />
            }
            actions={[
                <FileImageOutlined key="Collectible"/>,
                <DollarOutlined key="RMX" />,
                <EditOutlined key="edit" onClick={() => { if (remix.address) {props.onDebug(remix.address); history.push("/debugcontracts")}}} />
            ]}
        >   
            <Skeleton avatar active loading={remix?.CollectibleMetadata == null}>
                <Meta
                    avatar={<Blockies seed={remix?.author != null ? remix.authors[0].toLowerCase() : "seed"} />}
                    title={remix?.CollectibleMetadata?.name}
                    description={remix?.CollectibleMetadata?.description}
                />
            </Skeleton>
            <Divider />
            <Row justify="space-between">
                <Col span={12}>
                    {remix?.CollectiblePrice == null ? <Skeleton.Button active /> : <Statistic title="Collectible ($)" value={remix?.CollectiblePrice} />}
                </Col>
                <Col span={12}>
                    {remix?.RMXPrice == null ? <Skeleton.Button active /> : <Statistic title="Remix ($)" value={remix?.RMXPrice} />}
                </Col>
            </Row>
        </Card>
    )
}