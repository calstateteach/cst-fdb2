/* Express Router for version 0 of public rest API.
This API provides unsecured access to Canvas assignment data for cross-domain AJAX clients.
06.06.2018 tps Created.

*/

const express     = require('express');
const router      = express.Router();
const canvasCache = require('../../libs/canvasCache');


/******************** Endpoint Handlers *********************/

/* Handle restful query for an assignment's prev/next assignment.
Returns JSON like:
{
  prev: 1408,
  next: 1410
}

If error, returns:
{ err: "error message goes here" }
*/
function assignmentNavigationHandler(req, res) {
  let courseId = parseInt(req.params['courseId'], 10);
  let assignmentId = parseInt(req.params['assignmentId'], 10);

  // Allow cross origin request
  res.set('Access-Control-Allow-Origin', '*');
  // res.set('Access-Control-Allow-Origin', 'https://calstateteach.test.instructure.com');


  // If no data found for the parameters, that's an error.
  function noDataErr() {
    const err = `No data found for course ${courseId}, assignment ${assignmentId}`;
    return res.json({ err: err});
  }

  const assignments = canvasCache.getCourseAssignments(courseId);
  if (assignments) {
    const assignmentIndex = assignments.findIndex( e => e.id === assignmentId);
    if (assignmentIndex < 0) {
      return noDataErr();
    } else {
      // Calculate prev & next assignments in the list. Navigation is circular.
      const prevId 
        = (assignmentIndex === 0) ? assignments[assignments.length - 1].id : assignments[assignmentIndex - 1].id;
      const nextId
        = (assignmentIndex === (assignments.length - 1)) ? assignments[0].id : assignments[assignmentIndex + 1].id;
    
      const nav = {
        prev: prevId,
        next: nextId
      }
      return res.json(nav);
    } // end else assignment navigation to figure out
  } else {  // If no data found for the parameters, that's an error.
    return noDataErr();
  }
}


/******************** Router Middleware *********************/


/******************** Endpoint URLs *********************/
router.get('/courses/:courseId/assignments/:assignmentId/nav', assignmentNavigationHandler);

exports.router = router;
