import { notification, Spin, Modal, Typography, Collapse, Button, Form, Input, InputNumber, List, Avatar, Row, Col, Divider, Result } from "antd";
import React, {useState, useEffect } from "react";
import { FileImageOutlined, SettingOutlined, EditOutlined, UserAddOutlined, UserDeleteOutlined, DeleteOutlined } from '@ant-design/icons';
import { UploadRemixFiles, ParentSplitField, AddressField, RemixListItem } from ".";
import { Remix } from "../helpers";
import { useHistory } from "react-router-dom";

const { BufferList } = require('bl')
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });

const { ethers, utils } = require("ethers");



// @props.address: The address of the person logged in
export default function RemixDeploy(props) {
  const [remixContracts, setRemixContracts] = useState(props.remixContracts);
  const [remixFactory, setRemixFactory] = useState(props.remixFactory)
  const [signer, setSigner] = useState(props.signer)
  const [isDeploying, setIsDeploying] = useState();
  const [parents, setParents] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [addressFields, setAddressFields] = useState([]);
  const [parentsSplitFields, setParentsSplitFields] = useState([]);
  const [collectibleMetadata, setCollectibleMetadata] = useState({});
  const [remixMetadata, setRemixMetadata] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [address, setAddress] = useState(props.signer ? props.signer.address : "")
  const [splitSum, setSplitSum] = useState(0);
  let history = useHistory();

  const { Panel } = Collapse;
  const { Title } = Typography;
  const { TextArea } = Input;

  useEffect(() => { setSigner(props.signer) }, [props.signer])
  useEffect(() => { setRemixFactory(props.remixFactory) }, [props.remixFactory])
  useEffect(() => { setAddress(props.signer ? props.signer.address : "")}, [props.signer])

  const updateAuthors = (authors) => {
    const newAuthors = authors.map((author, key) => {author.key = key; return author});
    setAuthors(newAuthors);
  }

  const updateParents = (parents) => {
    const newParents = parents.map((parent, key) => { parent.key = key; return parent });
    setParents(newParents);
  }

  const makeAuthorsFields = () => {
    let newAddressFields = authors.map((author) => (
      <AddressField
        key={author.key}
        author={author}
        onDelete={(author) => { authors.splice(author.key); updateAuthors(authors); }}
        onChange={(author) => { authors[author.key] = author; setAuthors(authors); updateSplitSum(); }}
      />
      )
    )
    console.log("addressFields:", newAddressFields);
    setAddressFields(newAddressFields)
  }

  const makeParentsSplitFields = () => {
    let newParentSplitFields = parents.map((parent) => (
      <ParentSplitField 
        parent={parent}
        onDelete={(parent) => {parents.splice(parent.key); updateParents(parents)}}
        onChange={(parent) => {parents[parent.key] = parent; setParents(parents); updateSplitSum();}}
      />
    ))
    setParentsSplitFields(newParentSplitFields);
  }
 
  useEffect(() => {
    console.log("Address is ", props.address);
    if (props.address) {
      authors.push({
        address: props.address,
        split: 100
      });
    }
    updateAuthors(authors);
  }, [props.address])

  useEffect(() => {
    makeParentsSplitFields();
    updateSplitSum();
  }, [parents])

  useEffect(() => {
    makeAuthorsFields();
    updateSplitSum();
  }, [authors])

  useEffect(() => {
    setRemixContracts(props.remixContracts)
  }, [props.remixContracts])

  const isInParents = (address) => {
    let exists = false; 
    parents.forEach((parent) => {
      if (parent.address == address) {
        exists = true;
      }
    })
    return exists;
  }

  const updateSplitSum = () => {
    let sumSplit = 0;
    authors.forEach((author) => { sumSplit += author.split })
    parents.forEach((parent) => { sumSplit += parent.split })
    console.log("Updated sum:", sumSplit)
    setSplitSum(sumSplit);
    return sumSplit;
  }

 
  const isSplitValid = ({ getFieldValue }) => ({
    validator(_, value) {
      const sumsplit = updateSplitSum();
      console.log("Split sum is: ", sumsplit)
      if (sumsplit == 100) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('The total of splits is not 100%!'));
    },
  })

  const onFinish = (values) => {
    setIsDeploying(true);
    console.log('Success:', values);
    const remix = new Remix(null, signer);
    remix.signer = signer;
    remix.authors = authors.map((author) => (author.address));
    remix.authorsSplits = authors.map((author) => (author.split * 100))
    remix.parents = parents.map((parent) => (parent.address))
    remix.parentsSplits = parents.map((parent) => (parent.split * 100))
    remix.RMXPrice = values.RMXprice
    remix.RMXincrease = values.RMXincrease * 100
    remix.NFTprice = values.NFTprice
    remix.maxRMXTime = 10000
    remix.RMXMetadata = remixMetadata
    remix.CollectibleMetadata = collectibleMetadata
    remix.royalty = 1000

    console.log("Uploading Metadata")
    // Uploading Metadata
    remix.uploadMetadata().then((hash, uri) => {
      notification.info({
        message: "Metadata uploaded! IPFS hash is: " + hash + " | URI is " + uri,
        placement: "bottomRight",
      });
      // Deploying Remix contract
      console.log("About to deploy with Factory:", remixFactory);
      remixFactory.deploy(remix).then((contract) => {
        notification.info({
          message: "Remix contract deployed! Address is:" + contract.address,
          placement: "bottomRight",
        });
        setIsDeploying(false);
        setIsModalVisible(true);
      }).catch((error) => {
        setIsDeploying(false);
        console.log(error)
        notification.error({
          message: error.message,
          placement: "bottomRight",
        });
      })
    }).catch((error) => {
      setIsDeploying(false);
      console.log(error)
      notification.error({
        message: error.message,
        placement: "bottomRight",
      });
    })
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
      <Form
        name="DeployContract"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        layout="vertical"
        initialValues={{
          "author0": address,
          "authorSplit0": 100,
          "RMXprice":0.1,
          "RMXincrease":5,
          "NFTprice":0.1
        }}
      >
      <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} justify="space-between">
        <Col className="gutter-row" span={8}>
          <Title level={2}>
            Available Remixes
          </Title>
          <List
            itemLayout="horizontal"
            dataSource={remixContracts}
            renderItem={item => (
              <RemixListItem remix={item} CTA1={isInParents(item.address) ? null : <Button type="primary" onClick={() => {item.split = 0; parents.push(item); updateParents(parents)}}>Use</Button>} />
            )}
          />
        </Col>
        <Col className="gutter-row" span={8}>
          <Title level={2}>
            Set parameters
          </Title>
          <Collapse accordion>
            <Panel forceRender={true} header="Collectible" key="1">
              <Form.Item
                label="Name"
                name="collectibleName"
                labelCol={{ span: 12 }}
                rules={[{ required: true, message: 'Please give this artwork a name!' }]}
              >
                <Input placeholder="My collectible title" onChange={(e) => { const c = {...collectibleMetadata}; c.name = e.target.value; setCollectibleMetadata(c)}}/>
              </Form.Item>
              <Form.Item
                label="Description"
                name="collectibleDescription"
                labelCol={{ span: 12 }}
                rules={[{ required: true, message: 'Please describe this artwork!' }]}
              >
                <TextArea placeholder="A really catchy description" rows={4} onChange={(e) => { const c = {...collectibleMetadata}; c.description = e.target.value; setCollectibleMetadata(c) }}/>
              </Form.Item>
            </Panel>
            <Panel forceRender={true} header="Remix" key="2">
              <Form.Item
                label="Name"
                name="remixName"
                labelCol={{ span: 12 }}
                rules={[{ required: true, message: 'Please give this remix NFT a name!' }]}
              >
                <Input placeholder="My RMX title" onChange={(e) => { const r = {...remixMetadata}; r.name = e.target.value; setRemixMetadata(r) }}/>
              </Form.Item>
              <Form.Item
                label="Description"
                name="remixDescription"
                labelCol={{ span: 12 }}
                rules={[{ required: true, message: 'Please describe this remix NFT!' }]}
              >
                <TextArea placeholder="A detailed description of what is included and how to use it." rows={4} onChange={(e) => { const r = {...remixMetadata}; r.description = e.target.value; setRemixMetadata(r) }}/>
              </Form.Item>
            </Panel>
            <Panel forceRender={true} header="Authors" key="3">
              {addressFields}
              <Row>
                <Col span={24}>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    size="large"
                    onClick={() => {authors.push({address: "", split:0}); updateAuthors(authors)}}
                  />
                </Col>
              </Row>
            </Panel>
            <Panel forceRender={true} header="Parents" key="4">
              {parentsSplitFields.length > 0 ? parentsSplitFields : <b>No parents declared!</b>}
            </Panel>
            <Panel forceRender={true} header="Prices" key="5">
              <Form.Item 
              label="RMX price"
              name="RMXprice"
              labelCol={{ span: 12, offset: 0 }}
              rules={([ {required: true, message: 'Please set a base price for the RMX'}])}
              >
                <InputNumber />
              </Form.Item>
              <Form.Item
                label="RMX increase curve"
                name="RMXincrease"
                labelCol={{ span: 12, offset: 0 }}
                rules={([{ required: true, message: 'Please set a base price for the RMX increase minima' }])}
              >
                <InputNumber 
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  placeholder={5} />
              </Form.Item>
              <Form.Item
                label="NFT price"
                name="NFTprice"
                labelCol={{ span: 12, offset: 0 }}
                rules={([{ required: true, message: 'Please set a base price for the NFT' }])}
              >
                <InputNumber />
              </Form.Item>
            </Panel>
            <Panel forceRender={true} header="Licencing" key="6">
              <b> To be defined !</b>
            </Panel>
          </Collapse>
        </Col>
        <Col className="gutter-row" span={8}>
          <Title level={2}>
            Upload files
          </Title>
          <UploadRemixFiles
            name="UploadBox"
            collectible={collectibleMetadata}
            setCollectible={setCollectibleMetadata}
            remix={remixMetadata} 
            setRemix={setRemixMetadata}
          />
        </Col>
      </Row>
      <Divider />
      <Row justify="center">
        <Col>
          <Form.Item wrapperCol={{ span: 16 }}>
            {isDeploying ? 
              <Button>
                <Spin />Deploying<Spin />
              </Button>
            :
              props.signer ? 
                <Button type="primary" htmlType="submit">
                  Mint Remix
                </Button>
                :
                <Button type="disabled">
                  Not logged in!
                </Button>
            }  
          </Form.Item>
        </Col>
      </Row>
      <Modal
        forceRender={true}
        title="Congratulation"
        visible={isModalVisible}
        footer={null}
        onCancel={() => { setIsModalVisible(false); history.push("/mine") }}
        onOk={() => { setIsModalVisible(false); history.push("/mine") }}
      >
        <Result
          status="success"
          title="You just minted a Remix NFT!"
          subTitle="Congratulation on creating a new Remix, keep up with the creative flow!"
        />
      </Modal>
    </Form>
  );
}
