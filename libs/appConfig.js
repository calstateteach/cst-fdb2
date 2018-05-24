/* Module that encapsulates loading & storing static configuration files.
Expose config file contents & timestamp for Web site admins.
05.08.2018 tps Created.
05.15.2018 tps Can we store the configuration data in this module instead of app locals?
*/

const async = require('async');
const fs = require('fs');
const csvUtils = require('./csvUtils');

//******************** Module Config Object Store ********************//
var termsConfig = {};
var addsConfig = {};
var assDesc = {};


//******************** Constants ********************//
// File paths are relative to root folder.
const TERMS_CONFIG_FILE = 'config/terms_config.json';
const ADDS_CONFIG_FILE = 'config/add_config.csv'
const GOOGLE_ASS_DESC_FILE = 'config/assignment_description.html';

//******************** Load all config items ********************//

function loadAll(callback) {
  // Callback signature: (err)
  console.log("Loading config files");

  function done(err, results) {
    if (err) return callback(err);
    return callback();
  }

  async.series([
    (callback) => { loadTermsConfig(callback); },
    (callback) => { loadAddsConfig(callback); },
    (callback) => { loadGoogleAssDesc(callback); }
  ], done);
}

//******************** Load individual config items ********************//

function loadTermsConfig(callback) {
  // Callback signature: (err)
  fs.readFile(TERMS_CONFIG_FILE, 'utf8', (err, data) => {
    if (err) return callback(err);
    try {
      const json = JSON.parse(data);
      termsConfig = new ConfigItem(TERMS_CONFIG_FILE, json);
      return callback();
    } catch(parseErr) {
      return callback(parseErr);
    }
  }); // end readFile callback

}

function loadAddsConfig(callback) {
  // Callback signature: (err)
  csvUtils.parseFile(ADDS_CONFIG_FILE, (err, json) => {
    if (err) return callback(err);
    addsConfig = new ConfigItem(ADDS_CONFIG_FILE, json);
    return callback();
  });
}

function loadGoogleAssDesc(callback) {
  // Read the description text for a new Google assignment from a text file into module store.
  // callback signature: (err)
  fs.readFile(GOOGLE_ASS_DESC_FILE, 'utf8', (err, data) => {
    if (err) return callback(err);
    assDesc = new ConfigItem(GOOGLE_ASS_DESC_FILE, data);
    return callback();
  }); // end readFile callback
}

//******************** Helper Functions ********************//

//******************** ConfigItem Class ********************//

class ConfigItem {
  constructor(filePath, value) {
    this.filePath = filePath;
    this.value = value;
    this.timestamp = new Date();
  }
}


//******************** Exports ********************//
exports.loadAll = loadAll;

exports.loadTerms = loadTermsConfig;
exports.loadAdds = loadAddsConfig;
exports.loadGoogleAssDesc = loadGoogleAssDesc;

exports.getTerms         = function () { return termsConfig.value; };
exports.getAdds          = function () { return addsConfig.value; };
exports.getGoogleAssDesc = function () { return assDesc.value; };

exports.getTermsConfigItem         = function () { return termsConfig; };
exports.getAddsConfigItem          = function () { return addsConfig; };
exports.getGoogleAssDescConfigItem = function () { return assDesc; };
