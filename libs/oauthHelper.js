/* Helper function for authentication via oauth 1.0.

07.04.2017 tps
08.08.2017 tps Read consumer data from environment variables.
*/
var nonceStore = require('./nonceStore');
var oauth = require('oauth-sign/index.js')
  , hmacsign = oauth.hmacsign

//*************** Database of consumer keys and secrets ***************
const CONSUMERS = [
  { consumer_key:     process.env.CST_LTI_CONSUMER_KEY,
    consumer_secret:  process.env.CST_LTI_CONSUMER_SECRET,
    consumer_desc:    process.env.CST_LTI_CONSUMER_DESC
  }
];

exports.isSignedOk = (httpMethod, launchUrl, signedFields) => {
  // Authenticate signature of request parameters.

  // Look up the consumer key.
  function isConsumer(obj) {
    return (obj['consumer_key'] === signedFields['oauth_consumer_key']);
  }
  var consumerObj = CONSUMERS.find(isConsumer)
  if (consumerObj === undefined) {
    return false;
  }

  // Try validating the signed data.
  // The POST fields include the signature for the signed
  // data, which itself is not part of the data that got signed.
  var consumerSignature = signedFields['oauth_signature'];
  var signedFieldsCopy = Object.assign( {}, signedFields);
  delete signedFieldsCopy['oauth_signature'];
  var postSignature = hmacsign(
    httpMethod,
    launchUrl,
    signedFieldsCopy,
    consumerObj['consumer_secret']);
  if (postSignature !== consumerSignature) {
    return false;
  }

  return true;
}

exports.validateLtiRequest = (httpMethod, launchUrl, signedFields) => {
  // Based on authentication process described here:
  // https://www.imsglobal.org/wiki/step-2-valid-lti-launch-request

  // Check that timestamp is reasonably current.
  if (!nonceStore.isTimestampFresh(parseInt(signedFields['oauth_timestamp'], 10))) {
    // console.log('OAuth timestamp validation failed.');
    return false;
  }

  // Check that nonce is not being replayed
  if (nonceStore.isNonceReplayed(signedFields['oauth_nonce'])) {
    // console.log('OAuth nonce validation failed.');
    return false;
  }

  // Check that the request signature is valid.
  if (!exports.isSignedOk(httpMethod, launchUrl, signedFields)) {
    // console.log('OAuth signature validation failed.');
    return false;
  }

  // Make sure that version fields are what we expect from Canvas.
  if (signedFields['oauth_signature_method'] !== 'HMAC-SHA1') {
    // console.log('OAuth signature method validation failed.');
    return false;
  }
  if (signedFields['oauth_version'] !== '1.0') {
    // console.log('OAuth version validation failed.');
    return false;
  }
  if (signedFields['lti_version'] !== 'LTI-1p0') {
    // console.log('OAuth LTI version validation failed.');
    return false;
  }
  if (signedFields['lti_message_type'] !== 'basic-lti-launch-request') {
    // console.log('OAuth LTI message type validation failed.');
    return false;
  }

  return true;
}
