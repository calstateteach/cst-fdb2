/* Module containing functions that render assignments URL page.
Experiment to see if this table can be used to automate
creation of configuration data for redirect LTI.
05.19.2018 tps Created.
06.29.2018 tps Imported into fdb2 from older version. Refactored to use
               synchronous calls for data from cache.
*/
// const async = require('async');
const appConfig   = require('../../libs/appConfig');
const canvasCache = require('../../libs/canvasCache');


function get(req, res) {

  // List of term courses
  // const terms = req.app.locals.moduleMap.json.map( e => {
  //   return {
  //     name: e.name,
  //     courseId: e.course_id
  //   };
  // });

  // Collect all assignment URLs for the term courses into an object.
  // Each element of the collection is an object representing one
  // assignment, identified by its name.
  // Each element has an object with a property indexed by course ID,
  // whose value is the assignment URL for that course.
  // So all the urls for assignments with the same name across courses
  // are collected in the same object.
  // The object structure looks like:
  // {
  //  name: <assignment name>,
  //  urls: <object>
  // }

  const terms = appConfig.getTerms();
  var courseAssignments = [];

  for (let term of terms) {

    // We're just interested in the assignment name and URL of each assignment
    const assignments = canvasCache.getCourseAssignments(term.course_id).map( e => {
      return {
        name: e.name,
        url: e.html_url
      };
    });

    for( let assignment of assignments) {
      // See if we've already stashed an assignment object for this assignment name
      var stashedAssignment = courseAssignments.find( e => e.name === assignment.name);

      // If we haven't an object with this assignment name yet, make one and stash it.
      if (!stashedAssignment) {
        stashedAssignment = {
          name: assignment.name,
          url: {}
        };
        courseAssignments.push(stashedAssignment);
      }

      // Add the course's assignment URL to the collection
      stashedAssignment.url[term.course_id] = assignment.url;
    } // end loop through course's assignments
  } // end loop through terms

  // Send extracted assignment names & URLs to be rendered
  const params = {
    terms: terms,
    courseAssignments: courseAssignments
  };
  return res.render('dev/assignmentRedirectUrls', params);
}

  

//   function iteratee(courseId, callback) {
//     // callback signature: (err)
//     canvasCache.getCourseAssignments(req, courseId, true, (err, json) => {
//       if (err) return callback(err);

//       // We're just interested in the assignment name and URL
//       const assignments = json.map( e => {
//         return {
//           name: e.name,
//           url: e.html_url
//         };
//       });

//       for( let assignment of assignments) {
//         // See if we've already stashed an assignment object for this assignment name
//         var stashedAssignment = courseAssignments.find( e => e.name === assignment.name);

//         // If we haven't an object with this assignment name yet, make one and stash it.
//         if (!stashedAssignment) {
//           stashedAssignment = {
//             name: assignment.name,
//             url: {}
//           };
//           courseAssignments.push(stashedAssignment);
//         }

//         // Add the course's assignment URL to the collection
//         stashedAssignment.url[courseId] = assignment.url;
//       } // end loop through course's assignments
      
//       return callback();
//     }); // end canvas cache callback
//   } // end async iteratee function definition

//   function doneIterating(err) {
//     if (err) return res.render('dev/err', { err: err });
//     const params = {
//       terms: terms,
//       courseAssignments: courseAssignments
//     };
//     return res.render('dev/assignmentUrls', params);
//   }

//   async.eachSeries(terms.map( e => e.courseId), iteratee, doneIterating);
// }


//******************** Exports ********************//

exports.get = get;
