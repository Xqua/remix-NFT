import { notification, Spin, Typography, Collapse, Button, Form, Input, InputNumber, List, Avatar, Row, Col, Divider } from "antd";
import React, {useState, useEffect } from "react";
import { FileImageOutlined, SettingOutlined, EditOutlined, UserAddOutlined, UserDeleteOutlined, DeleteOutlined } from '@ant-design/icons';
import { UploadRemixFiles, ParentSplitField, AddressField, RemixListItem } from ".";
import { Remix } from "../helpers";

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
  const [address, setAddress] = useState(props.signer ? props.signer.address : "")

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
        splitRule={isSplitValid}
        onDelete={(author) => { authors.splice(author.key); updateAuthors(authors); }}
        onChange={(author) => { authors[author.key] = author; setAuthors(authors); }}
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
        splitRule={isSplitValid}
        onDelete={(parent) => {parents.splice(parent.key); updateParents(parents)}}
        onChange={(parent) => {parents[parent.key] = parent; setParents(parents); }}
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
    // Want to check that the parent splits is < 100 
    let sumSplit = 0;
    parents.forEach((parent, i) => { sumSplit += parent.split })
    if (sumSplit <= 100) {
      console.error("Sum of parents splits is more than 100!");
    }
    makeParentsSplitFields();
  }, [parents])

  useEffect(() => {
    let sumSplit = 0;
    authors.forEach((author, i) => {sumSplit+=author.split})
    if (sumSplit != 100) {
      console.error("Sum of authors splits is not 100!");
    }
    makeAuthorsFields();
    // Want to check that the sum of author split is < 100
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
  
  const isSplitValid = ({ getFieldValue }) => ({
    validator(_, value) {
      let sumSplit = 0;
      authors.forEach((author) => { sumSplit += author.split })
      parents.forEach((parent) => { sumSplit += parent.split })
      if (sumSplit == 100) {
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
    remix.RMXincrease = values.RMXincrease
    remix.NFTprice = values.NFTprice
    remix.maxRMXTime = 10000
    remix.RMXMetadata = remixMetadata
    remix.CollectibleMetadata = collectibleMetadata
    remix.royalty = 1000

    console.log("About to deploy:", remix, remix.deployArgs);
    // Uploading Metadata
    remix.uploadMetadata().then((hash, uri) => {
      notification.info({
        message: "Metadata uploaded! IPFS hash is: " + hash + " | URI is " + uri,
        placement: "bottomRight",
      });
      // Deploying Remix contract
      remix.deploy().then((contract) => {
        notification.info({
          message: "Remix contract deployed! Address is:" + contract.address,
          placement: "bottomRight",
        });
        // Registering Remix contract
        remix.registerContract(remixFactory).then(() => {
          notification.info({
            message: "Contract is registered with this website!",
            placement: "bottomRight",
          });
          setIsDeploying(false);
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
          "authorSplit0": 100
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
                values={collectibleMetadata.name}
                rules={[{ required: true, message: 'Please give this artwork a name!' }]}
              >
                <Input onChange={(e) => { const c = {...collectibleMetadata}; c.name = e.target.value; setCollectibleMetadata(c)}}/>
              </Form.Item>
              <Form.Item
                label="Description"
                name="collectibleDescription"
                rules={[{ required: true, message: 'Please describe this artwork!' }]}
              >
                <TextArea rows={4} onChange={(e) => { const c = {...collectibleMetadata}; c.description = e.target.value; setCollectibleMetadata(c) }}/>
              </Form.Item>
            </Panel>
            <Panel forceRender={true} header="Remix" key="2">
              <Form.Item
                label="Name"
                name="remixName"
                rules={[{ required: true, message: 'Please give this remix NFT a name!' }]}
              >
                <Input onChange={(e) => { const r = {...remixMetadata}; r.name = e.target.value; setRemixMetadata(r) }}/>
              </Form.Item>
              <Form.Item
                label="Description"
                name="remixDescription"
                rules={[{ required: true, message: 'Please describe this remix NFT!' }]}
              >
                <TextArea rows={4} onChange={(e) => { const r = {...remixMetadata}; r.description = e.target.value; setRemixMetadata(r) }}/>
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
              rules={([ {required: true, message: 'Please set a base price for the RMX'}])}
              >
                <InputNumber />
              </Form.Item>
              <Form.Item
                label="RMX increase minima"
                name="RMXincrease"
                rules={([{ required: true, message: 'Please set a base price for the RMX increase minima' }])}
              >
                <InputNumber />
              </Form.Item>
              <Form.Item
                label="NFT price"
                name="NFTprice"
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
    </Form>
  );
}
