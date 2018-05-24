/* Module encapsulating Google spreadsheet CAM data.
This module makes an HTTPS GET request the first time the client requests the data.
For subsequent requests, it returns a saved copy of the data.
01.01.2018 tps Created.
01.08.2018 tps Add reload().
04.24.2018 tps Fix async call bug.
*/

const https = require('https');
var parse = require('csv-parse');

// Cached CAM data, including initial HTTPS GET response
var statusCode = null;
var headers = null;
var rows = null;

const MENTOR_LIST_URL = process.env.MENTOR_LIST_URL;

function readRows(callback) {
  // Read data from Google spreadsheet & cache it.
  // Callback signature: (err, statusCode, headers, <row collection>)

  // If we've already got the data, return it without querying the endpoint.
  if (rows) {
    return process.nextTick(callback, null, statusCode, headers, rows);
  
  // Query the endpoint for the data.
  } else {
    readRowData((err, resStatusCode, resHeaders, data) => {
      if (err) return callback(err);

      statusCode = resStatusCode; // Save the HTTPS responses
      headers = resHeaders;

      parse(data, { columns: true}, function(err, parsedRows) {
        if (err) return callback(err);
        rows = parsedRows;  // Save the parsed data.
        return callback(null, statusCode, headers, rows);
      });
    });
  }
}

function reload() {
  // Force module to read CAM from spreadsheet instead of cache on next read.
  rows = null;
}


//******************** Helper Async Functions ********************//

function readRowData(callback) {
  // Read online spreadsheet of contact data
  // Callback signature: (err, statusCode, headers, data)

  https.get(MENTOR_LIST_URL, (res) => {
    console.log('https get', MENTOR_LIST_URL);
    res.setEncoding('utf8');
    var statusCode = res.statusCode;
    var headers = res.headers;
    var data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      return callback(null, statusCode, headers, data);
    });


  }).on('error', (e) => {
    return callback(e);
  });
}


//******************** Exports ********************//

module.exports.readRows = readRows;
module.exports.reload = reload;
