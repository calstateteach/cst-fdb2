/* Router middleware that makes sure user has logged in.
08.23.2017 tps Created.
02.19.2018 tps CST-Admin role is allowed to view faculty list.
05.28.2018 tps Remove obsolete CST-Admin logic.
06.11.2018 tps Restore CST-Admin logic.
*/

function checkLogin(req, res, next) {
  if (req.session.userAuthMethod === 'dev') {
    next();
  } else if ( (req.session.userAuthMethod === 'lti')
      && (req.session.fdb_roles.includes('CST-Admin'))
      && (req.path === '/facultyList')) {
    next();
  } else {
    // Use relative redirect because we might be behind a reverse proxy
    res.redirect('../devlogin');
  }
}

module.exports = checkLogin;
