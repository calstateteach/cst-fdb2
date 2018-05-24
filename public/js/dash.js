// Client-side script implementing dashboard behavior
// 04.24.2018 tps Created.
// 04.25.2018 tps Added crude callback system for indicating when data done loading.
// 05.21.2018 tps Revise for reorganization of Canvas courses for Summer 2018 term.

// Wait for DOM to load before trying to read dashboard framework data
document.addEventListener("DOMContentLoaded", initGlobals);

function initGlobals() {
  // Retrieve terms data from hidden page element & make it globally available to scripts
  window.CST = {};
  window.CST.terms = JSON.parse(document.getElementById('userTerms').innerText);
  window.CST.courseModules = JSON.parse(document.getElementById('courseModules').innerText);
  window.CST.facultyUser = JSON.parse(document.getElementById('facultyUser').innerText);
  window.CST.appLocation = document.getElementById('appLocation').innerText;
  window.CST.canvasBaseUrl = document.getElementById('canvasBaseUrl').innerText;

  // It's OK for the user to try loading the page data now
  loadSubmissions();
}

// Insert a column under observation assignments, right before last cell in row
function testAddColumn() {
  let termTable = document.getElementById('term_431');
  let cells = termTable.rows[0].cells;
  cells[cells.length -1].colSpan = 2;
  for (let i = 1; i < termTable.rows.length; ++i) {
    let cell = termTable.rows[i].insertCell(cells.length - 1);
    let text = document.createTextNode('new cell');
    cell.appendChild(text);
  }
}

// AJAX loading of submissions for each student
function loadSubmissions() {
  // Don't let user refresh data while it's already loading
  // const btn = document.getElementById("btnLoadData");
  // if (btn) {
  //   btn.disabled = true;
  // }

  // How many AJAX calls will it take to load the page?
  var  targetAjaxCount = 0;
  for (term of window.CST.terms) {
    for (student of term.students) {
      // Each student will take at least 3 calls:
      // - populate CE hours
      // - populate term course submissions
      // - populate iSupervision course submissions
      targetAjaxCount += 3;
      
      // If the term has a survey module, 2 more calls are needed
      if (term.survey_module) {
        targetAjaxCount += 2;
      }
    } // Loop through students
  } // Loop through terms

  // Only when all the AJAX calls have completed, enable the load button
  var ajaxCalls = 0;
  function ajaxDone() {
    ++ajaxCalls;
    if (ajaxCalls >= targetAjaxCount) {
      // if (btn) {
      //   btn.disabled = false;
      // }
    }
  }


  // alert('Found ' + window.terms.length + ' terms for this faculty member.');
  for (term of window.CST.terms) {
    for (student of term.students) {
      getSubmissionsByStudent(term.code, term.course_section_id, student.id, ajaxDone);
      getCeHours(term.code, student.id, ajaxDone);
      getISupeSubmissionsByStudent(student.iSupe_course_section_id, student.id, ajaxDone);
      getSurveySubmmissionsByStudent(term.code, student.id, ajaxDone);
    }
  }
}

function getSubmissionsByStudent(termCode, sectionId, studentId, done) {
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

        // Count submissions for each module
        const term = window.CST.terms.find( e => e.code === termCode);
        for (let module_index of term.module_indices) {

          // For survey modules we show quiz answers
          if (module_index === term.survey_module) {
            // TODO: get quiz answers

          // For normal modules, display the submission status summary
          } else {
            let module = window.CST.courseModules[term.course_id][module_index];
            let totalItems = module.items.length;
            let unsubmittedItems = 0;
            let gradedItems = 0;
            
            // Accumulate summary counts for submissions to the module
            for (let item of module.items) {
              if (item.type === "Assignment") {
                const submission = submissions.find(e => e.assignment_id === item.content_id);
                if (submission) {
                  const workflowState = submission.workflow_state;
                  if (workflowState === 'unsubmitted') ++unsubmittedItems;
                  if (workflowState === 'graded') ++gradedItems;
                }
              }
            }

            // Build text for module submissions summary
            const submittedItems = totalItems - unsubmittedItems;
            const linkText = gradedItems + '/' + submittedItems + ' reviewed'                       

            // Build URL to submission detail page
            const linkUrl = `./${window.CST.facultyUser.id}/course/${term.course_id}/section/${sectionId}/module/${module.id}/student/${studentId}`

            // Populate the DOM
            const tdId = `sec_${sectionId}_stu_${studentId}_mod_${module.id}`;
            const td = document.getElementById(tdId);
            td.innerHTML = `<A HREF="${linkUrl}">${linkText}</A>`;
          } // end loop through modules

          // Each term has a grade module with exactly 1 assignment
          const gradeModule = window.CST.courseModules[term.course_id][term.grade_module];
          const gradeAssignmentId = gradeModule.items[0].content_id;
          const gradeSubmission = submissions.find(e => e.assignment_id === gradeAssignmentId);
          const term_grade = gradeSubmission.grade;
          const term_score = gradeSubmission.score;
          const grade_label = term_grade ? `${term_grade} (${term_score})` : 'Not graded';
          // const speed_grader_url = `https://calstateteach.instructure.com/courses/${term.course_id}/gradebook/speed_grader?assignment_id=${gradeAssignmentId}#%7B%22student_id%22%3A%22${studentId}%22%7D`;
          const speed_grader_url = `${window.CST.canvasBaseUrl}courses/${term.course_id}/gradebook/speed_grader?assignment_id=${gradeAssignmentId}#%7B%22student_id%22%3A%22${studentId}%22%7D`;
              
          // Populate the DOM
          const gradeModuleDivId = `sec_${sectionId}_stu_${studentId}_mod_${gradeModule.id}`;
          const gradeDiv = document.getElementById(gradeModuleDivId);
          gradeDiv.innerHTML = `<A HREF="${speed_grader_url}" TARGET="_BLANK">${grade_label}</A>`;
        } // end else displaying submission status counts
        
        // updateTimeStamp(sectionId, studentId);  // But really should wait for all calls to finish?

      } else {
        logErrorInPage('There was a problem with the request getSubmissionsByStudent.\nRequest status:' + httpRequest.status);
        // alert('There was a problem with the request getSubmissionsByStudent.\nRequest status:' + httpRequest.status);
      }
      done();
    } // end request ready
  } // end request handler
} // end function


