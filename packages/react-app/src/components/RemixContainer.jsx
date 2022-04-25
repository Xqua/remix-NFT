import React, { useState, useEffect, useContext } from "react";
import {Row, Col, Card, Collapse, Skeleton, Image, List, Button, Space, Divider} from "antd";
import { FileImageFilled, FileZipFilled, EditOutlined } from "@ant-design/icons";
import Blockies from "react-blockies";
import { RemixListItem, RemixActivity, BuyNFTButton, BuyRMXButton, RemixValueHeld } from ".";
import { RemixContext } from "../helpers"

export default function RemixContainer(props) {
    const [showCollectible, setShowCollectible]=useState(true);
    const [metadata, setMetadata] = useState({});

    const updateMetadata = () => {
        if (props.remix) {
            if (showCollectible) {
                setMetadata({...props.remix.CollectibleMetadata})
            } else {
                setMetadata({...props.remix.RMXMetadata})
            } 
        }
    }

    const [remixContext, setRemixContext] = useContext(RemixContext);
    //console.log(remixContext)
    useEffect(() => {
        updateMetadata();
        //console.log("Remix updated!", props.remix)
    }, [props.remix?.state])

    useEffect(() => { 
        updateMetadata();
    }, [showCollectible, props.remix?.state])
    
    const isLoading = () => {
        if (props.remix == null) return true;
        if (props.remix.RMXMetadata == null) return true;
        if (props.remix.RMXMetadata.image == null) return true;
        if (props.remix.RMXMetadata.name == null) return true;
        if (props.remix.RMXMetadata.description == null) return true;
        if (props.remix.CollectibleMetadata == null) return true;
        if (props.remix.CollectibleMetadata.image == null) return true;
        if (props.remix.CollectibleMetadata.name == null) return true;
        if (props.remix.CollectibleMetadata.description == null) return true;
        return false;
    }

    const { Panel } = Collapse;
    const { Meta } = Card;
    return (
        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            <Col className="gutter-row" span={12}>
                <Card
                    style={{ width: "100%" }}
                    cover={
                        isLoading() ? 
                        <Skeleton.Image loading={isLoading()} />
                        :
                        <Image
                        width={"100%"}
                        alt={metadata?.name}
                        src={metadata?.image}
                        />
                    }
                    actions={[
                        <FileImageFilled key="Collectible" onClick={()=>{setShowCollectible(true)}}/>,
                        <FileZipFilled key="RMX" onClick={() => { setShowCollectible(false) }}/>,
                    ]}
                    >
                    <Skeleton avatar active loading={metadata?.image == null}>
                        <Meta
                            avatar={<Blockies seed={props.remix?.author != null ? props.remix.authors[0].toLowerCase() : "seed"} />}
                            title={metadata?.name}
                            description={metadata?.description}
                            />
                    </Skeleton>
                </Card>
            </Col>
            <Col className="gutter-row" span={12}>
                <Collapse accordion>
                    <Panel header="About" key="about">
                        <p>Authors: {props.remix?.authors ? props.remix.authors.join(", ") : ""} </p>
                        <p>Address: {props.remix?.address ? props.remix.address : ""} </p>
                        <p>{props.remix?.isCollectibleAvailable ? 
                            "Current Collectible NFT price: " + <b>props.remix?.CollectiblePrice</b> + " Eth" :
                            "The collectible NFT was bought for: " + <b>props.remix?.CollectiblePrice</b> + " Eth"
                        }</p>
                        <p>The RMX token is available for: <b>{props.remix?.RMXPrice}</b> Eth</p>
                    </Panel>
                    {props.remix?.canDerive ? 
                        <Panel header="RAW Files" key="rawFiles">
                            <p>Access to the remixable files</p>
                            <Button type="primary" href={props.remix.RMXMetadata?.files}>Download</Button>
                        </Panel>
                        :
                        null
                    }
                    <Panel header="Parent creations" key="parents">
                        <List
                            itemLayout="horizontal"
                            dataSource={remixContext.remixContracts && props.remix?.parents ? props.remix.parents.map(address => (remixContext.remixContracts[address])) : []}
                            renderItem={item => (
                                <RemixListItem 
                                    remix={item} 
                                    CTA1={<BuyNFTButton remix={item} type="primary" />} 
                                    CTA2={<BuyRMXButton remix={item} type="primary" />} 
                                />
                            )}
                        />
                    </Panel>
                    <Panel header="Children creations" key="children">
                        <List
                            itemLayout="horizontal"
                            dataSource={remixContext.remixContracts && props.remix?.children ? props.remix.children.map(address => (remixContext.remixContracts[address])) : []}
                            renderItem={item => (
                                <RemixListItem 
                                    remix={item} 
                                    CTA1={<BuyNFTButton remix={item} type="primary" />} 
                                    CTA2={<BuyRMXButton remix={item} type="primary" />} 
                                />
                            )}
                        />
                    </Panel>
                    <Panel header="Price history" key="price">
                        <List
                            itemLayout="vertical"
                            dataSource={props.remix?.priceHistory}
                            renderItem={item => (`${item.token}: ${item.price}`)} />
                    </Panel>
                    <Panel header="Activity" key="activity">
                        <RemixActivity remix={props.remix} />
                    </Panel>
                    <Panel header="Remix and Usage Rights" key="rights">
                        
                    </Panel>
                </Collapse>
                <Divider />
                <Space>
                    <BuyNFTButton remix={props.remix} type="primary" /> 
                    <BuyRMXButton remix={props.remix} type="primary" />
                </Space>
                <Divider />
                <RemixValueHeld remix={props.remix}/>
            </Col>
        </Row>
    )
}