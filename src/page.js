// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
let __define;

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
  __define = global.define;
  try {
    global.define = undefined;
  } catch (_) {
    console.warn("SonarWallet - global.define could not be deleted.");
  }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
  try {
    global.define = __define;
  } catch (_) {
    console.warn("SonarWallet - global.define could not be overwritten.");
  }
};

cleanContextForImports();

/* eslint-disable import/first */
import log from "loglevel";
import { WindowPostMessageStream } from "@metamask/post-message-stream";
import { initializeProvider } from "@metamask/providers";

restoreContextAfterImports();

log.setDefaultLevel(process.env.SONAR_DEBUG ? "debug" : "warn");

//
// setup plugin communication

// setup background connection
const sonarStream = new WindowPostMessageStream({
  name: "sonar-page",
  target: "sonar-content",
});

initializeProvider({
  connectionStream: sonarStream,
  logger: log,
  shouldShimWeb3: true,
});
