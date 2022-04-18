import { Spin, Typography, Collapse, Button, Form, Input, InputNumber, List, Avatar, Row, Col, Divider } from "antd";
import { AddressInput } from ".";
import React, {useState, useEffect } from "react";
import { FileImageOutlined, SettingOutlined, EditOutlined, UserAddOutlined, UserDeleteOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useEventListener,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
} from "../hooks";
import { forEach } from "../contracts/contracts";
import { UploadRemixFiles } from "../components";


const { BufferList } = require('bl')
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({ host: 'ipfs.infura.io', port: '5001', protocol: 'https' });

const { ethers } = require("ethers");

function AddressField(props) {
  console.log("From AddressField:", props.author);
  const [address, setAddress] = useState(props.author.address);
  const [split, setSplit] = useState(props.author.split ? props.author.split : 0);

  useEffect(() => {
    props.author.address = address;
    props.onChange({...props.author})
  }, [address])
  
  useEffect(() => {
    props.author.split = split;
    props.onChange({...props.author})
  }, [split])

  return (
    <Row justify="space-between" align="middle"> 
    <Col span={12}>
      <Form.Item
        label="Author"
        name={"author" + props.author.key}
        labelCol={{span:8}}
        wrapperCol={{span:24}}
        rules={[{ required: true, message: 'Please input the address of the author!' }]}
      >
        <AddressInput
          //ensProvider={mainnetProvider} Will need to do this!
          value={props.author.address}
          onChange={setAddress}
        />
      </Form.Item>
      </Col>
      <Col span={10}>
      <Form.Item
        label="Split"
        name={"authorSplit" + props.author.key}
        rules={[{ required: true, message: 'Please give a split amount to this author!' }]}
      >
        <InputNumber 
          values={props.author.split}
          onChange={setSplit}/>
      </Form.Item>
    </Col>
    <Col span={2} >
      {props.author.key != 0 ? <Button icon={<UserDeleteOutlined />} onClick={() => { props.onDelete(props.author)}} /> : null }
    </Col>
    <Divider />
  </Row>
)}

function ParentSplitField(props) {
  const [split, setSplit] = useState(props.split)
  const parent = props.parent;
  useEffect(() => {
    parent.split = split;
    props.onChange(parent);
  }, [split])

  return (
    <Row >
      <Col span={12}>
        <Avatar src={parent.RMX_metadata.image} /> {parent.RMX_metadata.name}
      </Col>
      <Col span={10}>
        <Form.Item
          label="Split"
          name={"parent_" + parent.address}
          values={split}
          rules={[{ required: true, message: 'Please give a split amount to this author!' }]}
        >
          <InputNumber onChange={setSplit}/>
        </Form.Item>
      </Col>
      <Col span={2}>
        <Button icon={<DeleteOutlined />} onClick={() => {props.onDelete(parent)}} />
      </Col>
      <Divider />
    </Row>
  )
}

// @props.address: The address of the person logged in
export default function DeployRemix(props) {
  const [myRemixes, setMyRemixes] = useState(props.myRemixes);
  const [isDeploying, setIsDeploying] = useState();
  const [tokenURI, setTokenURI] = useState();
  const [parents, setParents] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [addressFields, setAddressFields] = useState([]);
  const [parentsSplitFields, setParentsSplitFields] = useState([]);
  const [collectible, setCollectible] = useState({});
  const [remix, setRemix] = useState({});

  const { Panel } = Collapse;
  const { Title } = Typography;
  const { TextArea } = Input;

  

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
    setMyRemixes(props.myRemixes)
  }, [props.myRemixes])

  const buildArgs = (values, uri) => {
    const args = []
    args.push(uri)
    args.push(authors.map((author) => (author.address)))
    args.push(authors.map((author) => (author.split * 100)))
    args.push(parents.map((parent) => (parent.address)))
    args.push(parents.map((parent) => (parent.split * 100)))
    args.push(values.RMXprice)
    args.push(values.RMXincrease)
    args.push(values.NFTprice)
    args.push(10000)
    args.push(1000)
    return args;
  }

  const isInParents = (address) => {
    let exists = false; 
    parents.forEach((parent) => {
      if (parent.address == address) {
        exists = true;
      }
    })
    return exists;
  }

  const deploy = async (values) => {
    let files = []
    files.push({
      path: "metadata/0.json",
      content: JSON.stringify(remix),
    })
    files.push({
      path: "metadata/1.json",
      content: JSON.stringify(collectible),
    })

    let cid;
    for await (const result of ipfs.addAll(files)) {
      if (result.path == "metadata") {
        cid = result.cid;
      }
      console.log("IPFS upload:", result)
    }
    //const result = await ipfs.add(files); // addToIPFS(JSON.stringify(yourJSON))
    const uri = "https://ipfs.io/ipfs/" + cid.toString() + "/{id}.json"
    const args = buildArgs(values, uri);
    console.log("Arguments:", args);
    const remixArtifact = require("../contracts/Remix.json");
    const deployer = new ethers.ContractFactory(remixArtifact.abi, remixArtifact.bytecode, props.signer)
    const result = await deployer.deploy(...args);
    console.log("Deploy results: ", result)
    const registerResult = await props.writeContracts["RemixRegistry"].registerRemix(args[1], result.address)
    console.log("Registered Contract: ", registerResult);
    setIsDeploying(false);
  }

  const onFinish = (values) => {
    setIsDeploying(true);
    console.log('Success:', values);
    deploy(values);
    // make jsons for nft and rmx
    // set args
    // deploy

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
      >
      <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} justify="space-between">
        <Col className="gutter-row" span={8}>
          <Title level={2}>
            Available Remixes
          </Title>
          <List
            itemLayout="horizontal"
            dataSource={Object.keys(myRemixes).map((address) => (myRemixes[address]))}
            renderItem={item => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  avatar={<Avatar src={item.RMX_metadata.image} />}
                  title={item.RMX_metadata.name}
                  description={item.RMX_metadata.description}
                />
                {isInParents(item.address) ? null : <Button type="primary" onClick={() => {item.split = 0; parents.push(item); updateParents(parents)}}>Use</Button>}
              </List.Item>
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
                values={collectible.name}
                rules={[{ required: true, message: 'Please give this artwork a name!' }]}
              >
                <Input onChange={(e) => { const c = {...collectible}; c.name = e.target.value; setCollectible(c)}}/>
              </Form.Item>
              <Form.Item
                label="Description"
                name="collectibleDescription"
                rules={[{ required: true, message: 'Please describe this artwork!' }]}
              >
                <TextArea rows={4} onChange={(e) => { const c = {...collectible}; c.description = e.target.value; setCollectible(c) }}/>
              </Form.Item>
            </Panel>
            <Panel forceRender={true} header="Remix" key="2">
              <Form.Item
                label="Name"
                name="remixName"
                rules={[{ required: true, message: 'Please give this remix NFT a name!' }]}
              >
                <Input onChange={(e) => { const r = {...remix}; r.name = e.target.value; setRemix(r) }}/>
              </Form.Item>
              <Form.Item
                label="Description"
                name="remixDescription"
                rules={[{ required: true, message: 'Please describe this remix NFT!' }]}
              >
                <TextArea rows={4} onChange={(e) => { const r = {...remix}; r.description = e.target.value; setRemix(r) }}/>
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
            collectible={collectible}
            setCollectible={setCollectible}
            remix={remix} 
            setRemix={setRemix}
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
