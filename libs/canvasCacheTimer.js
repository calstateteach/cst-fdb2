/* Module that ecapsulates timer to
periodically check the oldest data in the disk cache
and prime the cache if it is too old.
01.24.2018 tps Moved into its own module
*/

const moduleCache = require('./moduleCache');
const cachePrimer = require('./cachePrimer');

//******************** Exports ********************//
const TIMER_INTERVAL_MS = 1000 * 60 * 60 * 1;   // 1 hour
const MAX_CACHE_AGE_MS  = 1000 * 60 * 60 * 8;   // 8 hours


function checkFreshness() {
  const now = new Date();
  console.log('Checking cache freshness at', now.toLocaleString('en-US'));

  moduleCache.getOldestTimestamp( (err, timestamp) => {
    if (err) return console.log('Error checking cache timestamp:', err);

    var ageInMs = now - timestamp;
    if (ageInMs > MAX_CACHE_AGE_MS) {
      cachePrimer.prefetch( (primingErr) => {
        if (err) return console.log("Error priming cache:", primingErr);
      });
    }
  });
}

  
function start() {
  return setInterval(checkFreshness, TIMER_INTERVAL_MS);
}


//******************** Exports ********************//
exports.start = start;
