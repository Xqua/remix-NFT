import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <PageHeader
      title="Remix NFT"
      subTitle="The creator's remixable NFT revolution!"
      style={{ cursor: "pointer" }}
    />
  );
}
