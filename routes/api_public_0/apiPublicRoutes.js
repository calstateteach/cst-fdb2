/* Express Router for version 0 of public rest API.
This API provides unsecured access to Canvas assignment data for cross-domain AJAX clients.
06.06.2018 tps Created.

*/

const express     = require('express');
const router      = express.Router();
const appConfig   = require('../../libs/appConfig');
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

  // Allow cross origin request so Canvas Web page to call this with AJAX.
  res.set('Access-Control-Allow-Origin', '*');
  // res.set('Access-Control-Allow-Origin', 'https://calstateteach.test.instructure.com');

  // If no data found for the parameters, that's an error.
  function noDataErr() {
    const err = `No data found for course ${courseId}, assignment ${assignmentId}`;
    return res.json({ err: err});
  }

  // Use the same set of assignments as the faculty dashboard
  const terms = appConfig.getTerms();
  const courseConfig = terms.find( e => e.course_id === courseId);
  if (!courseConfig) return noDataErr();

  const modules = canvasCache.getCourseModules(courseId);
  if (!modules) return noDataErr();

  var assignmentIds = [];   // Accumulate ordered list of assignments as used by the dashboard

  for (let moduleIndex of courseConfig.module_indices) {
    const assignments = modules[moduleIndex].items.filter( e => e.type === 'Assignment');
    assignmentIds = assignmentIds.concat(assignments.map( e => e.content_id));
  }

  const assignmentIndex = assignmentIds.findIndex( e => e === assignmentId);
  if (assignmentIndex < 0) {
    return noDataErr();
  } else {
    // Calculate prev & next assignments in the list. Navigation is circular.
    const prevId 
      = (assignmentIndex === 0) ? assignmentIds[assignmentIds.length - 1] : assignmentIds[assignmentIndex - 1];
    const nextId
      = (assignmentIndex === (assignmentIds.length - 1)) ? assignmentIds[0] : assignmentIds[assignmentIndex + 1];
  
    const nav = {
      prev: prevId,
      next: nextId
    }
    return res.json(nav);
  }

  // const assignments = canvasCache.getCourseAssignments(courseId);
  // if (assignments) {
  //   const assignmentIndex = assignments.findIndex( e => e.id === assignmentId);
  //   if (assignmentIndex < 0) {
  //     return noDataErr();
  //   } else {
  //     // Calculate prev & next assignments in the list. Navigation is circular.
  //     const prevId 
  //       = (assignmentIndex === 0) ? assignments[assignments.length - 1].id : assignments[assignmentIndex - 1].id;
  //     const nextId
  //       = (assignmentIndex === (assignments.length - 1)) ? assignments[0].id : assignments[assignmentIndex + 1].id;
    
  //     const nav = {
  //       prev: prevId,
  //       next: nextId
  //     }
  //     return res.json(nav);
  //   } // end else assignment navigation to figure out
  // } else {  // If no data found for the parameters, that's an error.
  //   return noDataErr();
  // }
}


/******************** Router Middleware *********************/


/******************** Endpoint URLs *********************/
router.get('/courses/:courseId/assignments/:assignmentId/nav', assignmentNavigationHandler);

exports.router = router;
