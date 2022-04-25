import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button, Divider, InputNumber } from "antd";
import { AddressInput } from ".";
import { UserDeleteOutlined } from "@ant-design/icons";

export default function AddressField(props) {
    console.log("From AddressField:", props.author);

    return (
        <Row justify="space-between" align="middle">
            <Col span={12}>
                <Form.Item
                    label="Author"
                    name={"author" + props.author.key}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 24 }}
                    rules={[{ required: true, message: 'Please input the address of the author!' }]}
                >
                    <AddressInput
                        //ensProvider={mainnetProvider} Will need to do this!
                        value={props.author.address}
                        onChange={(address) => {
                            props.author.address = address;
                            props.onChange({ ...props.author })
                        }}
                    />
                </Form.Item>
            </Col>
            <Col span={10}>
                <Form.Item
                    label="Split"
                    name={"authorSplit" + props.author.key}
                    labelCol={{ span: 12 }}
                    rules={[{ required: true, message: 'Please give a split amount to this author!' }]}
                >
                    <InputNumber
                        values={props.author.split}
                        onChange={(split) => {
                            props.author.split = split;
                            props.onChange({ ...props.author })
                        }} />
                </Form.Item>
            </Col>
            <Col span={2} >
                {props.author.key != 0 ? <Button icon={<UserDeleteOutlined />} onClick={() => { props.onDelete(props.author) }} /> : null}
            </Col>
            <Divider />
        </Row>
    )
}