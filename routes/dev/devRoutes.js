/* Express Router for development pages.
08.23.2017 tps Created.
11.27.2018 tps Add route for CE Hours DB connection page.
01.08.2017 tps Add routes for term configuration page.
01.11.2017 tps Add routes for Canvas cache page.
02.14.2018 tps coursesConfig page now obsolete.
02.27.2018 tps No longer need connection to CE hours Mongo DB.
03.01.2018 tps Used temporary handler to test module detail page.
05.28.2018 tps Remove obsolete clearCanvasDataHandler
*/

const express = require('express');
const router = express.Router();
const routeHandlers = require('./devHandlers');
// const coursesConfigHandler = require('./coursesConfigHandler');
// const facultyListHandler = require('./facultyListHandler');
// const clearCanvasDataHandler = require('../../libs/clearCanvasDataHandler');
// const oauthFormHandler = require('./oauthFormHandler');
// const critHandler = require('./critHandler');
const canvasCacheHandler = require('./canvasCacheHandler');
// const getModuleDetail = require('./testModuleDetailHandler').get;
const cachePrimingHandler = require('./cachePrimingHandler');

router.use(require('./secureDevMiddleware'));

router.get('/home', routeHandlers.getHome);
// router.get('/ltiForm', oauthFormHandler.getLtiForm);
// router.post('/ltiForm', oauthFormHandler.postLtiForm);
router.get('/sessionData', routeHandlers.getSessionData);
router.get('/uuids', routeHandlers.getUuids);
router.post('/destroySession', routeHandlers.destroySession);
// router.get('/coursesConfig', coursesConfigHandler.get);
// router.post('/coursesConfig', coursesConfigHandler.put);
// router.get('/facultyList', facultyListHandler);
router.get('/facultyList', require('./facultyListHandler'));
// router.post('/clearCanvasData', clearCanvasDataHandler);
// router.get('/critiqueItStats', critHandler.getStats);
// router.get('/testCeDb', require('./ceDbHandler').getTestCeDb);

router.get('/canvasCache',  canvasCacheHandler.get);
// router.post('/canvasCache',  canvasCacheHandler.post);

router.get('/primeCanvasCache', cachePrimingHandler.get);
router.post('/primeCanvasCache', cachePrimingHandler.post);

const termsConfigHandler = require('./termsConfigHandler');
router.get ('/termsConfig', termsConfigHandler.get);
router.post('/termsConfig', termsConfigHandler.post);

const addsConfigHandler = require('./addsConfigHandler');
router.get ('/addsConfig', addsConfigHandler.get);
router.post('/addsConfig', addsConfigHandler.post);

const googleAssDescHandler = require('./googleAssDescHandler');
router.get ('/googleAssignmentConfig', googleAssDescHandler.get);
router.post('/googleAssignmentConfig', googleAssDescHandler.post);

// Temporary test page for testing refactoring of module detail page
// router.get('/refactor/faculty/:userId/section/:sectionId/module/:moduleId/student/:studentId', getModuleDetail);

exports.router = router;
