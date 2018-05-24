/* Module for parsing multiple CAM API requests into one array of data results.
02.19.2018 tps Created.
04.06.2018 tps Add handling for case of being passed an empty list of API requests.
*/

const https = require('https');
var parse = require('csv-parse');


//******************** Async Functions ********************//


function collectApiResults(list, callback) {
  // list: array of strings specifying CAM API requests.
  // Callback signature: (err, <array of CAM results as an array of objects>)
  
  var doneCount = 0;          // Count of iterations, to tell us when we're done.
  var dataAccumulator = [];   // Populate with CE hours records from CAM

  // Called when each iteration is done
  function report(err, data) {

      // If an error was reported, we're done
      if (err) return callback(err);

      // Gather data from each iteration. 
      // We expect an array. Don't bother collecting empty arrays.
      if (data.length > 0) {
        dataAccumulator.push(data);
      }

      // See if all the iterations are done yet.
      doneCount++;
      if(doneCount >= list.length) {
        callback(null, dataAccumulator);
      }
  }

  // The function may have been given an empty request list, in which
  // case we return an empty list back.
  if (list.length > 0) {
    // Give each iteration its job
    for(var i = 0; i < list.length; i++) {
        getParsedData(list[i], report)
    }
  } else {
    return callback(null, []);
  }
}


function getParsedData(url, callback) {
  // Callback signature: (err, <array of CAM data object>)
  // If no data found, return a null err and empty array
   
  readRowData(url, (err, resStatusCode, resHeaders, data) => {
    if (err) {
      console.log('CAM getParsedData url:', url);
      console.log('CAM getParsedData err:', err);
      // console.log('CAM getParsedData resStatusCode:', resStatusCode);
      // console.log('CAM getParsedData resHeaders:', resHeaders);
      return callback(err);
    }

    parse(data, { columns: true }, function(err, parsedRows) {
      if (err) return callback(err);
      return callback(null, parsedRows);
    });
  });  
}


function readRowData(url, callback) {
  // Read CSV data stream returned from CAM API request.
  // Callback signature: (err, statusCode, headers, data)

  https.get(url, (res) => {
    // console.log('CAM GET', url);
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

exports.collectApiResults = collectApiResults;