/* Express Router for version 0 of rest API.
03.29.2018 tps Created to prototype AJAX call for student's submissions.
04.24.2018 tps Refined endpoint parmaeters.
TODO:
- Secure API
- Better error feedback
*/

const express     = require('express');
const router      = express.Router();
const canvasApi   = require('../../libs/canvasApiTiny');
const canvasQuery = require('../../libs/canvasQuery');
const canvasCache = require('../../libs/canvasCache');
const camApi      = require('../../libs/camApi');
const appConfig   = require('../../libs/appConfig');

/******************** Endpoint Handlers *********************/

/* Handle restful query for submissions for single student.
Returns JSON from live Canvas API call.
*/
function studentSubmissionsHandler(req, res) {
  let sectionId = parseInt(req.params['sectionId'], 10);
  let studentId = parseInt(req.params['studentId'], 10);
  canvasQuery.getStudentSubmissions(sectionId, studentId, (err, json) => {
    if (err) return res.send(err);   // TODO: Better error feedback
    return res.json(json);
  });
}

/**
 * Handle query for a student's CE hours totals.
 * Returns JSON from live CAM API call.
 */
function ceHoursHandler(req, res) {
  const emailAddress = req.params['emailAddress'];

  // Build CAM API query for 1 student.
  // Template string for CAM query expected to look like:
  // "https://cam.calstateteach.net/api/v1/c.php?method=ce_hours&header=1&term=spring&year=2018&user=${userEmail}&api_key=magickey"
  
  const camQuery = req.app.locals.CAM_CE_HOURS_URL.replace('${userEmail}', emailAddress);

  camApi.collectApiResults([camQuery], (err, data) => {
    if (err) return res.json({error: err});   // TODO: Better error feedback

    // Results come back as an array of ararys, but we're
    // only interested in the 1st item the 1st sub-array,
    // which looks like:
    // [ { last_name: 'John',
    // first_name: 'Doe',
    // email: 'abcdefg@calstateteach.net',
    // total_hours: '29',
    // verified_hours: '18' } ]

    // I suppose we could come back with no data
    return res.json((data.length > 0) ? data[0] : []);
  });
}

/**
 * Handle query for quiz submission event.
 * Returns JSON from CAM API call for a quiz submission
 */
function quizEventsHandler(req, res) {
  // Gather the parameters we need
  const courseId = parseInt(req.params['courseId'], 10);
  const quizId = parseInt(req.params['quizId'], 10);
  const submissionId = parseInt(req.params['submissionId'], 10);

  canvasQuery.getQuizSubmissionEvents(courseId, quizId, submissionId, (err, eventsJson) => {
    if (err) return res.json({ err:err });
    return res.json(eventsJson);
  }); // End callback for events query
}


/**
 * Handle query for quiz submission event.
 * Returns JSON from CAM API call for a quiz submission
 */
function quizSubmissionsHandler(req, res) {
  // Gather the parameters we need
  const courseId = parseInt(req.params['courseId'], 10);
  const quizId = parseInt(req.params['quizId'], 10);
  const studentId = parseInt(req.params['studentId'], 10);
  
  canvasQuery.getQuizSubmissionsForStudent(courseId, quizId, studentId, (err, json) => {
    if (err) return res.json({ err:err });
   return res.json(json);
  }); // End callback for submission query
}

/**
 * Add an assignment to Canvas. Returns JSON from CAM API call.
 * Handles either Google or CritiqueIt assignments.
 */
function postAssignmentHandler(req, res) {
  // Gather POST parameters
  const courseId       = parseInt(req.body['courseId'], 10);
  const sectionId      = parseInt(req.body['sectionId'], 10);
  const assignmentName = req.body['assignmentName'];
  const addType        = req.body['addType'];

  // console.log('postAssignmentHandler', courseId, sectionId, assignmentName, addType);

  // Create Canvas POST query specific to assignment type we're adding.

  let params;
  if (addType === 'CritiqueIt') {   // CritiqueIt assignment parameters
    params = {
      assignment: {
        name: assignmentName,
        grading_type: 'pass_fail',
        submission_types: ['external_tool'],
        published: true,
        only_visible_to_overrides: true,
        assignment_overrides: [{ course_section_id: sectionId }],
        external_tool_tag_attributes: {
          url: process.env.CST_CRITIQUEIT_LTI_URL,
          new_tab: true
        } // end external_tool_tag_attributes
      } // end assignment
    };  // end postParams      

  } else {   // Google assignment parameters
    // Google assignments need to be pre-populated with an assignment description
    const assignmentDescription = appConfig.getGoogleAssDesc;

    params = {
      assignment: {
        name: assignmentName,
        grading_type: 'pass_fail',
        submission_types: ['online_url'],
        published: true,
        description: assignmentDescription,
        assignment_overrides: [{ course_section_id: sectionId }],
        only_visible_to_overrides: true,
      }
    };
  }

  return canvasApi.post(`courses/${courseId}/assignments`, params, (err, newAssignmentJson) => {
    if (err) return res.json({err: err});
    // If add went OK, make sure the new add shows up in the cached list of assignments
    canvasCache.loadCourseAssignments(courseId, (err, assignmentsJson) => {
      if (err) return res.json({err: err});
      return res.json(newAssignmentJson);
    });
  });
}


/******************** Endpoint URLs *********************/
router.get('/sections/:sectionId/students/:studentId/submissions', studentSubmissionsHandler);
router.get('/cehours/:emailAddress', ceHoursHandler);
router.get('/courses/:courseId/quizzes/:quizId/submissions/:submissionId/events', quizEventsHandler);
router.get('/courses/:courseId/quizzes/:quizId/students/:studentId/submissions', quizSubmissionsHandler);

router.post('/courses/:courseId/assignments', postAssignmentHandler);

exports.router = router;
