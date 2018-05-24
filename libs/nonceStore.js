/* Nonce store implementation.

07.04.2017 tps
*/

/* Data store is array holding nonce objects with the following properties:
nonce: String nonce value.
expiry: Nonce's expiration date, in seconds since the epoch.
*/
var nonceStore = [];

/* Nonces are considered valid only if their timestamp indicates
they were minted within a certain number of seconds before or
after the current time.
*/
var freshnessInterval = 60 * 5;

//******************** Module Exports ********************

exports.setFreshnessInterval = (seconds) => {
  freshnessInterval = seconds;
}

exports.isNonceReplayed = (nonceValue) => {
  // Detect a replayed nonce.
  exports.clearExpiredNonces();
  var foundNounce = nonceStore.find(function(nonceObj) {
    return (nonceObj['nonce'] === nonceValue);
  });

  var isFound = (foundNounce !== undefined);

  // Add to store if we haven't seen this nonce before.
  if (!isFound) {
    nonceStore.push( {
      'nonce': nonceValue,
      'expiry': Math.round(Date.now() / 1000) + freshnessInterval });
  }
  return isFound;
}

exports.isTimestampFresh = (timestamp) => {
  // Timestamps are in seconds.
  // Timestamps up to and including the freshness interval are valid.
  var currentTime = Math.round(Date.now() / 1000);
  return (((currentTime - freshnessInterval) <= timestamp) &&
    (timestamp <= (currentTime + freshnessInterval)));
}

exports.clearExpiredNonces = () => {
  // Don't need to keep nonce values past their freshness interval.
  // Return number of nonces left in store after clearing house.
  var currentTime = Math.round(Date.now() / 1000);
  nonceStore = nonceStore.filter(function(nonce) {
    return (currentTime <= nonce['expiry']);
  });
  return nonceStore.length;
}

exports.clear = () => {
  // Clear the nonce store. For testing purposes.
  nonceStore = [];
  return true;
}
