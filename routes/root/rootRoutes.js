/* Express Router for root pages.
08.24.2017 tps Created.
02.18.2018 tps Add session data route for debugging purposes.
*/

const express = require('express');
const router = express.Router();
const rootHandlers = require('./rootHandlers');

router.get('/devlogin', rootHandlers.getDevLogin);
router.post('/devlogin', rootHandlers.validateLogin);
router.get('/badRequest', rootHandlers.badRequest);
router.post('/lti', require('./ltiLaunchHandler'));
router.get('/sessionData', rootHandlers.getSessionData);
// router.post('/lti', require('./ltiLaunchTestHandler'));

exports.router = router;
