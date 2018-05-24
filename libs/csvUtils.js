/* Module for retrieving CSV data from a file or URL and parsing it into a row collection.
04.28.2018 tps Created.
*/

const fs = require('fs');
const https = require('https');
var parse = require('csv-parse');

/**
 * Read CSV file data & parse into object collection.
 * Callback signature: (err, rowCollection)
 */
function parseFile(filePath, callback) {
  fs.readFile(filePath, function (err, fileData) {
    if (err) return callback(err);
    parse(fileData, { columns: true}, function(err, rows) {
      // Your CSV data is in an array of arrys passed to this callback as rows.
      if (err) return callback(err);
      return callback(null, rows);

    });
  });
}

/**
 * Read CSV from URL endpoint into CSV row objects collection.
 * Callback signature: (err, rowCollection)
 */

function parseUrl(url, callback) {
  readUrlData(url, (err, statusCode, headers, data) => {
    if (err) return callback(err);

    parse(data, { columns: true}, function(err, parsedRows) {
      if (err) return callback(err);
      return callback(null, parsedRows);
    });
  });
}

/**
 * Read CSV from URL.
 * Callback signature: (err, statusCode, headers, data)
 */
function readUrlData(url, callback) {

  https.get(url, (res) => {
    console.log('https get', url);
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

//******************** Async Helper Functions ********************//
// Helper functions that return versions of parse functions that
// are convenient to use with async library.

function parseFileFunction(filePath) {
  return function(callback) {
    return parseFile(filePath, callback);
  };
}

function parseUrlFunction(url) {
  return function(callback) {
    return parseUrl(url, callback);
  };
}


//******************** Exports ********************//
exports.parseUrl = parseUrl;
exports.parseFile = parseFile;
exports.parseUrlFunction = parseUrlFunction;
exports.parseFileFunction = parseFileFunction;