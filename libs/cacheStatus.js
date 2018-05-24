/* Module containing functions for writing Canvas cache status files.
05.16.2018 tps Created.
*/

const fs = require('fs');

const FILE_PATH = 'canvas_cache/status.txt';
const LOCALE    = 'en-US';


function currentStatus(callback) {
  // Callback signature: (err, statusText)
  fs.readFile(FILE_PATH, 'utf8', (err, data) => {
    if (err) return callback(err);
    return callback(null, data);
  }); // end readFile callback
}

//******************** Status File Class ********************//
// Class to use for timing of a process.

class StatusRecorder {

  start(callback) {
    // Callback signature: (err)
    this.startTime = new Date();
    const timeString = this.startTime.toLocaleString(LOCALE);
    const statusText = 'Priming of data cache started at ' + timeString;
    return writeStatus(statusText, callback);
  }

  stop(callback) {
    // Callback signature: (err)
    const endTime = new Date();
    const timeString = endTime.toLocaleString(LOCALE);
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    const statusText = 'Priming of data cache finished at ' + timeString + ' after ' + duration + ' seconds.'
    return writeStatus(statusText, callback);
  }

}


//******************** Helper Functions ********************//

function writeStatus(statusText, callback) {
  // Callback signature: (err)
  fs.writeFile(FILE_PATH, statusText, 'utf8', (err) => {
    return callback(err);
  });
}

//******************** Exported Functions ********************//
exports.writeStatus = writeStatus;
exports.currentStatus = currentStatus;
exports.createStatusRecorder = function() { return new StatusRecorder() };
