import React, { useEffect, useState } from "react";
import { Skeleton, Timeline } from "antd";
import { FullscreenOutlined, LogoutOutlined, DollarOutlined, PlusCircleOutlined, PieChartOutlined, FlagOutlined, ManOutlined, WomanOutlined, RightCircleOutlined } from "@ant-design/icons";

export default function Activity(props) {
    const [remix, setRemix] = useState(props.remix ? props.remix : {});
    const [timelineItems, setTimelineItems] = useState()

    const updateTimeline = () => {
        let newTimelineItems = remix.activity.map((activity, key) => {
            if (activity.event == "BadgeIssued") return <Timeline.Item key={key} dot={<LogoutOutlined />}> <p>Badge issued to:</p>  <p>{activity.args.dst}</p></Timeline.Item>
            if (activity.event == "CollectiblePurchased") return <Timeline.Item key={key} color="green" dot={<DollarOutlined />}> <p>Collectible purchased for {parseInt(activity.args.amount._hex, 16)} by:</p>  <p>{activity.args.buyer}</p></Timeline.Item>
            if (activity.event == "RMXPurchased") return <Timeline.Item key={key} color="yellow" dot={<DollarOutlined />}> <p>RMX pruchased for {parseInt(activity.args.amount._hex, 16)} by:</p> <p> {activity.args.buyer}</p></Timeline.Item>
            if (activity.event == "DerivativeIssued") return <Timeline.Item key={key} dot={<FullscreenOutlined />}> <p>New derivative created:</p> <p>{activity.args.dst}</p></Timeline.Item>
            if (activity.event == "Flagged") return <Timeline.Item key={key} color="red" dot={<FlagOutlined />}>Remix has been flagged by {activity.args.by}</Timeline.Item>
            if (activity.event == "UnFlagged") return <Timeline.Item key={key} color="green" dot={<FlagOutlined />}>Remix has been unflagged by {activity.args.by}</Timeline.Item>
            if (activity.event == "Mint") return <Timeline.Item key={key} dot={<PlusCircleOutlined />}> <p>Item minted {remix.getTokenName(parseInt(activity.args.tokenID._hex, 16))} to:</p> {activity.args.dst}</Timeline.Item>
            if (activity.event == "ParentAdded") return <Timeline.Item key={key} dot={<PieChartOutlined />}> <p>A new parent has been added!</p> <p> {activity.args.parent}</p></Timeline.Item>
            if (activity.event == "RoyaltiesHarvested") return <Timeline.Item key={key} dot={<ManOutlined />}> <p>Royalties harvested!</p></Timeline.Item>
            if (activity.event == "RoyaltyReceived") return <Timeline.Item key={key} dot={<WomanOutlined />}> <p>Royalty Received! Amount: {parseInt(activity.args.amount_hex, 16)}</p></Timeline.Item>
            if (activity.event == "TransferBatch") return <Timeline.Item key={key} dot={<RightCircleOutlined />}> <p>Batch transfert issued</p></Timeline.Item>
            if (activity.event == "TransferSingle") return <Timeline.Item key={key} dot={<RightCircleOutlined />}> <p>Transfert of token {remix.getTokenName(parseInt(activity.args.id._hex, 16))}</p> <p>from: {activity.args.from}</p> <p>to: {activity.args.to}</p></Timeline.Item>
        });
        //console.log("Updating Timeline Activity", newTimelineItems);
        setTimelineItems(newTimelineItems);
    }
    

    useEffect(() => {
        setRemix(props.remix)
        //console.log("Remix updated!", props.remix.activity)
        updateTimeline()
    }, [props.remix])

    useEffect(() => {
        updateTimeline();
    }, [remix.state])

    return (
        <Timeline>
            {timelineItems ? timelineItems : <Skeleton active />}
        </Timeline>
    )
}