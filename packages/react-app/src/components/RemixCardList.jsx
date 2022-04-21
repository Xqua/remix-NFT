import { List } from "antd";
import React, { useState, useEffect } from "react";
import { Route } from "react-router-dom";
import { RemixCard } from ".";

export default function RemixCardList(props) {
  return (
    <List
      grid={{ gutter: 20, column: 4 }}
      dataSource={Object.keys(props.remixContracts).map((address) => (props.remixContracts[address]))}
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
