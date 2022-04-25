import React, {useState, useEffect } from "react";
import { notification, Modal, Button, Row, Col, Card, Form, Result, InputNumber, Skeleton, Image } from 'antd';
import { DollarOutlined, ShareAltOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import Blockies from "react-blockies";


export default function BuyNFTButton(props) {
    // const [remix, setRemix] = useState(props.remix);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    
    const { Meta } = Card;

    // useEffect(() => {
    //     console.log(" >>>>> Updating Remix. Remix NFT state:", props.remix.isCollectibleAvailable)
    //     setRemix(props.remix)
    // }, [props.remix, props.remix.state])

    const onBuyNFT = (values) => {
        console.log("Buy NFT", values);
        setIsLoading(true);
        props.remix.purchaseCollectible(values.price).then((result) => {
            notification.info({ message:"Congratulation, you just bought this collectible NFT!", placement: "bottomRight"})
            props.remix.loadEvents();
            setIsLoading(false);
            setIsSuccess(true)
        }).catch((err) => {
            console.log(err);
            notification.error({ message: "An error occured buying this collectible NFT!:", placement: "bottomRight" })
            setIsLoading(false);
            setIsError(true);
        })
    }

    if (!props.remix) {
        return (<Skeleton.Button active />)
    }

    if (!props.remix?.isCollectibleAvailable)
    {
        return (<Button type="dashed" disabled>No NFT left</Button>)
    }

    return (
        <>
            <Button onClick={() => {setIsModalVisible(true)}} type="primary">Buy NFT</Button>
            <Modal 
                forceRender={true}
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
                                props.remix?.CollectibleMetadata?.name == null ?
                                    <Skeleton.Image />
                                    :
                                    <Image
                                        width={"100%"}
                                        alt={props.remix?.CollectibleMetadata?.name}
                                        src={props.remix?.CollectibleMetadata?.image}
                                    />
                            }
                        >
                            <Skeleton avatar active loading={props.remix?.CollectibleMetadata?.image == null}>
                                <Meta
                                    avatar={<Blockies seed={props.remix?.author != null ? props.remix?.authors[0].toLowerCase() : "seed"} />}
                                    title={props.remix?.CollectibleMetadata?.name}
                                    description={props.remix?.CollectibleMetadata?.description}
                                />
                            </Skeleton>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <>
                        {
                            !isSuccess && !isError ?
                            <Form
                                initialValues={{
                                    'price': props.remix?.CollectiblePrice,
                                }}
                                onFinish={onBuyNFT}
                            >
                                <p>The author set a minimum price of {props.remix?.CollectiblePrice} {props.remix?.currency} to purchase this collectible.</p>
                                <Form.Item
                                    label="Your price"
                                    name="price"
                                    rules={[{ min: props.remix?.CollectiblePrice, type: "number", message:"Price must be more than the requested amount."},{ required: true, message: 'Please input your username!' }]}
                                >
                                    <InputNumber />
                                </Form.Item>
                                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                    <Button type="primary" htmlType="submit" loading={isLoading}>
                                        Buy
                                    </Button>
                                </Form.Item>
                            </Form>
                            :
                            isSuccess ? 
                                <Result
                                    status="success"
                                    title="Successfully Purchased this NFT!"
                                    subTitle={`You can add it to your MetaMask wallet by doing XXX with address: ${props.remix.address}`}
                                /> :
                            isError ?
                                <Result
                                    status="error"
                                    title="An error occured buyinng this NFT!"
                                    subTitle="You can check the console for the error message"
                                /> :
                                <p>Something went wrong</p>
                        }
                        </>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}