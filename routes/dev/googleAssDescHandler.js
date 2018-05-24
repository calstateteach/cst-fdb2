/* Module containing functions that render configuration for Google assignment description.
05.11.2018 tps Created.
*/

const fs = require('fs');
const appConfig = require('../../libs/appConfig');

const VIEW = 'dev/googleAssDescConfig';

function get(req, res) {
  // Display current config file contents
  const configItem = appConfig.getGoogleAssDescConfigItem();
  fs.readFile(configItem.filePath, 'utf8', (err, data) => {
    if (err) return res.render('dev/err', { err: err });

    const params = {
      fileData: data,
      configItem: configItem
    }
    return res.render(VIEW, params);
  });
}


function post(req, res) {
  appConfig.loadGoogleAssDesc( (err) => {
    if (err) return res.render('dev/err', { err: err });
    return get(req, res);
  });
}


exports.get = get;
exports.post = post;
