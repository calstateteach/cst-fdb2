/* Router middleware that makes sure user has logged in.
08.25.2017 tps Created.
08.26.2017 tps Secure if logged is as developer or a faculty user.
08.28.2018 tps Secure faculty pages viewed with LTI login by checking user ID.
*/

function checkUser(req, res, next) {
  switch (req.session.userAuthMethod) {
    case 'dev':
      next();
      break;
    case 'lti':
      // const userIdSession = parseInt(req.session.custom_canvas_user_id, 10);
      // const userIdUrl = parseInt(req.params['userId'], 10);
      // if (userIdSession === userIdUrl) {
      //   next();
      // } else {
      //   res.redirect(req.app.locals.APP_URL + 'badRequest');        
      // }
      next();
      break; 
    default:
      res.redirect(req.app.locals.APP_URL + 'badRequest');
  }

  // var userAuthMethod = req.session.userAuthMethod;
  // if (userAuthMethod && ['dev', 'lti'].includes(userAuthMethod)) {
  //   next();
  // } else {
  //   // Use relative redirect because we might be behind a reverse proxy
  //   res.redirect('../badRequest');
  // }
}

module.exports = checkUser;
