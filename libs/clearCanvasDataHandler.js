/* Callback handler for request to clear cached faculty list.
08.24.2017 tps Created.
02.14.2018 tps canvasEntities module has been superceded by canvasCache module.
*/

// const canvasEntities = require('./canvasEntities');
const canvasCache = require('./canvasCache');

function postDataRefresh(req, res) {
  // Handler to request clearing Canvas data cache.
  // This causes the app to requery the Canvas API for data.
  // canvasEntities.clearCanvasCache(req.session);
  canvasCache.removeKey(req, 'facultyList', (err) => {
    if (err) return res.render('dev/err', { err: err });
    
    // When done, redirect to URL specified by the submit form.
    return res.redirect(req.body.redirectUrl);    
  });
}

module.exports = postDataRefresh;
