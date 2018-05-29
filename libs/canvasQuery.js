/* Module that wraps Canvas API queries.
01.10.2018 tps Created.
01.18.2019 tps Fix setting to show new assignments only to override section.
03.01.2018 tps Add query submissions by section and student.
05.17.2018 tps Add query for all course sections.
05.21.2018 tps Add query for quiz submissions & events.
05.23.2018 tps Implement adding Google or Critique assignments.
05.28.2018 tps Add query for user assignmnts by course.
*/

const canvasApi = require('./canvasApiTiny');

//******************** Constants ********************//
const FACULTY_TYPES = [ 'TaEnrollment', 'TeacherEnrollment'];


//******************** Canvas GET APIs ********************//

exports.getCourseFaculty = (courseId, callback) => {
  const endPoint = `courses/${courseId}/enrollments`;
  const params = {
    'type[]': FACULTY_TYPES
  };
  return canvasApi.get(endPoint, params, callback);
};


exports.getCourses = (callback) => {
  // Callback signature: ( err, <json data from Canvas>)
  let params = {
    'include[]': 'term'
  };
  return canvasApi.get('courses', params, callback);
};  // end export definition


exports.getCourseEnrollments = (courseId, callback) => {
  // Callback signature: ( err, <json data from Canvas>)
  let endpoint = `courses/${courseId}/enrollments`;
  let params = { };
  return canvasApi.get(endpoint, params, callback);
};


exports.getModules = (courseId, callback) => {
  // Callback signature: ( err, <json data from Canvas>)
  let endpoint = `courses/${courseId}/modules`;
  let params = {
    'include[]': 'items'
  };
  return canvasApi.get(endpoint, params, callback);
};


exports.getSection = (courseId, sectionId, callback) => {
  // Callback signature: ( err, <json data from Canvas>)
  let endpoint = `courses/${courseId}/sections/${sectionId}`;
  let params = {
    'include[]': 'students'
  };
  return canvasApi.get(endpoint, params, callback);
};

exports.getCourseSections = (courseId, callback) => {
  // Callback signature: ( err, <json data from Canvas>)
  let endpoint = `courses/${courseId}/sections`;
  let params = {
    // 'include[]': 'students'
  };
  return canvasApi.get(endpoint, params, callback);
};

exports.getAssignments = (courseId, callback) => {
  // Callback signature: ( err, <json data from Canvas>)
  let endpoint = `courses/${courseId}/assignments`;
  let params = {
    'include[]': 'overrides'
  };
  return canvasApi.get(endpoint, params, callback);
};

exports.getSectionSubmissions = (sectionId, callback) => {
  let endpoint = `sections/${sectionId}/students/submissions`;
  let params = {
    'student_ids[]': 'all',
    'grouped': true,
    'include[]': ['total_scores']
  };
  return canvasApi.get(endpoint, params, callback);
};

exports.getCourseSubmissions = (courseId, callback) => {
  let endpoint = `courses/${courseId}/students/submissions`;
  let params = {
    'student_ids[]': 'all'
  };
  return canvasApi.get(endpoint, params, callback);
};

exports.getStudentSubmissions = (sectionId, studentId, callback) => {
  let endpoint = `sections/${sectionId}/students/submissions`;
  let params = {
    'student_ids[]': studentId
  };
  return canvasApi.get(endpoint, params, callback);  
};

exports.getQuizSubmissionsForStudent = (courseId, quizId, studentId, callback) => {
  const endpoint = `courses/${courseId}/quizzes/${quizId}/submissions`;
  const params = {
    'as_user_id': studentId
  };
  return canvasApi.get(endpoint, params, (err, json) => {
    if (err) return callback(err);

  // Using masquerading to get submission for just one student, but 
  // depending on the user's permissions, we might get other students' submissions,
  // so filter for only the requested student's submissions.
  json[0].quiz_submissions = json[0].quiz_submissions.filter( e => e.user_id === studentId);
  // console.log(JSON.stringify(studentJson, null, 2));
  return callback(null, json);
  });  
};

exports.getQuizSubmissionEvents = (courseId, quizId, submissionId, callback) => {
  const endpoint = `courses/${courseId}/quizzes/${quizId}/submissions/${submissionId}/events`;
  return canvasApi.get(endpoint, {}, callback);  
};


exports.getUserAssignments = (userId, courseId, callback) => {
  const endpoint = `users/${userId}/courses/${courseId}/assignments`;
  params = {
    'include[]': ['overrides'] // Not sure if this includes override info, though
  }
  return canvasApi.get(endpoint, params, callback);
};

//******************** Canvas POST APIs  ********************//


//******************** Helper Functions ********************//
