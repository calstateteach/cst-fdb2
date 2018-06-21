// Client-side script implementing module detail behavior
// 05.23.2018 tps Created.
// 06.20.2018 tps Use adapted module data to include quizzes that are assignments.

// Wait for DOM to load before trying to read dashboard framework data
document.addEventListener("DOMContentLoaded", initGlobals);

function initGlobals() {
  // Retrieve terms data from hidden page element & make it globally available to scripts
  window.CST = {};
  window.CST.terms = JSON.parse(document.getElementById('userTerms').innerText);
  window.CST.courseModules = JSON.parse(document.getElementById('courseModules').innerText);
  window.CST.appLocation = document.getElementById('appLocation').innerText;
  window.CST.canvasBaseUrl = document.getElementById('canvasBaseUrl').innerText;

  // It's OK for the user to try loading the page data now
  loadSubmissions();

}

// AJAX loading of submissions for each student
function loadSubmissions() {

  function ajaxDone() {
    // There's just one ajax call when the page loads  
  }

  // alert('Found ' + window.terms.length + ' terms for this faculty member.');
  for (term of window.CST.terms) {
    for (student of term.students) {
      getSubmissionsByStudent(term.course_id, term.course_section_id, student.id, ajaxDone);
    }
  }
}

function getSubmissionsByStudent(courseId, sectionId, studentId, done) {
  // alert(`section ID: ${sectionId}\nstudent ID: ${studentId}`);
   
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    done();
    return false;
  }

  httpRequest.onreadystatechange = studentsBySubmissionHandler;
  httpRequest.open('GET', window.CST.appLocation + 'api/v0/sections/' + sectionId + '/students/' + studentId + '/submissions', true);
  httpRequest.send();

  function studentsBySubmissionHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        //- alert(httpRequest.responseText);
        var submissions = JSON.parse(httpRequest.responseText);

        // TODO: handle data error in response.
        // alert(`AJAX call returned.\nSection ID ${sectionId}\nStudent ID ${studentId}\nSubmissions count: ${submissions.length}`);

        // We need to lookup an assignment's title later, so build
        // a collection containing all the assignment objects.
        const courseItems = [];
        const courseModules = window.CST.courseModules[courseId];
        for (let courseModule of courseModules) {
          for (let moduleItem of courseModule.items) {
            courseItems.push(moduleItem);
          }
        };
        // const courseAssignments = courseItems.filter( e => e.type === 'Assignment');
        const courseAssignments = courseItems.filter( e => e.type === 'Gradeable');

        for (submission of submissions) {

          // Look for a TD in the page to display the submission
          const tdId = `sec_${sectionId}_ass_${submission.assignment_id}_stu_${studentId}`;
          const td = document.getElementById(tdId);
          if (td) {
            // Translate workflow state to CST-terminology
            var workflow_state = submission.workflow_state;
            workflow_state = (workflow_state === 'graded') ? 'reviewed' : workflow_state;

            // Create link back to Canvas app
            // var link = `https://calstateteach.instructure.com/courses/${courseId}/gradebook/speed_grader?assignment_id=${submission.assignment_id}#%7B%22student_id%22%3A%22${studentId}%22%7D`;
            var link = `${window.CST.canvasBaseUrl}courses/${courseId}/gradebook/speed_grader?assignment_id=${submission.assignment_id}#%7B%22student_id%22%3A%22${studentId}%22%7D`;
          
            //- 05.11.2018 tps Special handling: If a Term 1 or Term 1B assignment is called "Activity 4.05",
            //- send user to special assignment URL instead of to the speed grader.
            // const submissionAssignment = courseAssignments.find( e => e.content_id === submission.assignment_id);
            const submissionAssignment = courseAssignments.find( e => e.assignment_id === submission.assignment_id);
            if ([ 197, 199 ].includes(courseId) && (submissionAssignment.title === "Activity 4.05")) {
              // link = `https://calstateteach.instructure.com/courses/206/assignments/3984`;
              link = `${window.CST.canvasBaseUrl}courses/206/assignments/3984`;
            }
 
            td.innerHTML = `<A HREF="${link}" TARGET="_BLANK">${workflow_state}</A>`;
          } // end if found TD to put submission into
        } // end loop through submissions
      } else {
        logErrorInPage('There was a problem requesting submission data from Canvas.\nRequest status:' + httpRequest.status);
      }
      done();
    } // end request ready
  } // end request handler
} // end function


function logErrorInPage(errText) {
  const errDiv = document.getElementById('divStatus');
  if (errDiv) {
    errDiv.innerText =+ "<BR/>" + errText;
  }
}