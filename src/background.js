import { assert } from "@polkadot/util";
import { PORT_CONTENT, PORT_EXTENSION } from "metadot-extension-base/defaults";
import { chrome } from "@polkadot/extension-inject/chrome";

chrome.runtime.onConnect.addListener((port) => {
  assert(
    [PORT_CONTENT, PORT_EXTENSION].includes(port.name),
    `Unknown connection from ${port.name}`
  );

  // message and disconnect handlers
  port.onMessage.addListener((data) => {
    // handlers(data, port);
    console.log("onMessage", data);
  });
  port.onDisconnect.addListener(() => {
    console.log(`Disconnected from ${port.name}`);
  });
});
