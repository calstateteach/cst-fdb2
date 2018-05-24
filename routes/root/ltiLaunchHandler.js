/* Route handler for LTI launch request.
08.25.2017 tps Created.
08.31.2017 tps Fixed validation bug caused by reading wrong launch URL from .env.
11.30.2017 tps Select page for user based on their role.
12.29.2017 tps Send faculty user to wait page instead of directly to dashboard. 
02.18.2018 tps Add redirect for a faculty admin user.
05.17.2018 tps Redirect based on validating user in CAM.
05.18.2018 tps Add routing to show post parameters, for debugging.
05.18.2018 tps Add routing logic for students.
*/

const async = require('async');
const camApi = require('../../libs/camApi');
var isValidRequest = require('../../libs/oauthHelper').validateLtiRequest;
const canvasCache = require('../../libs/canvasCache');

function launchLti(req, res) {
  // Landing page for an LTI launch request.

  // Get rid of any existing session data for this client.
  req.session.regenerate( (err) => {
    if (err) {
      return res.render('dev/err', { 'err': err } );
    }

    // Not sure what we'll need, so just grab everything in the
    // signed POST request.
    Object.assign(req.session, req.body);

    // Flag the method used to authorize the session user.
    req.session.userAuthMethod = 'lti';

    // Save some stuff to a session for the client if we can validate the request.
    // if (isValidRequest('POST', process.env.CST_CRITIQUEIT_LTI_URL, req.body)) {
    if (isValidRequest('POST', process.env.CST_LTI_LAUNCH_URL, req.body)) {

      // Extract stuff we're interested in from the POST.
      const refererQueryParams = extractQueryParams(req.headers['referer']);
      const refererDestination = refererQueryParams['destination'];
      const refererRoute       = refererQueryParams['route'];
      const emailLogin         = req.body['custom_canvas_user_login_id'];
      const canvasUserId       = parseInt(req.body['custom_canvas_user_id'], 10);

      // Reveal POST data for testing
      if (refererRoute == 'showpost') {
        return postParamsHandler(req, res);
      }

      // 05.17.2018 tps Use CAM data to determine user's role.
      if (!emailLogin) return res.render('dev/err', { err: "No email login found in LTI post."});
      const camUrl = req.app.locals.CAM_USER_SEARCH_URL.replace('${userEmail}', emailLogin);
      camApi.collectApiResults([camUrl], (err, results) => {

        // Error out if we can't look up the user in CAM.
        if (err) return res.render('dev/err', { err: err});
        if (results.length <= 0) {
          return tryTestStudent(req, res, emailLogin);
          // return res.render('dev/err', { err: "No user data found for " + emailLogin + " in CAM."});
        }

        // Redirect user based on their role. Results are in an array of arrays.
        const camUser = results[0][0];
        const userType = camUser.user_type;
        if (userType ==='Faculty') {
          // Send user to their faculty dashboard page.
          return res.redirect(`dash/facultyPleaseWait/${req.body.custom_canvas_user_id}`);
        } else if (userType === 'Student') {
          return redirectStudent(req, res, camUser.course);
        } else {
          return res.render('dev/err', { err: "No redirect found for the CAM user type of " + userType});
        }
      });


      // // Redirect user based on their role
      // var roles = req.body.custom_canvas_membership_roles.split(',');
      // req.session.fdb_roles = roles;

      // // Temporarily view session data instead of error message
      // //res.redirect('sessionData');

      // if (roles.includes('CST-Admin')) {
      //   // Send faculty admin user to faculty list page
      //   res.redirect('dev/facultyList');
      // } else if (roles.includes('TeacherEnrollment')) {
      //   // Send user to their faculty dashboard page.
      //   res.redirect(`dash/facultyPleaseWait/${req.body.custom_canvas_user_id}`);
      //   // res.redirect(`dash/pleaseWait?redirectUrl=${req.app.locals.APP_URL}dash/faculty/${req.body.custom_canvas_user_id}`);
      // } else if (roles.includes('StudentEnrollment')) {
      //   // Resend the post to the CE hours web app
      //   res.redirect(307, process.env.CST_STUDENT_URL);
      // } else {
      //   res.render('dev/err', { err: "No redirect found for the Canvas user's role."});
      // }

    } else {
      res.redirect('badRequest');
    }
  });
}

