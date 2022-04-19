import React, { useState, useEffect, useContext } from "react";
import {Row, Col, Card, Collapse, Skeleton, Image, List, Button, Divider} from "antd";
import { FileImageFilled, FileZipFilled, EditOutlined } from "@ant-design/icons";
import Blockies from "react-blockies";
import { RemixListItem, RemixActivity } from ".";
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
        <Row >
            <Col offset={2} span={9}>
                <Card
                    style={{ width: 500 }}
                    cover={
                        isLoading() ? 
                            <Skeleton.Image loading={isLoading()} />
                        :
                        <Image
                            width={500}
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
            <Col offset={1} span={9}>
                <Collapse accordion>
                    <Panel header="About" key="about">
                        
                    </Panel>
                    <Panel header="Parent creations" key="parents">
                        <List
                            itemLayout="horizontal"
                            dataSource={remix.parents ? remix.parents.map(address => (remixContext[address])) : []}
                            renderItem={item => (
                                <RemixListItem remix={item} CTA1={item.isCollectibleAvailable ? <Button type="primary">Buy NFT</Button> : null} CTA2={<Button type="primary">Buy RMX</Button>} />
                            )}
                        />
                    </Panel>
                    <Panel header="Children creations" key="children">
                        <List
                            itemLayout="horizontal"
                            dataSource={remix? remix.children.map(address => (remixContext[address])) : []}
                            renderItem={item => (
                                <RemixListItem remix={item} CTA1={<Button type="primary">Buy NFT</Button>} CTA2={<Button type="primary">Buy RMX</Button>} />
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
            </Col>
        </Row>
    )
}