import React, { useState, useEffect } from "react";
import { Row, Col, Avatar, Form, Button, Divider, InputNumber } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

export default function ParentSplitField(props) {
    const [split, setSplit] = useState(props.split)
    const parent = props.parent;
    useEffect(() => {
        parent.split = split;
        props.onChange(parent);
    }, [split])

    return (
        <Row >
            <Col span={12}>
                <Avatar src={parent.RMXMetadata.image} /> {parent.RMXMetadata.name}
            </Col>
            <Col span={10}>
                <Form.Item
                    label="Split"
                    name={"parent_" + parent.address}
                    values={split}
                    rules={[{ required: true, message: 'Please give a split amount to this author!' }, props.splitRule]}
                >
                    <InputNumber onChange={setSplit} />
                </Form.Item>
            </Col>
            <Col span={2}>
                <Button icon={<DeleteOutlined />} onClick={() => { props.onDelete(parent) }} />
            </Col>
            <Divider />
        </Row>
    )
}