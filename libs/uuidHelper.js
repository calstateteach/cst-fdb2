/* Helper functions for generating UUIDs.

07.09.2017 tps
*/
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');
const base64 = require('base-64');

//******************** Module Exports ********************

exports.makeUuids = (n = 10) => {
  // Generate lists of UUIDs.
  var uuidv1List = [];
  var uuidv4List = [];
  for (let i = 0; i < n; ++i) {
    uuidv1List.push(base64.encode(uuidv1()));
    uuidv4List.push(base64.encode(uuidv4()));
  }

  // Return lists as object properties we can send to a renderer.
  return {
    uuidv1: uuidv1List,
    uuidv4: uuidv4List
  };
}
