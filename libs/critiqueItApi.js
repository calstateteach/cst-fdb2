/* Module functions that query CritiqueIt API.
API implemented by Julian Poyourow.
09.01.2017 tps Created.
*/

const tiny = require('tiny-json-http');

// ########### Endpoint constants ###########

const REQUEST_HEADERS = {
  'token': process.env.CST_CRITIQUEIT_TOKEN,
  'Content-Type': 'application/json'
};

const BASE_URL = process.env.CST_CRITIQUEIT_API_URL;

// ######## Utility Functions ##########

function get(apiEndpoint, callback) {
  // callback signature: (err, json)
  var endpointUrl = BASE_URL + apiEndpoint;

  tiny.get({
    url: endpointUrl,
    headers: REQUEST_HEADERS
  },
    (err, response) => {
      if (err) {
        // Try to give hints about request that failed.
        err.message += ' from ' + endpointUrl;
        console.log(err.message);
        return callback(err, null);
      }

      console.log(`Got ${response.body.length} records from ${endpointUrl}`);
      return callback(err, response.body);
    }); // end callback.
} // end function


// ######## Module Exports ##########

exports.getAllAssignments = function(callback) {
  get('assignments', callback);
};

exports.getCourseAssignments = function(courseId, callback) {
  get(`assignments/canvasCourseId/${courseId}`, callback);
};

exports.getStats = function(callback) {
  get('stats', callback);
};
