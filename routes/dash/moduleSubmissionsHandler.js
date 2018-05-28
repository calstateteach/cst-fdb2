/* Render module submissions page.
05.23.2018 tps Start refactoring for AJAX calls 
05.26.2018 tps Pass server session data to page, for dev mode.
05.28.2018 tps Don't let user tamper with URL.
*/

const canvasCache = require('../../libs/canvasCache');
const appConfig   = require('../../libs/appConfig');


function get(req, res) {

  // Gather request parameters
  const userId    = parseInt(req.params.userId, 10);
  const courseId  = parseInt(req.params.courseId, 10);
  const sectionId = parseInt(req.params.sectionId, 10);
  const moduleId  = parseInt(req.params.moduleId, 10);
  const studentId = parseInt(req.params.studentId, 10);
  const isDevMode = req.session.userAuthMethod === 'dev';    // Indicate whether user is logged in as developer.
  const userRoles = req.session.fdb_roles;                    // Page needs to know the user's role
 
  // Don't let user tamper with URL to see another faculty member's page.
  const userIdSession = parseInt(req.session.custom_canvas_user_id, 10);
  if (userIdSession != userId) {
    res.redirect(req.app.locals.APP_URL + 'badRequest');
  }

  // We'll need the user's user object to display user info.
  const facultyEnrollments = canvasCache.getFaculty();
  const enrollments = facultyEnrollments.filter( e => e.user_id === userId);
  const facultyUser = enrollments[0].user;

  // Start building term object containing data for drawing the module detail page 
  const termObject = {
    course_section_id: sectionId
  };

  // Find data for term containing the student of interest.
  const terms = appConfig.getTerms();
  var term = terms.find( e => e.course_id === courseId);

  // Throw in configuration data for the term
  Object.assign(termObject, term);

  // Find the identity of the student of interest.
  const courseEnrollments = canvasCache.getCourseEnrollments(courseId);
  const studentEnrollment = courseEnrollments.find(
     e => (e.user_id === studentId) && (e.type === "StudentEnrollment")
  );
  termObject.students = [studentEnrollment.user];
 
  // Create object containing course modules, indexed by module IDs
  const courseModules = canvasCache.getCourseModules(courseId);
  const courseModulesObj = {};
  courseModulesObj[courseId] = courseModules;

  // Prepare to deliver data to the page template.
  // Use same data structures as for the dashboard summary page,
  // in the hope that we can then re-use some client-side Javacript code.

  const params = {
    isDevMode: isDevMode,
    userRoles: userRoles,
    user: facultyUser,
    userTerms: [termObject],
    courseModules: courseModulesObj,
    moduleId: moduleId,
    sessionData: req.session
  }
  // return res.render('dev/work', params);
  return res.render('dash/studentModuleSubmissions', params);
}


// ******************** Exports ********************//
module.exports = get;
