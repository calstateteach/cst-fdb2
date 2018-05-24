/* Module encapsulating priming the cache of Canvas data.
05.15.2018 tps Start refactoring of canvasCachePrimer.js.
05.17.2018 tps I don't think we need sections data.
*/

// const fs          = require('fs');
const async       = require('async');
const appConfig   = require('./appConfig');
const canvasCache = require('./canvasCache');
const moduleCache = require('./moduleCache');
const statusFile  = require('./cacheStatus');

// Pointers to functions that populate the cache
const getEnrollments  = canvasCache.loadCourseEnrollments;
// const getSections     = canvasCache.loadCourseSections;
const getModules      = canvasCache.loadCourseModules;
const getAssignments  = canvasCache.loadCourseAssignments;

const DELAY = 1000; // Delay in milliseconds between API calls, Canvas doesn't throttle us.

/**
 * Data we'd like to have prefetched:
 * - Enrollments for each term course.
 * - Modules for each term course.
 * - Assignments for reach term course.
 * - Enrollments for each iSupervision course
 * - Assignments for each iSupervision course.
 * 
 * @param {function} callback
 *    callback signature: (err)
 */
function prefetchCanvasData(callback) {
  const terms = appConfig.getTerms();
  var queryCount = 0;
  var queryFunctions = [];

  // For code readability, this defines a function that queues up the next Canvas query to run.
  function queueUpQuery(f, courseId) {
    return function(cb) {
      return setTimeout(f, ++queryCount * DELAY, courseId, cb);
    };
  }

  // Term courses data to fetch
  const termCourseIds = terms.map( e => e.course_id);
  for (let id of termCourseIds) {

    queryFunctions.push(queueUpQuery(getEnrollments, id));    
    // queryFunctions.push(queueUpQuery(getSections, id));
    queryFunctions.push(queueUpQuery(getModules, id));
    queryFunctions.push(queueUpQuery(getAssignments, id));

  } // end loop through course terms

  // iSupervision courses data to fetch.
  // Term courses can share an iSupervision course.
  var iSupeCourseIds = new Set(terms.map( e => e.iSupe_course_id));
  for (let id of iSupeCourseIds) {

    queryFunctions.push(queueUpQuery(getEnrollments, id));
    // queryFunctions.push(queueUpQuery(getSections, id));
    queryFunctions.push(queueUpQuery(getAssignments, id));

  } // end loop through iSupervision courses

  function done(err, results) {
    if (err) return callback(err);
    return callback(null);
  }

  console.log("Priming cache with", queryFunctions.length, "queries.");
  async.parallel(queryFunctions, done);
}

function prefetch(callback) {
  // callback signature: (err);

  // Record how long this takes
  const statusRecorder = statusFile.createStatusRecorder();
  function startTiming(callback) { return statusRecorder.start(callback); }
  function stopTiming(callback) { return statusRecorder.stop(callback); }

  async.series([
    startTiming,
    moduleCache.deleteDiskCache,
    prefetchCanvasData,
    canvasCache.loadFaculty,
    stopTiming
  ], done);

  function done(err) {
    if (err) return callback(err);
    return callback(null);
  }
}


//******************** Exported Functions ********************//
exports.prefetch = prefetch;