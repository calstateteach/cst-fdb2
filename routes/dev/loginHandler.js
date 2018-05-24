/* Handler functions for developer login.
08.23.2017 tps Created.
*/

function validateLogin(req, res) {

  var user = req.body.username;
  var secret = req.body.usersecret;

  if ( (process.env.CST_DEV_USER === user)
    && (process.env.CST_DEV_SECRET == secret)) {
      req.session.user = user;
      res.redirect('home');
  } else {
      res.render('dev/login', { err: "Invalid login"} );
  }

}

//******************** Exports ********************//
module.exports = validateLogin;
