/* Refactoring of faculty dashboard.
Use pre-fetched data to populate each term's student list, modules & iSupervision assignments.
Use AJAX to fill in student submissions & assignment status.

This module populates data structures optimized for laying out the faculty user's courses.
Main collection is userTerms array. Each element describes structure of one of the
courses the faculty user teaches.

TODO:
- Secure page data from tampering with user ID in URL.

04.21.2018 tps Created.
05.17.2018 tps Refactor without async calls, using already cached data.
05.23.2018 tps Pass add permissions to the page template.
05.26.2018 tps Pass session data to page for dev mode.
05.28.2018 tps Prevent user from tampering with URL to get to another faculty member's dashboard.
05.28.2018 tps Try retrieving iSupervision assignments by user to speed up refersh after adding an assignment.
*/

// ******************** Module Imports ********************//
const appConfig   = require('../../libs/appConfig');
const canvasCache = require('../../libs/canvasCache');


// ******************** Constants ********************//
// const FACULTY_TYPES = [ 'TaEnrollment', 'TeacherEnrollment'];

function get(req, res) {

  // Gather request parameters
  const userId = parseInt(req.params['userId'], 10);
  const isDevMode = req.session.userAuthMethod === 'dev';    // Indicate whether user is logged in as developer.
  const userRoles = req.session.fdb_roles;                    // Page needs to know the user's role

  // Don't let faculty user tamper with URL
  const userIdSession = parseInt(req.session.custom_canvas_user_id, 10);
  if ((req.session.userAuthMethod === 'lti') && (userIdSession != userId)) {
    return res.redirect(req.app.locals.APP_URL + 'badRequest');
  }

  /**
   * Initialize array containing faculty user's term courses.
   * We should end up with one array item for each
   * term course the faculty user is enrolled in.
   */
  const terms = appConfig.getTerms();
  const facultyEnrollments = canvasCache.getFaculty();
  var userTerms = [];

  for (let term of terms) {

    // If faculty user is enrolled in term course, 
    // add an object for the term to the userTerms collection.
    const courseEnrollments = facultyEnrollments.filter(
       e => (e.user_id === userId) && (e.course_id === term.course_id)
    );
    
    if (courseEnrollments.length > 0) {
      const courseEnrollment = courseEnrollments[0];
      const termObject = {
        course_section_id: courseEnrollment.course_section_id
      };
      // Throw in configuration data for the term
      Object.assign(termObject, term);

      userTerms.push( termObject );
    }
  }

  // If the enrollmentList is empty, we probably got an invalid
  // userId, so we can stop the proceedings right now.
  if (userTerms.length <= 0) {
    const s = `No enrollment data found for user ID ${userId}. User might not be in any of the courses configured for the dashboard.`;
    return res.render('dash/facultyDashErr', { 'err': s } );
  }
   
  // We'll need the user's user object to display user info.
  const enrollments = facultyEnrollments.filter( e => e.user_id === userId);
  const user = enrollments[0].user;

  /**
   * Gather the students in each of the user's sections.
   */
  for(let enrollment of userTerms) {
    const sectionEnrollments = canvasCache.getCourseEnrollments(enrollment.course_id);
    const studentEnrollments = sectionEnrollments.filter(
       e => (e.course_section_id === enrollment.course_section_id) && (e.type === "StudentEnrollment")
    );
    
    // We just want the students' user objects
    const cachedStudents = studentEnrollments.map( e => e.user);

    // We're going to add properties to these student objects,
    // so use copies of them, so we don't sully the cached versions.
    var students = cachedStudents.map( e => Object.assign( {}, e));

    // Populate current enrollment object, which represents a section,
    // with students in the section. A section may have no students.
    enrollment.students = students;

    // Canvas does't return a sorted student list

    function compareStudents(a, b) {
      // Helper function for sorting an enrollee list.
      var nameA = a.sortable_name;
      var nameB = b.sortable_name;
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;     // names must be equal
    }
    enrollment.students.sort(compareStudents);
  }
  
  /**
   * Populate the iSupervision course assignments for each student.
   * The student's iSupervision section can be looked up in their iSupervision course enrollment.
   */
  for (let termCourse of userTerms) {
    const iSupeCourseId = termCourse.iSupe_course_id;

    // Canvas data we'll need to search
    const iSupeEnrollments  = canvasCache.getCourseEnrollments(iSupeCourseId);
    const iSupeAssignments  = canvasCache.getCourseAssignments(iSupeCourseId);

    for (let student of termCourse.students){

      // Lookup the student's section in the iSupervision course
      const studentEnrollments = iSupeEnrollments.filter(
        e => (e.user_id === student.id) && (e.course_id === iSupeCourseId)
      );

      // We're interested in the section ID.
      // The student may not be enrolled in an iSupervision course
      const iSupeSectionId = studentEnrollments[0] ? studentEnrollments[0].course_section_id : null;
      
      // Collect any assignment overrides for this section
      var assOverrides = [];
      if (iSupeSectionId) {
        assOverrides = canvasCache.getUserAssignments(student.id, iSupeCourseId);
        
        // This particular Canvas query includes more assignments than we really want,
        // so try this to see only assignment overrides:
        assOverrides = assOverrides.filter( e => e.only_visible_to_overrides);

        // assOverrides = iSupeAssignments.filter(
        //   e => e.has_overrides && e.overrides.find( override => override.course_section_id === iSupeSectionId)
        // );
      }

      // Store the data we've collected
      student.iSupe_course_id = iSupeCourseId;
      student.iSupe_course_section_id = iSupeSectionId;
      student.assignment_overrides = assOverrides;

    } // end loop through students
  } // end loop through term courses

  // Help the rendering template by including the maximum number of iSupervision
  // assignments per students for each term.
  for (let termCourse of userTerms) {
    var maxAssCount = 0;
    for (let student of termCourse.students) {
      const assCount = student.assignment_overrides.length;
      maxAssCount = (assCount > maxAssCount) ? assCount : maxAssCount;
    } // end loop through term students
    termCourse.maxAssignmentCount = maxAssCount;
  } // end loop through terms

  /**
   * Populate a course modules collection containing module, assignment & quiz
   * data for each course the faculty teaches.
   * The collection is indexed by the canvas course ID.
   */
  var courseModules = { }; // Initialize collection to hold modules, indexed by course ID.
  for (let courseId of userTerms.map(e => e.course_id)) {
    // We're going to manipulate the modules collection, so use a copy   
    const modules = JSON.parse(JSON.stringify(canvasCache.getCourseModules(courseId)));

    // Include only "Assignment" & "Quiz" items.
    for (module of modules) {
      module.items = module.items.filter( e => ['Assignment', 'Quiz'].includes(e.type));
    }
    courseModules[courseId] = modules;
  }
  
  // Prepare to deliver data to the page template.
  const params = {
    isDevMode: isDevMode,
    userRoles: userRoles,
    user: user,
    userTerms: userTerms,
    courseModules: courseModules,
    addConfig: appConfig.getAdds(),
    sessionData: req.session
  }
  return res.render('dash/facultyDash', params);
  // return res.render('dev/work', params);
}

// ******************** Exports ********************//
module.exports = get;