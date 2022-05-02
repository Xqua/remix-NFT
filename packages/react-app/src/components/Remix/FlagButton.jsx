import { Button, notification } from "antd";
import React, { useState, useEffect, useContext } from "react";
import { RemixContext } from "../../helpers";
let path = require('ngraph.path');

export default function FlagButton(props) {
  const [remixContext, setRemixContext] = useContext(RemixContext)
  const [parentPath, setParentPath] = useState([]);
  const [isFlagged, setIsFlagged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onFlag = () => {
    setIsLoading(true);
    const path = parentPath.map((node) => (node.id));
    console.log("OnFlag", path);
    props.remix.flag(path).then(() => {
      setIsFlagged(true);
      setIsLoading(false);
    })
    .catch((err) => {
      setIsLoading(false);
      console.log(err.message)
      notification.error({
        message: err.message,
        placement: "bottomRight",
      })
    });
  }

  const onUnflag = () => {
    setIsLoading(true);
    const index = props.remix.flaggingParents.indexOf(parentPath[parentPath.length - 1].id)
    const path = parentPath.map((node) => (node.id));
    console.log("Unflag:", path, index)
    props.remix.unflag(path, index).then(()=>{
      setIsFlagged(false);
      setIsLoading(false);
    })
    .catch((err) => {
      setIsLoading(false);
      console.log(err.message)
      notification.error({
        message: err.message,
        placement: "bottomRight",
      })
    });
  }

  useEffect(() => {
    if (remixContext.myRemixContracts && props.remix) {
      setIsFlagged(false);
      remixContext.myRemixContracts.forEach((address) => {
        if (props.remix.flaggingParents.includes(address)) {
          setIsFlagged(true);
        }
      })
    }
  }, [props.remix, props.remix.state, remixContext.myRemixContracts])

  useEffect(() => {
    if (remixContext.myRemixContracts && remixContext.graph) {
      let pathFinder = path.aStar(remixContext.graph, {
        oriented: true
      });

      for (let i = 0; i < remixContext.myRemixContracts.length;i++) {
        const address = remixContext.myRemixContracts[i];
        let result = pathFinder.find(address, props.remix.address);
        console.log("------- Path:", result);
        if (props.remix.flaggingParents.includes(address)) {
          setParentPath(result);
          break;
        }
        if (result.length > 0) {
          if (parentPath.length === 0) {
            setParentPath(result)
          }
          if (result.length < parentPath.length) {
            setParentPath(result)
          }
        }
      }
    }
  }, [remixContext.graph, props.remix, props.remix.state, remixContext.myRemixContracts])

  if (parentPath.length <= 1) {
    return null
  }

  return (
    isFlagged ? 
      <Button type="danger" loading={isLoading} onClick={onUnflag}>Unflag</Button> 
    : 
      <Button type="danger" loading={isLoading} onClick={onFlag}>Flag</Button>
  );
}
