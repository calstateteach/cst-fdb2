/* Module containing functions that render Canvas cache page.
01.11.2018 tps Created.
01.17.2018 tps Add handler to prime the Canvas cache.
01.18.2018 tps Move readDirWithTimestamps() to canvasCache.js
01.24.2018 tps Handle query parameters for sort order of cache listing.
05.16.2018 tps Include cache status.
05.18.2018 tps Display value of cached object.
*/

const async       = require('async');
const fs          = require('fs');
const cacheStatus = require('../../libs/cacheStatus');
const moduleCache = require('../../libs/moduleCache');

const CACHE_DIR = 'canvas_cache/';


function get(req, res) {
  const cacheKey = req.query['key']; // User might want to see cache contents
  if (cacheKey) {
    return renderCacheValue(req, res, cacheKey);
  } else {
    return renderCacheTable(req, res);
  }

}

// function post(req, res) {
//   // Clear cache object
//   if (req.body.action === 'clearKey') {
//     canvasCache.removeKey(req, req.body.cacheKey, (err) => {
//       if (err) return res.render('dev/err', { err: err });
//       return get(req, res);
//     });
//   } else {
//     return get(req,res);
//   }
// }

//******************** Page Render Functions ********************//

/**
 * Draw table listing all cache contents.
 */
function renderCacheTable(req, res) {
  async.parallel([
    cacheStatus.currentStatus,
    readDiskCacheStats
  ], renderPage);

  function renderPage(err, results) {
    if (err) return res.render('dev/err', { err: err });
    
    const statusString = results[0];
    var files = results[1];
    
    // Total the file sizes
    var sizeTotal = 0;
    for (file of files) {
      sizeTotal += file.size;
    }

    // Sort the table of files
    switch(req.query.sort) {
    case 'size':
    case 'timestamp':
      files = files.sort(compareByField(req.query.sort));
      break;
    case 'age':
      files = files.sort(compareByField('timestamp')).reverse();
      break;
    default:
      // no-op. Files are already in key order
    }

    var params = {
      status:         statusString,
      files:          files,
      fileSizeTotal:  sizeTotal
    };
    return res.render('dev/canvasCache', params);
  } // end renderPage function
}


function renderCacheValue(req, res, cacheKey) {
  const cacheObj = moduleCache.get(cacheKey);
  const params = {
    cacheKey:   cacheKey,
    json:       cacheObj.json,
    timestamp:  cacheObj.timestamp   
  }
  return res.render('dev/cacheJson', params);
}


//******************** Helper Async Functions ********************//

readDiskCacheStats = (callback) => {
  // Retrieve file stats for cached data on disk.
  // Callback signature: (err, <array of file objects>)
  // File objects contain: file name, time stamp, file size
  var fileObjs = [];

  fs.readdir(CACHE_DIR, (err, files) => {
    if (err) return callback(err);

    // We only care about json files
    files = files.filter( s => s.endsWith('.json'));

    // There may be no files, in which we can return now
    if (files.length <= 0) {
      return callback(null, files);
    }

    var iterationCount = 0; // Tells us when to stop iterations

    // Closure that builds fileObjs list.
    function iterate(fileName) {
      // We're interested in the file timestamps as well
      fs.stat(CACHE_DIR + fileName, (err, stat) => {
        if (err) return callback(err);

        fileObjs.push({
          fileName: fileName,
          timestamp: stat.mtime,
          size: stat.size
        });

        if (++iterationCount >= files.length) {

          // Return the files sorted by name
          fileObjs.sort(compareByField('fileName'));
          return callback(null, fileObjs);
        }
      });
    }

    for (var i = 0; i < files.length; ++i) {
      iterate(files[i]);
    }
  });
};


// //******************** Helper Functions ********************//

  function compareByField(fieldName) {
    // Return a compare function for array's sort() method.
    // Compare the values in the specified field on the array elements.
    return function (a, b) {
        if (a[fieldName] < b[fieldName]) {
          return -1;
        }
        if (a[fieldName] > b[fieldName]) {
          return 1;
        }
        // a must be equal to b
        return 0;
      }
  }


//******************** Exports ********************//

exports.get = get;
// exports.post = post;