function getCeHours(termCode, studentId, done) {

  // Look up student's email
  const term = window.CST.terms.find( e => e.code === termCode);
  const studentObj = term.students.find ( e => e.id === studentId);
  const studentEmail = studentObj.login_id;
   
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    done();
    return false;
  }

  httpRequest.onreadystatechange = ceHoursHandler;
  httpRequest.open('GET', window.CST.appLocation + 'api/v0/cehours/' + studentEmail, true);
  httpRequest.send();

  function ceHoursHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        //- alert(httpRequest.responseText);

        // Response expected to be an array with 1 element.
        const ceHours = JSON.parse(httpRequest.responseText);
        
        var tdHtml = "No data";
        if (ceHours.length > 0) {
          const verifiedHours = ceHours[0].verified_hours;
          const totalHours = ceHours[0].total_hours;
          tdHtml = `${verifiedHours} verified<BR/>${totalHours} total`;
        }

        // Populate the DOM
        const tdId = `term_${termCode}_stu_${studentId}`;
        const td = document.getElementById(tdId);
        td.innerHTML = tdHtml;
      } else {
        // alert('There was a problem with the request getCeHours.\nRequest status:' + httpRequest.status);
        logErrorInPage('There was a problem with the request getCeHours.\nRequest status:' + httpRequest.status);
      }
      done();
    } // end request ready
  } // end request handler
} // end function

// function updateTimeStamp(sectionId, studentId) {
//   // Populate timestamp column with the current time. 
//   // TODO: Repace with a timestamp associated with cached data.
//   const tdId = `sec_${sectionId}_stu_${studentId}`;
//   const td = document.getElementById(tdId);
//   const timeString = (new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric',  hour12: true });
//   td.innerText = timeString;
// }


function getISupeSubmissionsByStudent(sectionId, studentId, done) {

  // Student may not be in an iSupervision section
  if (!sectionId) return done();
   
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    done();
    return false;
  }

  httpRequest.onreadystatechange = iSupeSubmissionByStudentHandler;
  httpRequest.open('GET', window.CST.appLocation + 'api/v0/sections/' + sectionId + '/students/' + studentId + '/submissions', true);
  httpRequest.send();

  function iSupeSubmissionByStudentHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        //- alert(httpRequest.responseText);
        var submissions = JSON.parse(httpRequest.responseText);

        for (let submission of submissions) {
          // Turn canvas state into CST terminology
          const workflow_state = submission.workflow_state;
          const statusLabel = (workflow_state === 'graded') ? 'reviewed' : workflow_state;

          // Populate the DOM
          const divId = `sec_${sectionId}_stu_${studentId}_ass_${submission.assignment_id}`;
          const div = document.getElementById(divId);
          if (div) {
            div.innerText = statusLabel;
          }
        } // end loop through submissions

      } else {
        // alert('There was a problem with the request getISupeSubmissionsByStudent.\nRequest status:' + httpRequest.status);
        logErrorInPage('There was a problem with the request getISupeSubmissionsByStudent.\nRequest status:' + httpRequest.status);
      }
      done();
    } // end request ready
  } // end request handler
} // end function

