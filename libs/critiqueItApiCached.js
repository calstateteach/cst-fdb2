/* Decorator for critiqueItApi module that caches results to the session.
09.01.2017 tps Created.
*/
const critApi = require('./critiqueItApi');

//******************** Constants ********************//
// Property names for cached data.
const CACHED_CRIT_COURSES = 'critiqueItCourses';


//******************** Utility Functions ********************//

function getCourseAssignments(sessionCache, courseId, callback) {
  // Callback signature: (err, json)

  // Make sure that the session cache  has been initialized.if
  sessionCache[CACHED_CRIT_COURSES] = sessionCache[CACHED_CRIT_COURSES] || { };

  // If the data has already been cached, we can return it right away.
  if (sessionCache[CACHED_CRIT_COURSES][courseId]) {
    return process.nextTick(callback, null, sessionCache[CACHED_CRIT_COURSES][courseId]);
  } else {
    // Otherwise, we need to retrieve it.
    critApi.getCourseAssignments(courseId, (err, json) => {
      if (err) return callback(err);

      sessionCache[CACHED_CRIT_COURSES][courseId] = json;
      return callback(err, json);
    }); // end callback
  } // end else data not yet cached.
} // end function


function clearCache(sessionCache) {
  sessionCache[CACHED_CRIT_COURSES] = { };
}


//******************** Module Exports ********************//

exports.getCourseAssignments = getCourseAssignments;
exports.clearCache = clearCache;
