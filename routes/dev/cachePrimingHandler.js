/* Module containing functions that render cache priming page.
05.16.2018 tps Created.
*/

const async       = require('async');
const cacheStatus = require('../../libs/cacheStatus');
const CachePrimer = require('../../libs/cachePrimer');

function get(req, res) {
  
  async.parallel([
    cacheStatus.currentStatus,
  ], renderPage);

  function renderPage(err, results) {
    if (err) return res.render('dev/err', { err: err });

    const params = {
      status: results[0]
    };
    return res.render('dev/primeCanvasCache', params);
  } // end renderPage function
}


function post(req, res) {
  // Start refreshing Canvas cache with new data.
  // Don't wait around for the priming to finish, but log errors.
  CachePrimer.prefetch( (err) => {
    if (err) return console.log('Cache priming error:', err);
  });
  return res.redirect(req.app.locals.APP_URL + 'dev/canvasCache');
}


//******************** Exports ********************//

exports.get = get;
exports.post = post;