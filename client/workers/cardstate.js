/**
 * Worker handles storing and retrieving data from the local database. On
 * startup the app will request all card data we have, and then during review
 * it will save updated data post-review. The app itself has no knowledge of
 * stored data except via these messages.
 */

onmessage = (e) => {
  console.log("Received a message!");
  postMessage("Sent a message!");
};
