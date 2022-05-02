import React, { useState } from "react";
import { Button, Divider, Row, Col, Spin, Card, Upload, Image } from 'antd'
import { FileProtectOutlined, InboxOutlined, FileImageOutlined, FileZipFilled } from '@ant-design/icons';
import { IPFS_ENDPOINT, IPFS_SERVER_HOST, IPFS_SERVER_PORT, IPFS_SERVER_PROTOCOL } from "../constants";

const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({ host: IPFS_SERVER_HOST, port: IPFS_SERVER_PORT, protocol: IPFS_SERVER_PROTOCOL });
const ipfsHost = IPFS_ENDPOINT;

export default function UploadRemixFiles(props) {
    const [isUploading, setIsUploading] = useState();
    const [uploadSelection, setUploadSelection] = useState("collectible")
    const { Meta } = Card;
    const { Dragger } = Upload;

    const addToIPFS = async (fileInfo, fileToUpload) => {
        const { onSuccess, onError, file, onProgress } = fileInfo;

        const result = await ipfs.add(fileToUpload)
        onProgress({ percent: 100 });
        if (result && result.path) {
            if (fileInfo.filename == "collectibleMedia") {
                const c = { ...props.collectible };
                c.image = ipfsHost + result.path;
                props.setCollectible(c);
            }
            if (fileInfo.filename == "remixMedia") {
                const r = { ...props.remix };
                r.image = ipfsHost + result.path;
                props.setRemix(r);
            }
            if (fileInfo.filename == "remixFiles") {
                const r = { ...props.remix };
                r.files = ipfsHost + result.path;
                props.setRemix(r);
            }
            onSuccess("Ok!");
        } else {
            onError({ error: "File could not be uploaded to IPFS" })
        }
        setIsUploading(false);
    }

    const uploadToIPFS = (options) => {
        const { onError, file } = options;
        setIsUploading(true);

        const reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => {
            const buffer = Buffer(reader.result)
            const result = addToIPFS(options, buffer)
        }
        reader.onerror = onError;
    }

    if (props.collectible != null && props.remix != null) {
        return (
            <Card
                actions={[
                    <FileImageOutlined onClick={() => { setUploadSelection("collectible") }} />,
                    <FileZipFilled onClick={() => { setUploadSelection("remix") }} />,
                ]}
            >
                {uploadSelection == "collectible" ?
                    <>
                    <Row justify="center">
                        <Col>
                            <Meta
                                title={props.collectible.name ? props.collectible.name : "Your Collectible NFT"}
                                description={props.collectible.description ? props.collectible.description : "Upload its image or movie."}
                            />
                        </Col>
                    </Row>
                    <Divider />
                    <Row justify="center">
                        <Col span={24}>
                        {props.collectible.image ?
                                <>
                                    <Image width="100%" src={props.collectible.image} />
                                    <br/>
                                    <Button type="danger" onClick={() => { const c = { ...props.collectible }; c.image = null; props.setCollectible(c); }}>Remove</Button>
                                </>
                            :
                            <Dragger
                                name="collectibleMedia"
                                multiple={false}
                                maxCount={1}
                                customRequest={uploadToIPFS}
                            >
                                {isUploading ?
                                    <>
                                        <Spin/>
                                        <p>Uploading ...</p>
                                    </>
                                    :
                                    <>
                                        <p className="ant-upload-drag-icon">
                                            <InboxOutlined />
                                        </p>
                                        <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                        <p className="ant-upload-hint">
                                                    This is your collectible NFT artwork, upload an image, a video or some music.
                                        </p>
                                    </>
                                }
                            </Dragger>
                        }
                        </Col>
                    </Row> 
                    </>
                    :
                    <>
                        <Row justify="center">
                            <Col>
                                <Meta
                                    title={props.remix.name ? props.remix.name : "Your Remixable files"}
                                    description={props.remix.description ? props.remix.description : "Upload the preview and the files."}
                                />
                            </Col>
                        </Row>
                        <Divider/>
                        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} justify="space-between" >
                            <Col className="gutter-row" span={12}>
                                {props.remix.image ?
                                    <div>
                                        <Image width="100%" src={props.remix.image} />
                                        <Button type="danger" onClick={() => { const r = { ...props.remix }; r.image = null; props.setRemix(r); }}>Remove</Button>
                                    </div>
                                    : 
                                    <Dragger
                                        name="remixMedia"
                                        multiple={false}
                                        customRequest={uploadToIPFS}
                                    >
                                        {isUploading ?
                                            <>
                                                <Spin />
                                                <p>Uploading ...</p>
                                            </>
                                            :
                                            <>
                                                <p className="ant-upload-drag-icon">
                                                    <InboxOutlined />
                                                </p>
                                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                                <p className="ant-upload-hint">
                                                    This is your Remix preview, upload an image, a video.
                                                </p>
                                            </>
                                        }
                                    </Dragger>
                                }
                            </Col>
                            <Col className="gutter-row" span={12}>
                                {props.remix.files ?
                                <div>
                                    <FileProtectOutlined style={{width: "100%", height:"100%", fontSize:'72pt'}}/>
                                    <Button type="danger" onClick={() => { const r = { ...props.remix }; r.files = null; props.setRemix(r); }}>Remove</Button>
                                </div>
                                :
                                <Dragger
                                    name="remixFiles"
                                    multiple={false}
                                    customRequest={uploadToIPFS}
                                >
                                    {isUploading ?
                                        <>
                                            <Spin />
                                            <p>Uploading ...</p>
                                        </>
                                        :
                                        <>
                                            <p className="ant-upload-drag-icon">
                                                <InboxOutlined />
                                            </p>
                                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                            <p className="ant-upload-hint">
                                                Those are the RAW files for your remixable item, it could be a Blend file, SVG, or anything else that is remixable.
                                            </p>
                                        </>
                                    }
                                </Dragger>
                                }
                            </Col>
                        </Row>
                    </>
                }
            </Card>
        );
    } else { return null; }
}