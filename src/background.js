/* global chrome */

import extension from "extensionizer";
import browser, { Runtime } from "webextension-polyfill";
import { EIP1193Error, EIP1193_ERROR_CODES } from "./eip-1193";

import NotificationManager from "./notification-manager";

const notificationManager = new NotificationManager();

browser.runtime.onConnect.addListener(async port => {
  if (port.sender?.url) {
    port.onMessage.addListener(event => {
      receiver(port, event);
    });
  }
});
const CONTENT_SCRIPT = "sonar-content";

// async function requestPermission(
//   permissionRequest
// ) {
//   this.emitter.emit("requestPermission", permissionRequest)
//   await showExtensionPopup(AllowedQueryParamPage.dappPermission)

//   return new Promise((resolve) => {
//     this.#pendingPermissionsRequests[permissionRequest.origin] = resolve
//   })
// }

async function receiver(port, event) {
  const { url, tab, id } = port.sender;
  const { origin } = new URL(url);
  const { data } = event;
  const completeTab =
    typeof tab !== "undefined" && typeof tab.id !== "undefined"
      ? {
          ...tab,
          // Firefox sometimes requires an extra query to get favicons,
          // unclear why but may be related to
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1417721 .
          ...(await browser.tabs.get(tab.id)),
        }
      : tab;
  const faviconUrl = completeTab?.favIconUrl ?? "";
  const title = completeTab?.title ?? "";
  const response = { id, result: [] };
  if (data && data.data.method === "eth_requestAccounts") {
    const accountAddress = "0x0eb50c1343D51d94C888Ef188F0D0E2D1b0F2A98";
    notificationManager.showPopup();
    const permissionRequest = {
      key: `${origin}_${accountAddress}`,
      origin,
      faviconUrl,
      title,
      state: "request",
      accountAddress,
    };

    response.result = new EIP1193Error(
      EIP1193_ERROR_CODES.userRejectedRequest
    ).toJSON();
    //  ["0x0eb50c1343D51d94C888Ef188F0D0E2D1b0F2A98"];
    // await routeContentScriptRPCRequest(
    //   permissionRequest,
    //   "eth_accounts",
    //   data.data.params
    // );

    port.postMessage(JSON.stringify(response));
  }
}

async function routeContentScriptRPCRequest(
  enablingPermission,
  method,
  params
) {
  try {
    switch (method) {
      case "eth_requestAccounts":
      case "eth_accounts":
        return [enablingPermission.accountAddress];

      default: {
        return [enablingPermission.accountAddress];
      }
    }
  } catch (error) {
    //   logger.log("error processing request", error)
    //   return new EIP1193Error(EIP1193_ERROR_CODES.userRejectedRequest).toJSON()
    console.log("ERROR==========", error);
  }
}

// chrome.runtime.onConnectExternal.addListener(function (port) {
//   if (port.name === "ffnbolphmnfchfahpfpdimiplcbknmbb") {
//     port.onMessage.addListener(function (msg) {
//       console.log("port connect message:", msg);
//       notificationManager.showPopup();
//     });
//     port.onDisconnect.addListener(function (something) {
//       console.log("disconnected", something);
//     });
//   }
// });

// extension.runtime.onMessage(function (msg, sender, sendResponse) {
//   console.log("message received", msg, sender);
// });

// chrome.runtime.onMessage.addListener(remotePort => {
//   console.log("remotePort", remotePort);

//   remotePort.onMessage.addListener(msg => {
//     console.log("msg", msg);
//   });
//   // setTimeout(() => {
//   //   notificationManager.showPopup();
//   // }, 5000);
// });
