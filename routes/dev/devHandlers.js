/* Handler functions for developer pages.
08.23.2017 tps Created.
08.25.2017 tps Add getLtiForm handler.
*/
const uuidHelper = require('../../libs/uuidHelper');

function getLogin(req, res) {
  // Render developer login page.
  res.render('dev/login');
}

function getHome(req, res) {
  // Render developer homate page.
  res.render('dev/home');
}

function getSessionData(req, res) {
  // Render contents of session cache.
  // URL may include query parameter for a session key.
  res.render('dev/sessionData', {
    query: req.query,
    sessionData: req.session,
    reqHeaders: req.headers,
  });
}

function getUuids(req, res) {
  // Render lists of UUIDs.
  res.render('dev/uuids', uuidHelper.makeUuids());
}

function destroySession(req, res) {
  req.session.destroy( (err) => {
    res.redirect('devlogin');
  });
}


//******************** Exports ********************//
exports.getLogin = getLogin;
exports.getHome = getHome;
exports.getSessionData = getSessionData;
exports.getUuids = getUuids;
exports.destroySession = destroySession;
