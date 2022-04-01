import { MESSAGE_ORIGIN_CONTENT } from "metadot-extension-base/defaults";
import { enable, handleResponse } from "metadot-extension-base/page";
import { injectExtension } from "@polkadot/extension-inject";

// setup a response listener
// (events created by the loader for extension responses)
window.addEventListener("message", ({ data, source }) => {
  // only allow messages from our window, by the loader
  if (source !== window || data.origin !== MESSAGE_ORIGIN_CONTENT) {
    return;
  }

  if (data.id) {
    handleResponse(data);
  } else {
    console.error("Missing id for response.");
  }
});

function inject() {
  injectExtension(enable, {
    name: "sonar",
    version: "0.0.1",
  });
}

inject();
