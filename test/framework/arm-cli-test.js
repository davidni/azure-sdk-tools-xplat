/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var sinon = require('sinon');

var environment = require('../../lib/util/profile/environment');
var log = require('../../lib/util/logging');
var profile = require('../../lib/util/profile');
var utils = require('../../lib/util/utils');
var CLITest = require('./cli-test');

function ARMCLITest(testPrefix, forceMocked) {
  this.skipSubscription = true;
  ARMCLITest['super_'].call(this, testPrefix, forceMocked);
}

util.inherits(ARMCLITest, CLITest);

_.extend(ARMCLITest.prototype, {
  setupSuite: function (callback) {
    if (this.isMocked && !this.isRecording) {
      process.env.AZURE_ENABLE_STRICT_SSL = false;

      var profileData;

      CLITest.wrap(sinon, profile, 'load', function (originalLoad) {
        return function (filenameOrData) {
          if (!filenameOrData || filenameOrData === profile.defaultProfileFile) {
            if (profileData) {
              return originalLoad(profileData);
            }
            return originalLoad(createMockedSubscriptionFile());
          }
          return originalLoad(filenameOrData);
        };
      });

      CLITest.wrap(sinon, profile.Profile.prototype, 'save', function (originalSave) {
        return function (filename) {
          profileData = this._getSaveData();
        };
      });

      CLITest.wrap(sinon, utils, 'readConfig', function (originalReadConfig) {
        return function () {
          var config = originalReadConfig();
          config.mode = 'arm';
          return config;
        };
      });

      CLITest.wrap(sinon, environment.prototype, 'acquireToken', function (original) {
        return function (authConfig, username, password, callback) {
          var fourHoursInMS = 4 * 60 * 60 * 1000;
          callback(null, {
            authConfig: authConfig,
            accessToken: 'foobar',
            expiresAt: new Date(Date.now() + fourHoursInMS) });
        };
      });

      CLITest.wrap(sinon, environment.prototype, 'getAccountSubscriptions', function (original) {
        return function (token, callback) {
          callback(null, [ {
            subscriptionId: process.env.AZURE_ARM_TEST_SUBSCRIPTIONID,
            subscriptionStatus: 0
          }]);
        };
      });
    }

    if (this.isRecording) {
      fs.writeFileSync(this.recordingsFile,
        '// This file has been autogenerated.\n\n' +
        'exports.scopes = [');
    }

    this.removeCacheFiles();
    profile.current = profile.load();
    callback();
  },

  teardownSuite: function (callback) {
    this.currentTest = 0;
    if (this.isMocked) {
      if (this.isRecording) {
        fs.appendFileSync(this.recordingsFile, '];');
      }

      if (profile.load.restore) {
        profile.load.restore();
      }

      if (profile.Profile.prototype.save.restore) {
        profile.Profile.prototype.save.restore();
      }

      if (utils.readConfig.restore) {
        utils.readConfig.restore();
      }

      if (environment.prototype.acquireToken.restore) {
        environment.prototype.acquireToken.restore();
      }

      if (environment.prototype.getAccountSubscriptions.restore) {
        environment.prototype.getAccountSubscriptions.restore();
      }

      delete process.env.AZURE_ENABLE_STRICT_SSL;
    }
    callback();
  }
});

function createMockedSubscriptionFile () {
  return {
    environments: [{
        "name": "next",
        "publishingProfileUrl": "https://auxnext.windows.azure-test.net/publishsettings/index",
        "portalUrl": "https://auxnext.windows.azure-test.net",
        "managementEndpointUrl": "https://managementnext.rdfetest.dnsdemo4.com",
        "resourceManagementEndpointUrl": "https://api-next.resources.windows-int.net",
        "activeDirectoryEndpointUrl": "https://login.windows-ppe.net",
        "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
        "hostNameSuffix": "azurewebsites.net",
        "commonTenantName": "common",
        "publicGalleryEndpointUrl" : "https://next.gallery.azure-test.net"
      }, {
        "name": "current",
        "publishingProfileUrl": "https://auxcurrent.windows.azure-test.net/publishsettings/index",
        "portalUrl": "https://auxcurrent.windows.azure-test.net",
        "managementEndpointUrl": "https://management.rdfetest.dnsdemo4.com",
        "resourceManagementEndpointUrl": "https://api-current.resources.windows-int.net",
        "activeDirectoryEndpointUrl": "https://login.windows-ppe.net",
        "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
        "hostNameSuffix": "azurewebsites.net",
        "commonTenantName": "common",
        "publicGalleryEndpointUrl" : "https://current.gallery.azure-test.net"
      }
    ],

    subscriptions: [
      {
        id: process.env.AZURE_ARM_TEST_SUBSCRIPTIONID,
        name: "Node CLI Test",
        "username": "testdummy@example.com",
        "accessToken": {
            "authConfig": {
                "authorityUrl": "https://login.windows.net",
                "tenantId": "common",
                "resourceId": "https://management.core.windows.net/",
                "clientId": "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
            },
            "accessToken": "dummy",
            "refreshToken": "dummy",
            "expiresAt": new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        "isDefault": false,
        "environmentName": "AzureCloud",
        "registeredProviders": [
            "visualstudio.account",
            "website",
            "sqlserver"
        ],
        "registeredResourceNamespaces": [
            "microsoft.insights",
            "successbricks.cleardb"
        ]
      }
    ],
  };
}

module.exports = ARMCLITest;
