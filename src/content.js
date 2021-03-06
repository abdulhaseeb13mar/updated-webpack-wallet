import pump from "pump";
import { WindowPostMessageStream } from "@metamask/post-message-stream";
import PortStream from "extension-port-stream";
import browser from "webextension-polyfill";
import { setPermission } from "./utils";

const ObjectMultiplex = require("obj-multiplex");
const extension = require("extensionizer");

const CONTENT_SCRIPT = "sonar-content";
const PAGE = "sonar-page";
const PROVIDER = "sonar-provider";

// TODO:LegacyProvider: Delete
const LEGACY_CONTENT_SCRIPT = "contentscript";
const LEGACY_INPAGE = "inpage";
const LEGACY_PROVIDER = "provider";
const LEGACY_PUBLIC_CONFIG = "publicConfig";
const INJECTED_WINDOW_PROVIDER_SOURCE = "@@@WINDOW_PROVIDER@@@";
const windowOriginAtLoadTime = window.location.origin;

if (shouldInjectProvider()) {
  injectScript();
  setupStreams();
}

/**
 * Injects a script tag into the current document
 */
function injectScript() {
  try {
    const container = document.head || document.documentElement;
    const script = document.createElement("script");
    script.setAttribute("src", extension.runtime.getURL("page.js"));
    container.insertBefore(script, container.children[0]);
    container.removeChild(script);
  } catch (error) {
    console.error("SonarWallet: Provider injection failed.", error);
  }
}

/**
 * Sets up two-way communication streams between the
 * browser extension and local per-page browser context.
 *
 */
async function setupStreams() {
  // the transport-specific streams for communication between page and background
  const pageStream = new WindowPostMessageStream({
    name: CONTENT_SCRIPT,
    target: PAGE,
  });
  const extensionPort = browser.runtime.connect({ name: CONTENT_SCRIPT });
  const extensionStream = new PortStream(extensionPort);

  window.addEventListener("message", event => {
    console.log("EVRE==========", event.data?.target, event.data?.data?.data);
    if (
      event.data?.target === "sonar-content" &&
      event.data?.data?.data?.method === "eth_requestAccounts"
    ) {
      console.log(
        `%c content: inpage > background: ${JSON.stringify(event.data)}`,
        "background: #bada55; color: #222"
      );
      extensionPort.postMessage(
        event.data
        //   {
        //   method: event.data?.data?.data?.method,
        //   params: event.data?.data?.data?.params,
        // }
      );
    }

    if (
      // event.data?.target === "sonar-content" &&
      event.data?.data?.data?.method === "eth_sendTransaction"
    ) {
      console.log(
        `%c content: inpage > background: ${JSON.stringify(event.data)}`,
        "background: #bada55; color: #222"
      );
      extensionPort.postMessage(
        event.data
        //   {
        //   method: event.data?.data?.data?.method,
        //   params: event.data?.data?.data?.params,
        // }
      );
    }
  });

  extensionPort.onMessage.addListener(async data => {
    // TODO: replace with better logging before v1. Now it's invaluable in debugging.
    // eslint-disable-next-line no-console
    console.log(
      `%c content: background > inpage: ${JSON.stringify(data)}`,
      "background: #222; color: #bada55"
    );
    console.log("DA==========", data);
    window.postMessage(
      {
        target: PAGE,

        data: {
          data: { ...data },
        },
      },
      window.location.origin
    );
  });

  // let's grab the internal config
  extensionPort.postMessage({ request: { method: "sonar_getConfig" } });

  // create and connect channel muxers
  // so we can handle the channels individually
  // const pageMux = new ObjectMultiplex();
  // pageMux.setMaxListeners(25);
  // const extensionMux = new ObjectMultiplex();
  // extensionMux.setMaxListeners(25);
  // extensionMux.ignoreStream(LEGACY_PUBLIC_CONFIG); // TODO:LegacyProvider: Delete

  // pump(pageMux, pageStream, pageMux, err =>
  //   logStreamDisconnectWarning("SonarWallet Inpage Multiplex", err)
  // );
  // pump(extensionMux, extensionStream, extensionMux, err => {
  //   logStreamDisconnectWarning("SonarWallet Background Multiplex", err);
  //   notifyPageOfStreamFailure();
  // });

  // forward communication across page-background for these channels only
  // forwardTrafficBetweenMuxes(PROVIDER, pageMux, extensionMux);

  // connect "phishing" channel to warning system
  //   const phishingStream = extensionMux.createStream("phishing");
  //   phishingStream.once("data", redirectToPhishingWarning);

  // TODO:LegacyProvider: Delete
  // handle legacy provider
  // const legacyPageStream = new WindowPostMessageStream({
  //   name: LEGACY_CONTENT_SCRIPT,
  //   target: LEGACY_INPAGE,
  // });

  // const legacyPageMux = new ObjectMultiplex();
  // legacyPageMux.setMaxListeners(25);
  // const legacyExtensionMux = new ObjectMultiplex();
  // legacyExtensionMux.setMaxListeners(25);

  // pump(legacyPageMux, legacyPageStream, legacyPageMux, err =>
  //   logStreamDisconnectWarning("SonarWallet Legacy Inpage Multiplex", err)
  // );
  //   pump(
  //     legacyExtensionMux,
  //     extensionStream,
  //     getNotificationTransformStream(),
  //     legacyExtensionMux,
  //     (err) => {
  //       logStreamDisconnectWarning("SonarWallet Background Legacy Multiplex", err);
  //       notifyPageOfStreamFailure();
  //     }
  //   );

  // forwardNamedTrafficBetweenMuxes(
  //   LEGACY_PROVIDER,
  //   PROVIDER,
  //   legacyPageMux,
  //   legacyExtensionMux
  // );
  // forwardTrafficBetweenMuxes(
  //   LEGACY_PUBLIC_CONFIG,
  //   legacyPageMux,
  //   legacyExtensionMux
  // );
}