//************************* Route Handling Functions *************************

function postParamsHandler(req, res) {
  params = {
    originalUrl: req.originalUrl,
    body: req.body,
    reqHeaders: req.headers,
    query: req.query
  };
  return res.render('dev/showpost', params);
}

/**
 * Send student user to iSupervision course assignments in Canvas
 */
function redirectStudent(req, res, code) {
  // Find CAM course's corresponding iSupervision course
  const matchingTerms = req.app.locals.moduleMap.json.filter( e => e.code === code);
  if (matchingTerms.length > 0) {
    const courseId = matchingTerms[0].iSupe_course_id;
    const redirectUrl = `https://calstateteach.instructure.com/courses/${courseId}/assignments`;
    return res.redirect(redirectUrl);
  } else {
    return res.render('dev/err', { err: 'Did not find iSupervision course for term code: ' + code });
  }

//   // List all available iSupervision courses.
//   var iSupeCourseIds = req.app.locals.moduleMap.json.map( e => e.iSupe_course_id);

//   // Remove duplicate iSupervision courses
//   iSupeCourseIds = new Set(iSupeCourseIds);

//   // Iteratee function to search iSupervision courses for the student's enrollment
//   function isInCourse(courseId, callback) {
//     canvasCache.getCourseEnrollments(req, courseId, true, (err, json) => {
//       if (err) return callback(err);
//       const enrollments = json.filter(
//         e => (e.user_id === userId) && (e.type === 'StudentEnrollment')
//       );
//       return callback(null, enrollments.length > 0);
//     });
//   }

//   // If the user is in one of the iSupervision courses, redirect them.
//   async.filter(iSupeCourseIds, isInCourse, (err, results) => {
//     if (err) return res.render('dev/err', { err: err });
//     if (results.length > 0) {
//       const redirectUrl = `https://calstateteach.instructure.com/courses/${results[0]}/assignments`;
//       return res.redirect(redirectUrl);
//     } else {
//       return res.render('dev/err', { err: 'Unable to find iSupervision course for Canvas user ID ' + userId });
//     }
//  }); // end async filter
}


/**
 * Try to discover if a given email login correponds to a test student in CAM.
 * We have a test student if:
 * - email address starts with a 'c'.
 * - email address minus the initial 'c' resolves to a faculty user in CAM.
 * If so, redirect them to the iSupervision Term 1 course assignments page.
 */
function tryTestStudent(req, res, emailLogin) {
  if (!emailLogin.startsWith('c')) {
    return res.render('dev/err', { err: "No user data found for " + emailLogin + " in CAM."});
  }

  const possibleFacultyEmail = emailLogin.substring(1);
  const camUrl = req.app.locals.CAM_USER_SEARCH_URL.replace('${userEmail}', possibleFacultyEmail);
  camApi.collectApiResults([camUrl], (err, results) => {

    // Error out if we can't look up the user in CAM.
    if (err) return res.render('dev/err', { err: err});
    if (results.length < 1) {
      return res.render('dev/err', { err: "Failed to identify " + emailLogin + " as a test student." });
    }

    // See if we found a corresponding faculty user. Results are in an array of arrays.
    const camUser = results[0][0];
    const userType = camUser.user_type;
    if (userType ==='Faculty') {
      // Send user to iSupervision Term 1 course assignments.
      return res.redirect("https://calstateteach.instructure.com/courses/206/assignments");
    } else {
      return res.render('dev/err', { err: "Failed to identify " + emailLogin + " as a test student." });
    }
  });
}


//************************* Helper Functions *************************

/**
 * Simple-minded function to extract query parameters at the
 * end of a referer URL into properties of an object.
 **/
function extractQueryParams(url) {
  var retObj = {};
  if (!url) return retObj; // I got nuthin'
  var queryString = url.split('?')[1];
  var queryPairs = queryString.split('&');
  for (pair of queryPairs) {
    var param = pair.split('=');
    retObj[param[0]] = param[1];
  }
  return retObj;
}

//************************* Module Exports *************************
module.exports = launchLti;
