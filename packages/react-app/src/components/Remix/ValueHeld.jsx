import React, {useState, useEffect } from "react";
import { List, Card, Statistic } from 'antd';
import { HarvestButton } from ".";


export default function ValueHeld(props) {
    const [valueHeld, setValueHeld] = useState();

    useEffect(() => {
        if (props.remix) {
            props.remix.valueHeld().then((result) => {
                setValueHeld(result);
            })
        }
    }, [props.remix, props.remix?.state])

    return (
        <List 
            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 4,
                lg: 4,
                xl: 6,
                xxl: 3,
            }}
            loading={valueHeld == null}
            dataSource={valueHeld}
            renderItem={(item) => (
                    <List.Item>
                        <Card 
                            bordered={false}
                            style={{minWidth:40}}
                            actions={[
                                <HarvestButton remix={props.remix} info={item}/>
                            ]}
                            >
                            <Statistic title={item.token} prefix={<img style={{width:30, height:30}} src={item.logo} />} value={item.value} />
                        </Card>
                    </List.Item>
            )
            }
        />
    )
}

{/* <List.Item key={remix.address}>
    <Skeleton avatar active paragraph={{ rows: 1 }} loading={isLoading()} >
        <List.Item.Meta
            onClick={() => { setSelectedRemix(remixContext.remixContracts[remix.address]); setIsModalVisible(true) }}
            avatar={<Avatar shape="square" size={64} src={remix?.RMXMetadata?.image} />}
            title={remix?.RMXMetadata?.name}
            description={remix?.RMXMetadata?.description}
        />
        <Space>
            {props.CTA1}
            {props.CTA2}
        </Space>
    </Skeleton>
    <Modal
        title={selectedRemix?.RMXMetadata?.name}
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={"90%"}
    >
        <RemixContainer remix={selectedRemix} />
    </Modal>
</List.Item> */}