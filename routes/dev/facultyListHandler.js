/* Handler function to render faculty list page.
08.24.2017 tps Created.
08.26.2017 tps Handle errors from canvasEntities.
01.09.2018 tps Try using a shared disk cache for Canvas data.
02.14.2018 tps Add filterEnrollmentsByType() helper function from obsolete canvasEntities.js.
02.19.2018 tps Now that non-dev users can view faculty list, pass role to page templates.
05.16.2018 tps Use refactored module cache for faculty list.
*/

const canvasCache = require('../../libs/canvasCache');

// ******************** Constants ********************//


function get(req, res) {
  const facultyList = canvasCache.getFaculty();

  // Filter into Teacher & TA lists
  var renderDictionary = {
    teachers: filterEnrollmentsByType(facultyList, 'TeacherEnrollment'),
    tas: filterEnrollmentsByType(facultyList, 'TaEnrollment'),
    userRoles: req.session.fdb_roles
  };
  res.render('dev/facultyList', renderDictionary );
}


// ******************** Helper Functions ********************//

filterEnrollmentsByType = (enrollmentList, enrollmentType) => {
  /* Extract unique users from enrollment list, filtered by type.
  */
  var filteredList = [];
  for (let o of enrollmentList) {
    if (o.type === enrollmentType) {

      // Don't add duplicate users to list
      if (!filteredList.find((e) => { return e.id === o.user_id } )) {
        filteredList.push(o.user);
      }
    }
  }
  return filteredList;
};


// ******************** Export module as a function ********************//
module.exports = get;