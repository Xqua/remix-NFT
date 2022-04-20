import React, { useState, useEffect, useContext } from "react";
import {Row, Col, Card, Collapse, Skeleton, Image, List, Button, Space, Divider} from "antd";
import { FileImageFilled, FileZipFilled, EditOutlined } from "@ant-design/icons";
import Blockies from "react-blockies";
import { RemixListItem, RemixActivity, BuyNFTButton, BuyRMXButton } from ".";
import { RemixContext } from "../helpers"

export default function RemixContainer(props) {
    const [remix, setRemix] = useState(props.remix);
    const [showCollectible, setShowCollectible]=useState(true);
    const [metadata, setMetadata] = useState({});

    const updateMetadata = () => {
        if (showCollectible) {
            setMetadata({...remix.CollectibleMetadata})
        } else {
            setMetadata({...remix.RMXMetadata})
        } 
    }

    const [remixContext, setRemixContext] = useContext(RemixContext);

    useEffect(() => {
        setRemix(props.remix)
    }, [props.remix])

    useEffect(() => {
        updateMetadata();
        console.log("Remix updated!", remix)
    }, [remix.state])

    useEffect(() => { 
        updateMetadata();
    }, [showCollectible, remix.state])
    
    const isLoading = () => {
        if (remix == null) return true;
        if (remix.RMXMetadata == null) return true;
        if (remix.RMXMetadata.image == null) return true;
        if (remix.RMXMetadata.name == null) return true;
        if (remix.RMXMetadata.description == null) return true;
        if (remix.CollectibleMetadata == null) return true;
        if (remix.CollectibleMetadata.image == null) return true;
        if (remix.CollectibleMetadata.name == null) return true;
        if (remix.CollectibleMetadata.description == null) return true;
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
                            avatar={<Blockies seed={remix.author != null ? remix.authors[0].toLowerCase() : "seed"} />}
                            title={metadata?.name}
                            description={metadata?.description}
                            />
                    </Skeleton>
                </Card>
            </Col>
            <Col className="gutter-row" span={12}>
                <Collapse accordion>
                    <Panel header="About" key="about">
                        <p>Authors: {remix.authors ? remix.authors.join(", ") : ""} </p>
                        <p>{remix.isCollectibleAvailable ? 
                            "Current Collectible NFT price: " + <b>remix.CollectiblePrice</b> + " Eth" :
                            "The collectible NFT was bought for: " + <b>remix.CollectiblePrice</b> + " Eth"
                        }</p>
                        <p>The RMX token is available for: <b>{remix.RMXPrice}</b> Eth</p>
                    </Panel>
                    {remix.canDerive ? 
                        <Panel header="RAW Files" key="rawFiles">
                            <p>Access to the remixable files</p>
                            <Button type="primary" href={remix.RMXMetadata.files}>Download</Button>
                        </Panel>
                        :
                        null
                    }
                    <Panel header="Parent creations" key="parents">
                        <List
                            itemLayout="horizontal"
                            dataSource={remixContext.remixContracts && remix.parents ? remix.parents.map(address => (remixContext.remixContracts[address])) : []}
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
                            dataSource={remixContext.remixContracts && remix.children ? remix.children.map(address => (remixContext.remixContracts[address])) : []}
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
                            dataSource={remix?.priceHistory}
                            renderItem={item => (item + " | ")} />
                    </Panel>
                    <Panel header="Activity" key="activity">
                        <RemixActivity remix={remix} />
                    </Panel>
                    <Panel header="Remix and Usage Rights" key="rights">
                        
                    </Panel>
                </Collapse>
                <Divider />
                <Space>
                    <BuyNFTButton remix={remix} type="primary" /> 
                    <BuyRMXButton remix={remix} type="primary" />
                </Space>
            </Col>
        </Row>
    )
}