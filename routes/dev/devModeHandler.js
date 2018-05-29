/* Module containing handler for the developer mode setting.
05.28.2018 tps Created.
*/



function get(req, res) {
  return res.render('dev/devMode');
}


function post(req, res) {
  // Toggle the dev_mode setting, so we don't have to restart
  // the app to show/hide the debug info.
  req.app.locals.isDevModeOn = !req.app.locals.isDevModeOn;
  return res.render('dev/devMode');
}


//******************** Exports ********************//

exports.get = get;
exports.post = post;