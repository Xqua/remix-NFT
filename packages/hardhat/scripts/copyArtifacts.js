const fs = require('fs');

fs.copyFile("artifacts/contracts/Remix.sol/Remix.json", "../react-app/src/contracts/Remix.json", 
            (err) => {
              if (err) throw err;
              console.log("Copied Remix.sol artifact to react App")
            })
fs.copyFile("artifacts/contracts/RemixFactory.sol/RemixFactory.json", "../react-app/src/contracts/RemixFactory.json",
  (err) => {
    if (err) throw err;
    console.log("Copied RemixFactory.sol artifact to react App")
  })