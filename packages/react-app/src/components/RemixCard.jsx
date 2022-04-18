import React, {useState, useEffect} from "react";
import { useHistory } from "react-router-dom";
import { Divider, Card, Row, Col, Statistic } from 'antd';
import { DollarOutlined, ShareAltOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import Blockies from "react-blockies";
import {
    useContractLoader,
} from "../hooks";


export default function RemixCard(props) {
    const [remix, setRemix] = useState(props.remix);

    let history = useHistory();
    
    const writeContract = useContractLoader(props.signer, { chainId: props.localChainId, customAddresses: { "Remix": remix.address } }); 

    useEffect(() => {
        setRemix(props.remix)
    }, [props.remix])

    const { Meta } = Card;

    if (!remix.Collectible_metadata) {
        return null;
    } 

    return (
        <Card
            style={{ width: 300 }}
            cover={
                <img
                    alt={remix.Collectible_metadata.name}
                    src={remix.Collectible_metadata.image}
                />
            }
            actions={[
                <FileImageOutlined key="Collectible"/>,
                <DollarOutlined key="RMX" />,
                <EditOutlined key="edit" onClick={() => { props.onDebug(writeContract["Remix"]); history.push("/debugcontracts")}} />
            ]}
        >
            <Meta
                avatar={<Blockies seed={remix.authors[0].toLowerCase()} />}
                title={remix.Collectible_metadata.name}
                description={remix.Collectible_metadata.description}
            />
            <Divider />
            <Row justify="space-between">
                <Col span={12}>
                    <Statistic title="Collectible ($)" value={remix.CollectiblePrice} />
                </Col>
                <Col span={12}>
                    <Statistic title="Remix ($)" value={remix.RMXPrice} />
                </Col>
            </Row>
        </Card>
    )
}