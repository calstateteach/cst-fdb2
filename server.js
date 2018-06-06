/* Entry point for development of secured version of CST faculty dashboard.
08.23.2017 tps Created.
08.25.2017 tps Include dashboard router.
09.12.2017 tps Use MongoDB for session store.
09.16.2017 tps Make use of default session store a configurable item.
11.27.2017 tps Configure session name externally.
11.27.2017 tps Configure app port externally.
12.28.2017 tps Set TTL for sessions.
01.01.2018 tps Add APP_URL local for building app's URL paths.
01.18.2018 tps Start timer that periodically primes the cache.
01.24.2018 tps Move cache timer to module libs/canvasCacheTimer.js
02.21.2018 tps Add local for CAM CE hors API template string.
02.27.2018 tps No longer need connection to CE hours Mongo DB.
04.24.2018 tps Add route for endpoints for AJAX calls.
05.17.2018 tps Load configuration files & prefetched data before starting Web app.
05.24.2018 tps Load configuration item for base URL for Canvas API & Web app.
05.24.2018 tps Load configuration URL for CAM user search.
05.26.2018 tps Load configuration item for DEV_MODE.
*/
require('dotenv').config();
const async = require('async');
const express = require('express');
const bodyParser = require('body-parser')
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const app = express();


//******************** Constants********************//
const APP_PORT = process.env.APP_PORT;

//******************** Configure Web app ********************//
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var sessionOptions = {
  // name: 'server-session-cookie-id',
  name: process.env.CST_COOKIE_NAME,
  secret: process.env.CST_COOKIE_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: 'auto'
  }
};
// By default, use MongoDB as session store
if (process.env.USE_DEFAULT_SESSION_STORE !== 'True') {
  sessionOptions.store = new MongoStore({
    url: process.env.CST_MONGODB_SESSION_STORE,
    ttl: 2 * 24 * 60 * 60  // Sessions expire in 2 days.
  });
}
app.use(session(sessionOptions));

// Configure for use from behind a proxy.
app.set('trust proxy', true);
app.set('trust proxy', 'loopback');


//******************** Globally Available Data ********************//

// URL location of Web app. Use to build URL links when app is
// running under a reverse proxy server.
// e.g. "https://fdb.calstateteach.net/cehours/"
app.locals.APP_URL = process.env.APP_URL;

// Template string for CAM API query for CE Hours data
app.locals.CAM_CE_HOURS_URL = process.env.CAM_CE_HOURS_URL;

// Base URL for constructing Canvas API & Web app links
app.locals.CST_CANVAS_BASE_URL = process.env[process.env.CST_CANVAS_BASE_URL];

// Template string for CAM API user search
app.locals.CAM_USER_SEARCH_URL = process.env.CAM_USER_SEARCH_URL;

// Load DEV_MODE from configuration
app.locals.isDevModeOn = (process.env.DEV_MODE === 'On');


//******************** Configure Routers ********************//
app.use('/', require('./routes/root/rootRoutes').router);
app.use('/dev', require('./routes/dev/devRoutes').router);
app.use('/dash', require('./routes/dash/dashRoutes').router);
app.use('/api/v0', require('./routes/api_0/apiRoutes').router);
app.use('/api_public/v0', require('./routes/api_public_0/apiPublicRoutes').router);


//******************** Pre-flight Activities ********************//

async.series([
  require('./libs/appConfig').loadAll,
  require('./libs/moduleCache').loadDiskCache
], preflightDone);

//******************** Define App Startup ********************//
function preflightDone(err) {
  if (err) return console.log("Unable to start dashboard:", err);

  // Start timer to keep cache refreshed
  const timer = require('./libs/canvasCacheTimer').start();

  // Handle ^C during development?
  process.on('SIGINT', function () {
    console.log("Caught interrupt signal");
    clearInterval(timer);
    process.exit();
  });

  app.listen(APP_PORT, function () {
    console.log('listening on', APP_PORT);
  });
}