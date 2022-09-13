import { Row, Col, Modal } from "antd";
import React, { useState, useEffect, useContext, useRef } from "react";
import { useRemixGraph } from "../../hooks";
import ForceGraph3D from 'react-force-graph-3d';
//import { Graph } from "react-d3-graph"; 
import * as THREE from 'three'; 
import { RemixContext } from "../../helpers";
import { RemixContainer } from ".";


export default function RemixGraph(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRemix, setSelectedRemix] = useState();
  const [remixContext, setRemixContext] = useContext(RemixContext)
  const [data, setData] = useState({nodes: [], links: []});
  const graph = useRemixGraph(props.remixFactory);
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setHeight(ref.current.offsetHeight);
    setWidth(ref.current.offsetWidth);

    // 👇️ if you need access to parent
    // of the element on which you set the ref
    console.log(ref.current.parentElement);
    console.log(ref.current.parentElement.offsetHeight);
    console.log(ref.current.parentElement.offsetWidth);
  }, []);

  const onClickNode = function (node) {
    console.log(`Clicked node ${node.id}`, remixContext.remixContracts[node.id]);
    setSelectedRemix(remixContext.remixContracts[node.id]);
    setIsModalVisible(true);
  };

  const onClickLink = function (source, target) {
    console.log(`Clicked link between ${source} and ${target}`);
  };

  useEffect(() => {
    const newData = {nodes: [], links:[]};
    console.log("RemixContext:", remixContext);
    graph.forEachNode((node) => {
      console.log("Looking for: ", node.id);
      newData.nodes.push({
        id: node.id,
        name: remixContext.remixContracts[node.id].CollectibleMetadata ? remixContext.remixContracts[node.id].CollectibleMetadata.name : node.id,
        size: 50,
        color: "rgb(97, 205, 187)",
        image: remixContext.remixContracts[node.id].CollectibleMetadata ? remixContext.remixContracts[node.id].CollectibleMetadata.image : ""
      })
    })
    graph.forEachLink((link) => {
      console.log("Adding Link:", link);
      newData.links.push({
        source: link.fromId,
        target: link.toId,
        })
    })
    console.log("New data:", newData)
    setData(newData);
  }, [graph])

  return (
    <Row>
      <Col span={24}>
        <div ref={ref} style={{ height: 600 }}>
          <ForceGraph3D
            graphData={data}
            height={height}
            width={width}
            backgroundColor="#212121"
            nodeThreeObject={({ image }) => {
              const imgTexture = new THREE.TextureLoader().load(image);
              const material = new THREE.SpriteMaterial({ map: imgTexture });
              const sprite = new THREE.Sprite(material);
              sprite.scale.set(12, 12);
              return sprite;
            }}
            onNodeClick={onClickNode}
          />
        </div>
      </Col>
      <Modal
        title={selectedRemix?.CollectibleMetadata?.name}
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={"90%"}
      >
        <RemixContainer remix={selectedRemix} />
      </Modal>
    </Row>
  );
}
