/* Module that builds a version of the course modules JSON that is convenient
for the dashboard & assignment navigation API to use.
Problem is that the Canvas modules API doesn't give us enough detail to determine
if a quiz is an assignment type or survey type. We would like to treat assigment quizzes
as assignments.

Assumes that modules & quizzes data have already been retrieved & cached.

06.19.2018 tps Created.
*/

const canvasCache = require('./canvasCache');

function build(courseId, callback) {
  // Callback signature: (err, json)
  
  var json = [];  // Populate with adapted version of modules data
  const modules = canvasCache.getCourseModules(courseId);
  const quizzes = canvasCache.getCourseQuizzes(courseId);
  
  // console.log("courseId", courseId, modules.length, quizzes.length);

  for (let module of modules) {
    
    // Populate a new module object from the existing one.
    const newModule = {
      id:         module.id,
      name:       module.name,
      position:   module.position,
      published:  module.published,
      has_survey: false,
      items_count: 0,
      items_url:  module.items_url,
      items:      []
    };

    // Populate the module's item collection
    for (let item of module.items) {

      if (item.type === "Assignment") {
        // Add an assignment item
        const newItem = {
          "id":           item.id,
          "title":        item.title,
          "position":     item.position,
          "indent":       item.indent,
          "type":         "Gradeable",
          "assignment_id":item.content_id,
          "quiz_id":      null,
          "module_id":    item.module_id,
          "html_url":     item.html_url,
          "page_url":     item.page_url,
          "url":          item.url,
          "published":    item.published
        };
        
        newModule.items.push(newItem);
        ++newModule.items_count; 

      } else if (item.type ==='Quiz') {
        // There are different types of quizzes.
        // Assignment quizzes should be treated like assignments.
        // Survey quizzes should be treated like surveys.

        const quiz = canvasCache.getCourseQuizzes(courseId).find( e => e.id === item.content_id);

        if (quiz && (quiz.quiz_type === 'assignment')) { 
          const newItem = {
            "id":           item.id,
            "title":        item.title,
            "position":     item.position,
            "indent":       item.indent,
            "type":         'Gradeable',
            "assignment_id":quiz.assignment_id,
            "quiz_id":      null,
            "module_id":    item.module_id,
            "html_url":     item.html_url,
            "url":          item.url,
            "published":    item.published
          };

          newModule.items.push(newItem);
          ++newModule.items_count; 
        }

        if (quiz && (quiz.quiz_type === 'survey')) { 
          const newItem = {
            "id":           item.id,
            "title":        item.title,
            "position":     item.position,
            "indent":       item.indent,
            "type":         'Survey',
            "assignment_id":null,
            "quiz_id":      quiz.id,
            "module_id":    item.module_id,
            "html_url":     item.html_url,
            "url":          item.url,
            "published":    item.published
          };

          newModule.has_survey = true;
          newModule.items.push(newItem);
          ++newModule.items_count; 
        }

      }
      // We don't care about any other types of items.
    }

    json.push(newModule);
  }

  return callback(null, json);
}

module.exports = build;