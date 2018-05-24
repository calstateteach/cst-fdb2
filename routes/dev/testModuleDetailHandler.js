/* Render module submissions page.
Refactored to shorten reponse time by only doing a live query for submissions for the target student.
03.01.2018 tps Created.
*/

const canvasCache = require('../../libs/canvasCache');
const canvasQuery = require('../../libs/canvasQuery');
const async = require('async');

//******************** Async steps to populate page data ********************//

function getSection(req, callback) {
  // Get the section containing the student of interest.
  var userId = parseInt(req.params['userId'], 10);
  var sectionId = parseInt(req.params['sectionId'], 10);

  // Filter faculty enrollments for the specified user.
  canvasCache.getFacultyList(req, true, (err, json) => {
    var userEnrollments = []; // Collection of faculty user's section enrollments

    // Get enrollment objects for the given user.
    enrollmentList = json.filter( e => (e.user_id === userId) && (e.course_section_id === sectionId));

    // Add enrollment objects to userEnrollments parameter array in place.
    // Should be only 1.
    enrollmentList.forEach( e => {
        userEnrollments.push(e);
    });

    // If the enrollmentList is still empty, we probably got an invalid
    // userId, so we can stop the proceedings right now.
    if (userEnrollments.length <= 0) {
      return callback(`No enrollment data found for user ID ${userId}. User might not be in any of the courses configured for the dashboard.`);
    }

    // Otherwise, pass it on.
    var dataBag = {
      userEnrollments: userEnrollments,
      req: req  // We need the request object so we can get to session cache, read off query parameters, etc.
    };
    return callback(null, dataBag);
  });
}

function addCourse(dataBag, callback) {
  // Add populated propeties of the related course object to each section
  // in the section list.
  let req = dataBag.req;
  let userEnrollments = dataBag.userEnrollments;

  canvasCache.getCourses(req, true, (err, courses) => {
    if (err) return callback(err);

    for ( let obj of userEnrollments) {
      var course = courses.find((e) => { return e.id === obj.course_id });

      // There are properties from the section's course that we want to display.
      // obj.course_name = course.name;
      obj.course = course;
    };
    return callback(null, dataBag);
  });
}

function addSectionStudents(dataBag, callback) {
  // Add students to the section.
  // There should be just 1 section of interest.
  let currentSection = dataBag.userEnrollments[0];
  let req = dataBag.req;

  canvasCache.getSection(
    req,
    currentSection.course_id,
    currentSection.course_section_id,
    true, 
    (err, json) => {
      if (err) return callback(err);

      // Populate current userEnrollments object, which represents a section,
      // with section data retrieved from Canvas API.
      // 02.07.2018 tps A section may have no students.
      currentSection.section_name = json[0].name;
      // currentSection.students = json[0].students;
      currentSection.students = json[0].students || [];

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
      currentSection.students.sort(compareStudents);

      return callback(null, dataBag);
    }); // end canvasCache call
}


function addModules(dataBag, callback) {
  // Loads modules lists for each course in the userEnrollments list.
  // There should be just 1 section of interest.
  let req = dataBag.req;
  let currentSection = dataBag.userEnrollments[0];

  canvasCache.getModules(
    req,
    currentSection.course_id,
    true, 
    (err, json) => {
      // Populate current userEnrollments object with the courses's modules.
      if (err) return callback(err);

      // Include only "Assignment" type items.
      for (module of json) {
        module.items = module.items.filter( e => e.type === 'Assignment' );
      }
      currentSection.modules = json;

      return callback(null, dataBag);
    }); // end canvasCache callback
}


function addAssignments(dataBag, callback) {
  // Load assignment lists for each course in the userEnrollments list.
  // There should be just 1 section of interest.

  let req = dataBag.req;
  let currentSection = dataBag.userEnrollments[0];

  canvasCache.getAssignments(
    req,
    currentSection.course_id,
    true,
    (err, json) => {
      // Populate current userEnrollments object with the courses's assignments.
      // This is more data than we need, though.
      if (err) return callback(err);

      currentSection.assignments = json;
      return callback(null, dataBag);
    }); // end canvasCache callback
}


