/* Router middleware that makes sure user has logged in.
08.25.2017 tps Created.
08.26.2017 tps Secure if logged is as developer or a faculty user.
*/

function checkUser(req, res, next) {
  var userAuthMethod = req.session.userAuthMethod;
  if (userAuthMethod && ['dev', 'lti'].includes(userAuthMethod)) {
    next();
  } else {
    // Use relative redirect because we might be behind a reverse proxy
    res.redirect('../badRequest');
  }
}

module.exports = checkUser;