/**
 * Populate DOM with student's survey question answers, using AJAX.
 */
function getSurveySubmmissionsByStudent(termCode, studentId, done) {
  // Does the term in question even have any surveys?
  const term = window.CST.terms.find( e => e.code === termCode);
  if (term && term.survey_module) {
    const moduleItems = window.CST.courseModules[term.course_id][term.survey_module].items;
    const surveys = moduleItems.filter(e => e.type === 'Quiz');
    for (survey of surveys) {
      // console.log('found quiz', survey.content_id, 'in course', term.course_id, 'for student', studentId);
      // getQuizAnswer(term.course_id, survey.content_id, studentId, done);
      getQuizSubmissions(term.course_id, survey.content_id, studentId, done);
    }
  }
}

/**
 * Make AJAX call for a quiz answer.
 */
function getQuizAnswer(courseId, quizId, studentId, submissionId, done) {
   
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    done();
    return false;
  }

  httpRequest.onreadystatechange = quizAnswerHandler;
  httpRequest.open('GET', window.CST.appLocation + 'api/v0/courses/' + courseId + '/quizzes/' + quizId + '/submissions/' + submissionId + '/events', true);
  httpRequest.send();

  function quizAnswerHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        // - alert(httpRequest.responseText);

        // Should get back a structure like:
        // [ { quiz_submission_events: 
        //   [ [Event Object],
        //     [Event Object],
        //   ] } ]

        const quizEvents = JSON.parse(httpRequest.responseText)[0].quiz_submission_events;
 
        // Look for the last answer they gave
        var lastAnswer = null;
        for (quizEvent of quizEvents) {
          if (quizEvent.event_type === "question_answered") {
            lastAnswer = quizEvent;
          }
        }

        // Lookup the text associated with the answer they gave.
        var answerText = "No data"; // User might have not have submitted any answers.
        var canvasLink = null;      // Populate with link back to Canvas survey page.
        if (lastAnswer) {
          // Extract the IDs we'll need to interpret the user's answer.
          // Sometimes IDs are strings, sometimes they are integers...
          const quiz_question_id = parseInt(lastAnswer.event_data[0].quiz_question_id, 10);
          const answer_id        = parseInt(lastAnswer.event_data[0].answer, 10);

          // The answer_id can be null
          if (answer_id) {

            // Look for the quiz description in the 'submission_created' event, which is assumed to exist
            const submission_created = quizEvents.find( e => e.event_type === "submission_created");
            
            // Find the quiz question description
            const quiz_question = submission_created.event_data.quiz_data.find( e => e.id === quiz_question_id);

            // Find the text of the student's answer
            const answer = quiz_question.answers.find( e => e.id === answer_id);
            answerText = answer.text;

            // Create link back to survey answers in Canvas app
            // Need the quiz submission ID, which is not in the events log
            // canvasLink = `https://calstateteach.test.instructure.com/courses/${courseId}/quizzes/${quizId}/history?quiz_submission_id=${submissionId}`;
            canvasLink = `${window.CST.canvasBaseUrl}courses/${courseId}/quizzes/${quizId}/history?quiz_submission_id=${submissionId}`;
          } // end if answer_id is not null
        } // end if there is a quiz event

        // Populate the DOM
        const divId = `crs_${courseId}_quz_${quizId}_stu_${studentId}`;
        const div = document.getElementById(divId);
        if (div) {
          if (canvasLink) {
            div.innerHTML = `<A HREF="${canvasLink}" TARGET="_blank">${answerText}</A>`;
          } else {
            div.innerText = answerText;
          }
        }
      } else {
        // alert('There was a problem with the request getISupeSubmissionsByStudent.\nRequest status:' + httpRequest.status);
        logErrorInPage("There was a problem requesting the student's survey answer.\nRequest status:" + httpRequest.status);
      }
      done();
    } // end request ready
  } // end request handler
} // end function


/**
 * Make AJAX call for student's quiz submission.
 */
function getQuizSubmissions(courseId, quizId, studentId, done) {
   
  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    done();
    return false;
  }

  httpRequest.onreadystatechange = quizSubmissionsHandler;
  httpRequest.open('GET', window.CST.appLocation + 'api/v0/courses/' + courseId + '/quizzes/' + quizId + '/students/' + studentId + '/submissions', true);
  httpRequest.send();

  function quizSubmissionsHandler() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        // Extract the submission ID of the student's last submissions
        var quizSubmissions = JSON.parse(httpRequest.responseText)[0].quiz_submissions;

        // If there are no quiz submission for the student, we're done
        if (quizSubmissions.length <= 0 ) {

          // Populate the DOM
          const divId = `crs_${courseId}_quz_${quizId}_stu_${studentId}`;
          const div = document.getElementById(divId);
          if (div) {
            div.innerText = "No data";
          }
          done();
        } else {
          // Now that we know the quiz submission, we need to find the submission answer.
          // Students can take quizzes multiple times, but we're only interested in the last attempt.    
          const lastAttempt = quizSubmissions[quizSubmissions.length - 1];
          const submissionId = lastAttempt.id;          
          getQuizAnswer(courseId, quizId, studentId, submissionId, done)
        }
      } else {
        logErrorInPage("There was a problem requesting the student's survey submissions.\nRequest status:" + httpRequest.status);
        done();
      }
    } // end request ready
  } // end request handler
} // end function


