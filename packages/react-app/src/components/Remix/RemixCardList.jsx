import { List } from "antd";
import React, { useState, useEffect } from "react";
import { RemixCard } from ".";

const PAGE_SIZE = 8;

export default function RemixCardList(props) {
  const [remixContracts, setRemixContracts] = useState([])

  useEffect(() => {
    let contracts = []
    Object.keys(props.remixContracts).forEach((address) => {
      if (props.remixContracts[address]) {
        contracts.push(props.remixContracts[address])
      }
    })
    setRemixContracts(contracts);
  }, [props.remixContracts])

  return (
    <List
      grid={{
        gutter: 16,
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
        xxl: 4,
      }}
      dataSource={remixContracts}
      pagination={{
        onChange: page => {
          console.log(page);
        },
        pageSize: PAGE_SIZE,
      }}
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
