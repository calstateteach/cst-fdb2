/* Router for faculty dashboard path.
05.23.2018 tps Refactored for AJAX version.
*/

const express = require('express');
const router = express.Router();

const protectCanvasData = require('./protectCanvasData');

// ******************** Helper Functions ********************//

function renderFacultyPage(req, res) {
  /* Helper callback function that renders dashboard page
  for a faculty member.
  */
  // Canvas ID of faculty member is passed in the URL
  var userId = parseInt(req.params['userId'], 10);
  protectCanvasData(req, res, userId, null, renderFacultyPageSecured);

} // end function renderFacultyPage



// ******************** Routing Functions ********************//

router.use(require('./secureDashMiddleware'));
router.get('/faculty/:userId', require('./dashHandler'));
router.get('/faculty/:userId/course/:courseId/section/:sectionId/module/:moduleId/student/:studentId', require('./moduleSubmissionsHandler'));

exports.router = router;
