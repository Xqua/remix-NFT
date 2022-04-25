import React, {useState, useEffect } from "react";
import { notification, Modal, Button, Row, Col, Card, Form, Result, InputNumber, Skeleton, Image } from 'antd';
import { DollarOutlined, ShareAltOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import Blockies from "react-blockies";


export default function BuyRMXButton(props) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);

    const { Meta } = Card;

    const onBuyRMX = (values) => {
        //console.log("Buy NFT", values);
        setIsLoading(true)
        props.remix.purchaseRMX(values.price).then((result) => {
            notification.info({ message:"Congratulation, you just bought this collectible NFT!", placement: "bottomRight"})
            props.remix.loadEvents();
            setIsLoading(false)
            setIsSuccess(true);
        }).catch((err) => {
            console.log(err);
            notification.error({ message: "An error occured buying this collectible NFT!", placement: "bottomRight" })
            setIsLoading(false)
            setIsError(true);
        })
    }

    if (!props.remix) {
        return (<Skeleton.Button active />)
    }

    if (props.remix?.canDerive) {
        return (<Button disabled type="dashed">Already own rights</Button>)
    }

    return (
        <>
            <Button onClick={() => { setIsModalVisible(true) }} type="primary">Buy RMX</Button>
            <Modal 
                forceRender={true}
                width="70%"
                title="Buy the RMX token"
                visible={isModalVisible} 
                onOk={() => setIsModalVisible(false)} 
                onCancel={() => setIsModalVisible(false)}
            >
                <Row>
                    <Col span={12}>
                        <Card
                            style={{ width: "70%" }}
                            cover={
                                props.remix?.RMXMetadata?.name == null ?
                                    <Skeleton.Image />
                                    :
                                    <Image
                                        width={"100%"}
                                        alt={props.remix?.RMXMetadata?.name}
                                        src={props.remix?.RMXMetadata?.image}
                                    />
                            }
                        >
                            <Skeleton avatar active loading={props.remix?.RMXMetadata?.image == null}>
                                <Meta
                                    avatar={<Blockies seed={props.remix?.author != null ? props.remix?.authors[0].toLowerCase() : "seed"} />}
                                    title={props.remix?.RMXMetadata?.name}
                                    description={props.remix?.RMXMetadata?.description}
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
                                    'price': props.remix?.RMXPrice,
                                }}
                                onFinish={onBuyRMX}
                            >
                                <p>The author set a minimum price of {props.remix?.RMXPrice} {props.remix?.currency} to purchase this RMX.</p>
                                <Form.Item
                                    label="Your price"
                                    name="price"
                                    rules={[{ min: props.remix?.RMXPrice, type: "number", message:"Price must be more than the requested amount."},{ required: true, message: 'Please input your username!' }]}
                                >
                                    <InputNumber />
                                </Form.Item>
                                {!isSuccess ? 
                                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                                        <Button loading={isLoading} disabled={isLoading} type="primary" htmlType="submit">
                                            Buy
                                        </Button>
                                    </Form.Item>
                                : 
                                    null    
                                }
                        </Form>
                        : null
                        }
                        {
                            isSuccess ?
                                <Result
                                    status="success"
                                    title="Successfully Purchased the rights to Remix!"
                                    subTitle="This RMX symbolizes the rights you have to make derivative art. Go create now! You can also see the the badge that shows you have owned those rights in Metamask by doing XXX"
                                /> :
                                null
                        }
                        {
                            isError ?
                                <Result
                                    status="error"
                                    title="An error occured buyinng this RMX!"
                                    subTitle="You can check the console for the error message"
                                /> :
                                null
                        }
                        </>
                    </Col>
                </Row>
            </Modal>
        </>
    )
}