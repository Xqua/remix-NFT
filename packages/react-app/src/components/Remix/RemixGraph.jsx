import { Row, Col, Modal } from "antd";
import React, { useState, useEffect, useContext } from "react";
import { useRemixGraph } from "../../hooks";
import { Graph } from "react-d3-graph"; 
import { RemixContext } from "../../helpers";
import { RemixContainer } from ".";

const graphConfig = {
  "automaticRearrangeAfterDropNode": true,
  "collapsible": false,
  "directed": true,
  "focusAnimationDuration": 0.75,
  "focusZoom": 1,
  "freezeAllDragEvents": false,
  "height": 600,
  "highlightDegree": 1,
  "highlightOpacity": 1,
  "linkHighlightBehavior": false,
  "maxZoom": 8,
  "minZoom": 0.1,
  "nodeHighlightBehavior": true,
  "panAndZoom": true,
  "staticGraph": false,
  "staticGraphWithDragAndDrop": false,
  "width": 800,
  "d3": {
    "alphaTarget": 0.05,
    "gravity": -100,
    "linkLength": 100,
    "linkStrength": 1,
    "disableLinkForce": false
  },
  "node": {
    "color": "#d3d3d3",
    "fontColor": "black",
    "fontSize": 8,
    "fontWeight": "normal",
    "highlightColor": "SAME",
    "highlightFontSize": 8,
    "highlightFontWeight": "normal",
    "highlightStrokeColor": "SAME",
    "highlightStrokeWidth": "SAME",
    "labelProperty": "name",
    "labelPosition": "bottom",
    "mouseCursor": "pointer",
    "opacity": 1,
    "renderLabel": false,
    "strokeColor": "none",
    "strokeWidth": 1.5,
    "size":500,
    "svg": '',
    "symbolType": "circle"
  },
  "link": {
    "color": "#d3d3d3",
    "fontColor": "black",
    "fontSize": 8,
    "fontWeight": "normal",
    "highlightColor": "SAME",
    "highlightFontSize": 8,
    "highlightFontWeight": "normal",
    "labelProperty": "label",
    "mouseCursor": "pointer",
    "opacity": 1,
    "renderLabel": false,
    "semanticStrokeWidth": false,
    "strokeWidth": 1.5,
    "markerHeight": 6,
    "markerWidth": 6,
    "strokeDasharray": 0,
    "strokeDashoffset": 0,
    "strokeLinecap": "butt"
  }
}

export default function RemixGraph(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRemix, setSelectedRemix] = useState();
  const [remixContext, setRemixContext] = useContext(RemixContext)
  const [data, setData] = useState({});
  const graph = useRemixGraph(props.remixFactory);

  const onClickNode = function (nodeId) {
    console.log(`Clicked node ${nodeId}`, remixContext.remixContracts[nodeId]);
    setSelectedRemix(remixContext.remixContracts[nodeId]);
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
        //size: 200, // remixContext.remixContracts[node.id].RMXPrice ? Math.min(Math.max(remixContext.remixContracts[node.id].RMXPrice, 300), 600) : 300,
        color: "rgb(97, 205, 187)",
        svg: remixContext.remixContracts[node.id].CollectibleMetadata ? remixContext.remixContracts[node.id].CollectibleMetadata.image : ""
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
        <div style={{ height: 600 }}>
          <Graph
            id="graph-id" // id is mandatory
            data={data}
            config={graphConfig}
            onClickNode={onClickNode}
            onClickLink={onClickLink}
          />;
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
