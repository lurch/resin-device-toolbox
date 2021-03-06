
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var CONFIGURATION_SCHEMA, Promise, _, inquirer, reconfix, umount;

_ = require('lodash');

Promise = require('bluebird');

umount = Promise.promisifyAll(require('umount'));

inquirer = require('inquirer');

reconfix = require('reconfix');

CONFIGURATION_SCHEMA = {
  mapper: [
    {
      template: {
        hostname: '{{hostname}}',
        persistentLogging: '{{persistentLogging}}'
      },
      domain: [['config_json', 'hostname'], ['config_json', 'persistentLogging']]
    }, {
      template: {
        wifi: {
          ssid: '{{networkSsid}}'
        },
        'wifi-security': {
          psk: '{{networkKey}}'
        }
      },
      domain: [['system_connections', 'resin-sample', 'wifi'], ['system_connections', 'resin-sample', 'wifi-security']]
    }
  ],
  files: {
    system_connections: {
      fileset: true,
      type: 'ini',
      location: {
        path: 'system-connections',
        partition: {
          primary: 1
        }
      }
    },
    config_json: {
      type: 'json',
      location: {
        path: 'config.json',
        partition: {
          primary: 1
        }
      }
    }
  }
};

module.exports = {
  signature: 'configure <target>',
  description: '(Re)configure a ResinOS drive or image',
  help: 'Use this command to configure or reconfigure a ResinOS drive or image.\n\nExamples:\n\n	$ rdt configure /dev/sdc\n	$ rdt configure path/to/image.img',
  primary: true,
  action: function(params, options, done) {
    return umount.isMountedAsync(params.target).then(function(isMounted) {
      if (!isMounted) {
        return;
      }
      return umount.umountAsync(params.target);
    }).then(function() {
      return reconfix.readConfiguration(CONFIGURATION_SCHEMA, params.target).then(function(data) {
        data.persistentLogging = data.persistentLogging || false;
        return inquirer.prompt([
          {
            message: 'Network SSID',
            type: 'input',
            name: 'networkSsid',
            "default": data.networkSsid
          }, {
            message: 'Network Key',
            type: 'input',
            name: 'networkKey',
            "default": data.networkKey
          }, {
            message: 'Do you want to set advanced settings?',
            type: 'confirm',
            name: 'advancedSettings',
            "default": false
          }, {
            message: 'Device Hostname',
            type: 'input',
            name: 'hostname',
            "default": data.hostname,
            when: function(answers) {
              return answers.advancedSettings;
            }
          }, {
            message: 'Do you want to enable persistent logging?',
            type: 'confirm',
            name: 'persistentLogging',
            "default": data.persistentLogging,
            when: function(answers) {
              return answers.advancedSettings;
            }
          }
        ]).then(function(answers) {
          return _.merge(data, answers);
        });
      });
    }).then(function(answers) {
      return reconfix.writeConfiguration(CONFIGURATION_SCHEMA, answers, params.target);
    }).then(function() {
      return console.log('Done!');
    }).asCallback(done);
  }
};