function forwardTrafficBetweenMuxes(channelName, muxA, muxB) {
  const channelA = muxA.createStream(channelName);
  const channelB = muxB.createStream(channelName);
  pump(channelA, channelB, channelA, error =>
    console.debug(
      `SonarWallet: Muxed traffic for channel "${channelName}" failed.`,
      error
    )
  );
}

// TODO:LegacyProvider: Delete
function forwardNamedTrafficBetweenMuxes(
  channelAName,
  channelBName,
  muxA,
  muxB
) {
  const channelA = muxA.createStream(channelAName);
  const channelB = muxB.createStream(channelBName);
  pump(channelA, channelB, channelA, error =>
    console.debug(
      `SonarWallet: Muxed traffic between channels "${channelAName}" and "${channelBName}" failed.`,
      error
    )
  );
}

// TODO:LegacyProvider: Delete
// function getNotificationTransformStream() {
//   return createThoughStream((chunk, _, cb) => {
//     if (chunk?.name === PROVIDER) {
//       if (chunk.data?.method === "metamask_accountsChanged") {
//         chunk.data.method = "wallet_accountsChanged";
//         chunk.data.result = chunk.data.params;
//         delete chunk.data.params;
//       }
//     }
//     cb(null, chunk);
//   });
// }

/**
 * Error handler for page to extension stream disconnections
 *
 * @param {string} remoteLabel - Remote stream name
 * @param {Error} error - Stream connection error
 */
function logStreamDisconnectWarning(remoteLabel, error) {
  console.debug(
    `SonarWallet: Content script lost connection to "${remoteLabel}".`,
    error
  );
}

/**
 * This function must ONLY be called in pump destruction/close callbacks.
 * Notifies the pa context that streams have failed, via window.postMessage.
 * Relies on obj-multiplex and post-message-stream implementation details.
 */
function notifyPageOfStreamFailure() {
  window.postMessage(
    {
      target: PAGE, // the post-message-stream "target"
      data: {
        // this object gets passed to obj-multiplex
        name: PROVIDER, // the obj-multiplex channel name
        data: {
          jsonrpc: "2.0",
          method: "METAMASK_STREAM_FAILURE",
        },
      },
    },
    window.location.origin
  );
}

/**
 * Determines if the provider should be injected
 *
 * @returns {boolean} {@code true} Whether the provider should be injected
 */
function shouldInjectProvider() {
  return (
    doctypeCheck() && suffixCheck() && documentElementCheck()
    // && !blockedDomainCheck()
  );
}

/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {boolean} {@code true} if the doctype is html or if none exists
 */
function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === "html";
  }
  return true;
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that we should not inject the provider into. This check is indifferent of
 * query parameters in the location.
 *
 * @returns {boolean} whether or not the extension of the current document is prohibited
 */
function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i++) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks the documentElement of the current document
 *
 * @returns {boolean} {@code true} if the documentElement is an html node or if none exists
 */
function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === "html";
  }
  return true;
}

/**
 * Checks if the current domain is blocked
 *
 * @returns {boolean} {@code true} if the current domain is blocked
 */
// function blockedDomainCheck() {
//   const blockedDomains = [
//     "uscourts.gov",
//     "dropbox.com",
//     "webbyawards.com",
//     "cdn.shopify.com/s/javascripts/tricorder/xtld-read-only-frame.html",
//     "adyen.com",
//     "gravityforms.com",
//     "harbourair.com",
//     "ani.gamer.com.tw",
//     "blueskybooking.com",
//     "sharefile.com",
//   ];
//   const currentUrl = window.location.href;
//   let currentRegex;
//   for (let i = 0; i < blockedDomains.length; i++) {
//     const blockedDomain = blockedDomains[i].replace(".", "\\.");
//     currentRegex = new RegExp(
//       `(?:https?:\\/\\/)(?:(?!${blockedDomain}).)*$`,
//       "u"
//     );
//     if (!currentRegex.test(currentUrl)) {
//       return true;
//     }
//   }
//   return false;
// }

/**
 * Redirects the current page to a phishing information page
 */
// function redirectToPhishingWarning() {
//   console.debug("SonarWallet: Routing to Phishing Warning component.");
//   const extensionURL = extension.runtime.getURL("phishing.html");
//   window.location.href = `${extensionURL}#${querystring.stringify({
//     hostname: window.location.hostname,
//     href: window.location.href,
//   })}`;
// }

// chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
//   console.log(response);
// });

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   console.log(
//     sender.tab
//       ? "from a content script:" + sender.tab.url
//       : "from the extension"
//   );
//   if (request.greeting === "hello") sendResponse({ farewell: "goodbye" });
// });

// chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//   chrome.tabs.sendMessage(
//     tabs[0].id!,
//     { greeting: "hello" },
//     function (response) {
//       console.log(response.farewell);
//     }
//   );
// });

export {};
