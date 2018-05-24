/* Route handler for LTI launch request.
08.25.2017 tps Created.
08.31.2017 tps Fixed validation bug caused by reading wrong launch URL from .env.
11.30.2017 tps Select page for user based on their role.
12.29.2017 tps Send faculty user to wait page instead of directly to dashboard. 
02.18.2018 tps Add redirect for a faculty admin user.
*/


var isValidRequest = require('../../libs/oauthHelper').validateLtiRequest;

function launchLti(req, res) {
  // Landing page for an LTI launch request.

  // Get rid of any existing session data for this client.
  req.session.regenerate( (err) => {
    if (err) {
      // console.log(err); // Not sure what errors look like.
      return res.render('dev/err', { 'err': err } );
    }

    // Not sure what we'll need, so just grab everything in the
    // signed POST request.
    Object.assign(req.session, req.body);

    // Flag the method used to authorize the session user.
    req.session.userAuthMethod = 'lti';

    // Save some stuff to a session for the client if we can validate the request.
    // if (isValidRequest('POST', process.env.CST_CRITIQUEIT_LTI_URL, req.body)) {
    if (isValidRequest('POST', process.env.CST_LTI_LAUNCH_URL, req.body)) {

      // Redirect user based on their role
      var roles = req.body.custom_canvas_membership_roles.split(',');
      req.session.fdb_roles = roles;

      // Temporarily view session data instead of error message
      //res.redirect('sessionData');

      if (roles.includes('CST-Admin')) {
        // Send faculty admin user to faculty list page
        res.redirect('dev/facultyList');
      } else if (roles.includes('TeacherEnrollment')) {
        // Send user to their faculty dashboard page.
        res.redirect(`dash/facultyPleaseWait/${req.body.custom_canvas_user_id}`);
        // res.redirect(`dash/pleaseWait?redirectUrl=${req.app.locals.APP_URL}dash/faculty/${req.body.custom_canvas_user_id}`);
      } else if (roles.includes('StudentEnrollment')) {
        // Resend the post to the CE hours web app
        res.redirect(307, process.env.CST_STUDENT_URL);
      } else {
        res.render('dev/err', { err: "No redirect found for the Canvas user's role."});
      }

    } else {
      res.redirect('badRequest');
    }
  });
}

//************************* Module Exports *************************
module.exports = launchLti;
