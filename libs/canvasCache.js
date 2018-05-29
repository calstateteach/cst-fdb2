/* Module encapsulating pre-fetching Canvas data.
* 05.15.2018 tps Start refactoring of canvasCache.js.
  05.28.2018 tps Try pre-fetching assignments by user.
*/

// const fs          = require('fs');
const async       = require('async');
const canvasQuery = require('./canvasQuery');
const appConfig   = require('./appConfig');
const moduleCache = require('./moduleCache');

// const CACHE_DIR = 'canvas_cache/';

// Who to consider a faculty
const FACULTY_TYPES = [ 'TaEnrollment', 'TeacherEnrollment'];

// var storage = {}; // Module object store for prefetched query results.

//******************** Data-Specific Get Functions ********************//
// Return cached objects, or null if no data cached for the given request.

function getCourseEnrollments(courseId) {
  const queryKey = `courses_${courseId}_enrollments`;
  return moduleCache.get(queryKey).json;
}

function getCourseSections(courseId) {
  const queryKey = `courses_${courseId}_sections`;
  return moduleCache.get(queryKey).json;
}

function getCourseModules(courseId) {
  const queryKey = `courses_${courseId}_modules`;
  return moduleCache.get(queryKey).json;
}

function getCourseAssignments(courseId) {
  const queryKey = `courses_${courseId}_assignments`;
  return moduleCache.get(queryKey).json;
}

function getFaculty() {
  const queryKey = `facultyUsers`;
  return moduleCache.get(queryKey).json;
}

function getUserAssignments(userId, courseId) {
  const queryKey = `users_${userId}_courses_${courseId}_assignments`;
  return moduleCache.get(queryKey).json;
}

//******************** Data-Specific Load Functions ********************//

function loadCourseEnrollments(courseId, callback) {
  const queryKey = `courses_${courseId}_enrollments`;
  const queryFunction = function(callback) {
    return canvasQuery.getCourseEnrollments(courseId, callback);
  }
  return moduleCache.loadQuery(queryKey, queryFunction, callback);
}

function loadCourseSections(courseId, callback) {
  const queryKey = `courses_${courseId}_sections`;
  const queryFunction = function(callback) {
    return canvasQuery.getCourseSections(courseId, callback);
  }
  return moduleCache.loadQuery(queryKey, queryFunction, callback);
}

function loadCourseModules(courseId, callback) {
  const queryKey = `courses_${courseId}_modules`;
  const queryFunction = function(callback) {
    return canvasQuery.getModules(courseId, callback);
  }
  return moduleCache.loadQuery(queryKey, queryFunction, callback);
}

function loadCourseAssignments(courseId, callback) {
  return moduleCache.loadQuery(
    `courses_${courseId}_assignments`,
    (callback) => { return canvasQuery.getAssignments(courseId, callback); },
    callback
  );
}

function loadFaculty(callback) {
  const queryKey = `facultyUsers`;
  const queryFunction = function(callback) {
    return buildFacultyList(callback);
  }
  return moduleCache.loadQuery(queryKey, queryFunction, callback);
}

function loadUserAssignments(userId, courseId, callback) {
  const queryKey = `users_${userId}_courses_${courseId}_assignments`;
  const queryFunction = function(callback) {
    return canvasQuery.getUserAssignments(userId, courseId, callback);
  }
  return moduleCache.loadQuery(queryKey, queryFunction, callback);
}


//******************** Functions to get All Faculty Users ********************//

/**
 * Build list of faculty users of the dashboard.
 * Assume that we've prefetched the term course enrollment lists.
 * 
 * callback signature: (err, facultyListJson) 
 */
function buildFacultyList(callback) {
  const termIds = appConfig.getTerms().map( e => e.course_id);
  var facultyList = [];   // Accumulate faculty user objects

  for (let courseId of termIds) {
    const enrollments = getCourseEnrollments(courseId);
    const facultyUsers = enrollments.filter( e => FACULTY_TYPES.includes(e.type));
    facultyList = facultyList.concat(facultyUsers);
  }
  facultyList.sort(compareEnrollees);
  return process.nextTick(callback, null, facultyList);
}


//******************** Helper Functions ********************//

function compareEnrollees(a, b) {
  /* Helper function for sorting an enrollee list. */
  var nameA = a.user.sortable_name;
  var nameB = b.user.sortable_name;
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0; // names must be equal
}


//******************** Exported Functions ********************//
exports.getCourseEnrollments = getCourseEnrollments;
exports.getCourseSections = getCourseSections;
exports.getCourseModules = getCourseModules;
exports.getCourseAssignments = getCourseAssignments;
exports.getFaculty = getFaculty;
exports.getUserAssignments = getUserAssignments;

exports.loadCourseEnrollments = loadCourseEnrollments;
exports.loadCourseSections = loadCourseSections;
exports.loadCourseModules = loadCourseModules;
exports.loadCourseAssignments = loadCourseAssignments;
exports.loadFaculty = loadFaculty;
exports.loadUserAssignments = loadUserAssignments;

