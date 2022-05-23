/* global chrome */

import extension from "extensionizer";
import browser, { Runtime } from "webextension-polyfill";
import Emittery from "emittery";

import { EIP1193Error, EIP1193_ERROR_CODES } from "./eip-1193";

import NotificationManager from "./notification-manager";
import { ProviderBridgeServiceDatabase } from "./db";
import { setPermission } from "./utils";

const notificationManager = new NotificationManager();
export const emitter = new Emittery();

browser.runtime.onConnect.addListener(async port => {
  if (port.sender?.url) {
    port.onMessage.addListener(event => {
      console.log("ECEBR========", event);
      receiver(port, event);
    });
  }
});
const CONTENT_SCRIPT = "sonar-content";

async function receiver(port, event) {
  const { url, tab, id } = port.sender;
  const { origin } = new URL(url);
  const { data } = event;
  const completeTab =
    typeof tab !== "undefined" && typeof tab.id !== "undefined"
      ? {
          ...tab,
          ...(await browser.tabs.get(tab.id)),
        }
      : tab;
  const faviconUrl = completeTab?.favIconUrl ?? "";
  const title = completeTab?.title ?? "";
  const response = { id: 1, result: [] };
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

    response.result = ["0x0eb50c1343D51d94C888Ef188F0D0E2D1b0F2A98"];

    port.postMessage(response);
  }
  if (data && data.data.method === "eth_sendTransaction") {
    notificationManager.showPopup();
    const permissionRequest = {
      from: data.data.parms[0].from,
      to: data.data.parms[0].to,
      value: data.data.parms[0].value,
    };

    response.result = permissionRequest;

    // new EIP1193Error(
    //   EIP1193_ERROR_CODES.userRejectedRequest
    // ).toJSON();
    //

    port.postMessage(response);
  }
}
