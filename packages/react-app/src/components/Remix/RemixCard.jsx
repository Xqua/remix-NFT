import React, {useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Divider, Card, Badge, Row, Col, Statistic, Image, Skeleton, Modal } from 'antd';
import { DollarOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import Blockies from "react-blockies";
import { BuyNFTButton, BuyRMXButton, RemixContainer } from "."

export default function RemixCard(props) {
    const [remix, setRemix] = useState({});
    let history = useHistory();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
    
    useEffect(() => {
        setRemix(props.remix)
    }, [props.remix, props.remix.state])

    const { Meta } = Card;

    return (
        <Card
            style={{ width: 300 }}
            cover={remix?.CollectibleMetadata == null ?
                <Skeleton.Image active style={{ width: 300, height: 200 }} />
                :
                remix.isFlagged ? 
                    <Badge.Ribbon text="Flagged!" color="red">
                        <Image
                            alt={remix?.CollectibleMetadata?.name}
                            src={remix?.CollectibleMetadata?.image}
                        />
                    </Badge.Ribbon>
                :
                    <Image
                        alt={remix?.CollectibleMetadata?.name}
                        src={remix?.CollectibleMetadata?.image}
                    />
            }
            actions={[
                <FileImageOutlined key="Show" onClick={() => setIsModalVisible(true)} />,
                <DollarOutlined key="Buy" onClick={() => setIsBuyModalVisible(true)} />,
                <EditOutlined key="edit" onClick={() => { if (remix.address) { props.onDebug(remix.address); history.push("/debugcontracts") } }} />
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
            <Modal
                title={remix?.CollectibleMetadata?.name}
                visible={isModalVisible}
                onOk={() => setIsModalVisible(false)}
                onCancel={() => setIsModalVisible(false)}
                width={"90%"}
            >
                <RemixContainer remix={remix} />
            </Modal>
            <Modal
                title="Buy this Remix"
                visible={isBuyModalVisible}
                onOk={() => setIsBuyModalVisible(false)}
                onCancel={() => setIsBuyModalVisible(false)}
            >
                <Row justify="space-between">
                    <Col span={12}>
                        {remix?.CollectiblePrice == null ? <Skeleton.Button active /> : <Statistic title="Collectible ($)" value={remix?.CollectiblePrice} />}
                        <BuyNFTButton remix={remix} onClick={() => setIsBuyModalVisible(false)} />
                    </Col>
                    <Col span={12}>
                        {remix?.RMXPrice == null ? <Skeleton.Button active /> : <Statistic title="Remix ($)" value={remix?.RMXPrice} />}
                        <BuyRMXButton remix={remix} onClick={() => setIsBuyModalVisible(false)} />
                    </Col>
                </Row>
            </Modal>
        </Card>
    )
}