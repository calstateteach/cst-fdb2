/* Module that ecapsulates timer to
periodically check the oldest data in the disk cache
and prime the cache if it is too old.
01.24.2018 tps Moved into its own module
*/

const canvasCache = require('./canvasCache');
const cachePrimer = require('./canvasCachePrimer');

//******************** Exports ********************//
const TIMER_INTERVAL_MS = 1000 * 60 * 60 * 1;   // 1 hour
const MAX_CACHE_AGE_MS  = 1000 * 60 * 60 * 8;   // 8 hours


function start(app) {
  // app -- Express app. Required for access to app locals.
  const cacheTimer = setInterval(function() {

    console.log('Checking disk cache', (new Date()).toLocaleString());
    canvasCache.getOldestTimestamp( (err, oldestTime) => {
      if (err) return log.console('cacheTimer error calling getOldestTimestamp', err);

      var ageInMs = (new Date()) - oldestTime;

      // console.log('oldest time stamp', oldestTime.toLocaleString());
      // console.log('ageInMs', ageInMs, MAX_CACHE_AGE_MS);

      if (ageInMs > MAX_CACHE_AGE_MS) {
         // Fake request object so that cachePrimer can access app locals
         var req = {};
        req['app'] = app;
        cachePrimer.start(req);
      }
    });
  }, TIMER_INTERVAL_MS);

  // Make sure to clear timers on program exit
  process.on('SIGINT', function() {
    clearInterval(cacheTimer);
  });
}


//******************** Exports ********************//
exports.start = start;
