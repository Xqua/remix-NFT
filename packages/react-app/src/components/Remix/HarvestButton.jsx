import React, {useState, useEffect} from "react";
import {Button} from "antd";

export default function HarvestButton(props) {
    const [isHarvesting, setIsHarvesting] = useState(false);

    const onHarvest = () => {
        setIsHarvesting(true)
        props.remix.harvest(props.info.address)
    }

    useEffect(() => {
        if (isHarvesting) {
            if (props.info.value == 0) {
                setIsHarvesting(false)
            }
        }
    }, [props.remix.state, props.info.value])

    return (
        <Button onClick={onHarvest} loading={isHarvesting} disabled={isHarvesting || props.info.value == 0} type="primary">Harvest</Button>
    )
}