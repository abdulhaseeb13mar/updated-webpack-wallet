import extension from "extensionizer";
import NotificationManager from "./notification-manager";

const notificationManager = new NotificationManager();

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

extension.runtime.onConnect.addListener((remotePort) => {
  console.log("remotePort", remotePort);

  remotePort.onMessage.addListener((msg) => {
    console.log("msg", msg);
  });
  setTimeout(() => {
    notificationManager.showPopup();
  }, 5000);
});
