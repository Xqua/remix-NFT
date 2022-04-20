import React, {useState, useEffect } from "react";
import { notification, Modal, Button, Row, Col, Card, Form, InputNumber, Skeleton, Image } from 'antd';
import { DollarOutlined, ShareAltOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import Blockies from "react-blockies";


export default function BuyNFTButton(props) {
    const [remix, setRemix] = useState(props.remix ? props.remix : {});
    const [isModalVisible, setIsModalVisible] = useState(false);
    
    const { Meta } = Card;
    useEffect(() => {
        setRemix(props.remix)
    }, [props.remix, props.remix.state])

    const onBuyNFT = (values) => {
        console.log("Buy NFT", values);
        remix.purchaseCollectible(values.price).then((result) => {
            notification.info({ message:"Congratulation, you just bought this collectible NFT!", placement: "bottomRight"})
            remix.loadEvents();
        }).catch((err) => {
            console.log(err);
            notification.error({ message: "An error occured buying this collectible NFT!", placement: "bottomRight" })
        })
    }

    if (!remix.isCollectibleAvailable) 
    {
        return (
            <Button type="dashed" disabled>No NFT left</Button>
        );
    }

    return (
        <>
        <Button onClick={() => {setIsModalVisible(true)}} type="primary">Buy NFT</Button>
            <Modal 
                width="70%"
                title="Buy the NFT"
                visible={isModalVisible} 
                onOk={() => setIsModalVisible(false)} 
                onCancel={() => setIsModalVisible(false)}
            >
                <Row>
                    <Col span={12}>
                        <Card
                            style={{ width: "70%" }}
                            cover={
                                remix?.CollectibleMetadata?.name == null ?
                                    <Skeleton.Image />
                                    :
                                    <Image
                                        width={"100%"}
                                        alt={remix?.CollectibleMetadata?.name}
                                        src={remix?.CollectibleMetadata?.image}
                                    />
                            }
                        >
                            <Skeleton avatar active loading={remix?.CollectibleMetadata?.image == null}>
                                <Meta
                                    avatar={<Blockies seed={remix.author != null ? remix.authors[0].toLowerCase() : "seed"} />}
                                    title={remix?.CollectibleMetadata?.name}
                                    description={remix?.CollectibleMetadata?.description}
                                />
                            </Skeleton>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Form
                            initialValues={{
                                'price': remix.CollectiblePrice,
                            }}
                            onFinish={onBuyNFT}
                        >
                            <p>The author set a minimum price of {remix.CollectiblePrice} {remix.currency} to purchase this collectible.</p>
                            <Form.Item
                                label="Your price"
                                name="price"
                                rules={[{ min: remix.CollectiblePrice, type: "number", message:"Price must be more than the requested amount."},{ required: true, message: 'Please input your username!' }]}
                            >
                                <InputNumber />
                            </Form.Item>
                            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                <Button type="primary" htmlType="submit">
                                    Buy
                                </Button>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}