function logErrorInPage(errText) {
  const errDiv = document.getElementById('divStatus');
  if (errDiv) {
    errDiv.innerText =+ "<BR/>" + errText;
  }
}


function showAddForm(courseId, addType, studentId) {
  // alert(`Post assignment goes here.\ncourseId: ${courseId}\naddType: ${addType}\nstudentId: ${studentId}`);

  // Modal add form behavior:
  // When the user clicks anywhere outside of the modal form, close it
  var modal = document.getElementById('addAssDiv');
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
 
  /* Populate data structure with default names for new iSupervision assignments,
  to make it easier for the Web page to suggest names for new assignments.

  Build a unique name for a new iSupervision assignment for each student.
  The name adds a numbered suffix to the specified user's email login ID.
  e.g. If user login is "abcdef@calstateteach.net", then assignment names
  look like "abcdef-1", "abcdef-2" etc.
  */
 
  // Make is easy to lookup existing assignment names
  const term = window.CST.terms.find( e => e.course_id === courseId);
  const student = term.students.find( e => e.id === studentId);
  const assignmentNames = student.assignment_overrides.map( e => { return e.name; });
 
  var loginName = student.login_id.split('@')[0];
  var defaultName = '';
  var n = 1;
  do {
    defaultName = loginName + '-' + n++;
  } while (assignmentNames.includes(defaultName));
  
  // Populate the add form with values we'll need to know when it's time to submit the add
  document.getElementById('assignmentName').value = defaultName;
  document.getElementById('courseId').value = term.iSupe_course_id;   // Add to iSupervision course
  document.getElementById('sectionId').value = student.iSupe_course_section_id;  // Add to student's section
  document.getElementById('addType').value = addType;

  // Use more specific label in add form
  const addTypeTxt = (addType === 'CritiqueIt') ? 'iSupervision' : 'Google Observation';
  const lblAdd = document.getElementById('lblAdd');
  lblAdd.textContent = 'Add ' + addTypeTxt + ' assignment with name:';

  // Display modal form
  document.getElementById('addAssDiv').style.display = 'block';
  document.getElementById('assignmentName').focus();
}


function submitAdd() {  

  // Gather the parameters we'll need to add the assignment
  const assignmentName = document.getElementById('assignmentName').value;
  const courseId = parseInt(document.getElementById('courseId').value, 10);
  const sectionId = parseInt(document.getElementById('sectionId').value, 10);
  const addType = document.getElementById('addType').value;

  const postString = 'courseId=' + courseId
    + '&sectionId=' + sectionId
    + '&assignmentName=' + encodeURIComponent(assignmentName)
    + '&addType=' + encodeURIComponent(addType);

  // alert(assignmentName + ', ' + courseId + ', ' + sectionId + ', ' + addType);
  // alert(postString);

  // Disable form so user can't add multiple assignments with the same name
  document.getElementById('btnSubmit').disabled = true;
  document.getElementById('btnCancel').disabled = true;

  // User submits assignment add.
  document.getElementById('waitMsg').style.visibility = "visible";


  var httpRequest = new XMLHttpRequest();
  if (!httpRequest) {
    alert('Giving up :( Cannot create an XMLHTTP instance');
    done();
    return false;
  }

  httpRequest.onreadystatechange = addAssignmentHandler;
  httpRequest.open('POST', window.CST.appLocation + 'api/v0/courses/' + courseId + '/assignments', true);
  httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  httpRequest.send(postString);


  function addAssignmentHandler() {
    if ((httpRequest.readyState === XMLHttpRequest.DONE) && (httpRequest.status === 200)) {
      var assignment = JSON.parse(httpRequest.responseText);
      // alert('Added assignment ' + assignment.id);
      location.reload();

        // Reset form
        // document.getElementById('btnSubmit').disabled = false;
        // document.getElementById('btnCancel').disabled = false;
        // document.getElementById('waitMsg').style.visibility = "hidden";
        // document.getElementById('addAssDiv').style.display = 'none';

    } // end request ready
  } // end request handler
}
