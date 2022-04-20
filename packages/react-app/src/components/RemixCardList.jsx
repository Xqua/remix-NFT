import { List } from "antd";
import React, { useState, useEffect } from "react";
import { Route } from "react-router-dom";
import { RemixCard } from ".";

export default function RemixCardList(props) {
  const [remixContracts, setRemixContracts] = useState(props.remixContracts);

  useEffect(() => {
    if (props.showOnlyMyContracts) {
      const myRemix = Object.keys(remixContracts)
        .map((remix) => (remixContracts[remix]))
        .filter((remix) => (remix.isAuthor)) 
      setRemixContracts(myRemix)
    } else {
      setRemixContracts(props.remixContracts)
    }
  }, [props.remixContracts])

  return (
    <List
      grid={{ gutter: 20, column: 4 }}
      dataSource={Object.keys(remixContracts).map((address) => (remixContracts[address]))}
      renderItem={item => {
        const id = item.id;
        return (
          <List.Item key={id}>
            <RemixCard
              remix={item}
              onDebug={(address) => {
                props.setSelectedContract(address);
                props.setRoute("/debugcontracts");
              }} />
          </List.Item>
        );
      }} />
  );
}