function addSubmissions(dataBag, callback) {
  // Load assignment submissions for just the one student of interest.
  // There should be just 1 section of interest.
  let req = dataBag.req;
  let currentSection = dataBag.userEnrollments[0];
  let studentId = parseInt(req.params['studentId'], 10);

  // We always want to the most current student submissions data
  canvasQuery.getStudentSubmissions(
    currentSection.course_section_id,
    studentId,
    (err, json) => {
      if (err) return callback(err);

      // Find the corresponding student object in userEnrollments object.
      let targetStudent = currentSection.students.find(
        e => { return e.id === studentId; } );
      if (targetStudent) {

        // Gather submissions from student.
        // Make it easy to extract a submission object by assignment ID.
        let submissionsObj = {};
        for (let submission of json) {
          submissionsObj[submission.assignment_id] = submission;
        }
        targetStudent.submissions = submissionsObj;

        // // Gather student's total scores
        // targetStudent.computed_current_score = student.computed_current_score
        // targetStudent.computed_final_score = student.computed_final_score;

      } // end if adding submissions for a student.

      callback(null, dataBag);
    }); // end canvasCache callback
}


function addTermModules(dataBag, callback) {
  // Read module data for the terms
  let req = dataBag.req;
  req.app.locals.moduleMap.readJson( (err, json) => {
    if (err) callback(err);
    dataBag.cstTerms = JSON.parse(JSON.stringify(json));  // Copy the term map

    return callback(null, dataBag);
  });
}


function addTerms(dataBag, callback) {
  // Populate data structure with term that the target student is in.
  // Use external spreadsheet to look up term for each student.
  // Assumes term module mapping has already been loaded into the dataBag.
  let req = dataBag.req;
  let studentId = parseInt(req.params['studentId'], 10);
  let cstTerms = dataBag.cstTerms;

  // Find the target student in dataBag.
  // This student should exist in the collection
  let currentSection = dataBag.userEnrollments[0]; 
  let targetStudent = currentSection.students.find( e => e.id === studentId);

  req.app.locals.camData.readRows((err, statusCode, headers, rows) => {
    if (err) return callback(err);

    // Find student's term in the spreadsheet.
    // Student might not be in the spreadsheet.
    var term = rows.find( (e) => { return (e.email === targetStudent.login_id) });
    var termCode = term ? term.course : null;


    // We might not find a matching term if:
    // - The CAM data does not include a term code for the student.
    // - The CAM code does match one of the terms belonging to the course the student is
    // enrolled in. In this case, assign the student to the default term for the course.
    if (!termCode) {
      let targetTerm = cstTerms.find(
        (e) => { return e.default && (e.course_id === currentSection.course_id) });
      termCode = targetTerm.code;  // Fill in the default term for the module detail page.
    }

    targetStudent.cstTerm = termCode;

    return callback(null, dataBag);
  });
}

//******************** Exports ********************//

// Render module submissions page
exports.get = function get(req, res) {

  // Helper function so we can pass a parameter to 1st step in waterfall.
  function start(callback) {
    return getSection(req, callback);
  }

  // Helper function that renders page as the last step of the waterfall
  function render(err, result) {
    if (err) return res.render('dash/facultyDashErr', { 'err': err } );

    var params = {
      sections: result.userEnrollments,
      sectionId: parseInt(req.params.sectionId, 10),
      moduleId: parseInt(req.params.moduleId, 10),
      studentId: parseInt(req.params.studentId, 10),
      isDevMode: req.session.userAuthMethod === 'dev',    // Indicate whether user is logged in as developer.
      cstTerms: result.cstTerms,
      userRoles: req.session.fdb_roles                    // Page needs to know the user's role
    };
    return res.render('dash/studentModuleSubmissions', params);
  }

  async.waterfall([
    start,
    addCourse,
    addSectionStudents,
    addModules,
    addAssignments,
    addSubmissions,
    addTermModules,
    addTerms,
  ], 
  render);  
}
