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

var should = require('should');

var util = require('util');
var fs = require('fs');

var CLITest = require('../../../framework/csm-cli-test');
var testprefix = 'csm-cli-resource-tests';

var testLocation = 'South Central US';

var createdGroups = [];
var createdResources = [];

describe('csm', function () {
  describe('resource', function () {
    var suite;

    before(function (done) {
      suite = new CLITest(testprefix);
      suite.setupSuite(done);
    });

    after(function (done) {
      suite.teardownSuite(done);
    });

    beforeEach(function (done) {
      suite.setupTest(done);
    });

    afterEach(function (done) {
      suite.teardownTest(done);
    });

    describe('create', function () {
      it('should work', function (done) {
        var groupName = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);
        suite.execute('group create %s --location %s --json', groupName, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
            result.exitStatus.should.equal(0);

            suite.execute('group show %s --json', groupName, function (showResult) {
              showResult.exitStatus.should.equal(0);

              var group = JSON.parse(showResult.text);
              group.resources.some(function (res) {
                return res.name === resourceName;
              }).should.be.true;

              suite.execute('group delete %s --quiet --json', groupName, function () {
                done();
              });
            });
          });
        });
      });

      it('should create the group if it does not exist', function (done) {
        var groupName = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);

        suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('group show %s --json', groupName, function (showResult) {
            showResult.exitStatus.should.equal(0);

            var group = JSON.parse(showResult.text);
            group.resources.some(function (res) {
              return res.name === resourceName;
            }).should.be.true;

            suite.execute('group delete %s --quiet --json', groupName, function () {
              done();
            });
          });
        });
      });
    });

    describe('delete', function () {
      it('should work', function (done) {
        var groupName = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);
        suite.execute('group create %s --location %s --json', groupName, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
            result.exitStatus.should.equal(0);

            suite.execute('resource delete %s %s %s --quiet --json', groupName, resourceName, 'Microsoft.Web/sites', resourceName, function (result) {
              result.exitStatus.should.equal(0);

              suite.execute('group show %s --json', groupName, function (showResult) {
                showResult.exitStatus.should.equal(0);

                var group = JSON.parse(showResult.text);
                group.resources.some(function (res) {
                  return res.name === resourceName;
                }).should.be.false;

                suite.execute('group delete %s --quiet --json', groupName, function () {
                  done();
                });
              });
            });
          });
        });
      });
    });

    describe('list', function () {
      it('should work without filters', function (done) {
        var groupName = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);
        suite.execute('group create %s --location %s --json', groupName, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
            result.exitStatus.should.equal(0);

            suite.execute('resource list %s --json', groupName, function (listResult) {
              listResult.exitStatus.should.equal(0);

              suite.execute('group delete %s --quiet --json', groupName, function () {
                done();
              });
            });
          });
        });
      });

      it('should work with group filters', function (done) {
        var groupName1 = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName1 = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);
        var groupName2 = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName2 = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);

        suite.execute('group create %s --location %s --json', groupName1, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('group create %s --location %s --json', groupName2, testLocation, function (result) {
            result.exitStatus.should.equal(0);

            suite.execute('resource create %s %s %s %s -p %s --json', groupName1, resourceName1, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName1 + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
              result.exitStatus.should.equal(0);

              suite.execute('resource create %s %s %s %s -p %s --json', groupName2, resourceName2, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName2 + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
                result.exitStatus.should.equal(0);

                suite.execute('resource list -g %s --json', groupName1, function (listResult) {
                  listResult.exitStatus.should.equal(0);

                  var results = JSON.parse(listResult.text);
                  results.length.should.equal(1);

                  results.some(function (res) {
                    return res.name === resourceName1;
                  }).should.be.true;

                  suite.execute('group delete %s --quiet --json', groupName1, function () {
                    suite.execute('group delete %s --quiet --json', groupName2, function () {
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    describe('show', function () {
      it('should work with positional', function (done) {
        var groupName = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);
        suite.execute('group create %s --location %s --json', groupName, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
            result.exitStatus.should.equal(0);

            suite.execute('resource show %s %s %s --json', groupName, resourceName, 'Microsoft.Web/sites', function (showResult) {
              showResult.exitStatus.should.equal(0);

              var resource = JSON.parse(showResult.text);
              resource.name.should.equal(resourceName);
              resource.location.should.equal(testLocation);

              suite.execute('group delete %s --quiet --json', groupName, function () {
                done();
              });
            });
          });
        });
      });

      it('should work with switches', function (done) {
        var groupName = suite.generateId('xTestResource', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpRes', createdResources, suite.isMocked);
        suite.execute('group create %s --location %s --json', groupName, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
            result.exitStatus.should.equal(0);

            suite.execute('resource show -g %s -n %s -r %s --json', groupName, resourceName, 'Microsoft.Web/sites', function (showResult) {
              showResult.exitStatus.should.equal(0);

              var resource = JSON.parse(showResult.text);
              resource.name.should.equal(resourceName);
              resource.location.should.equal(testLocation);

              suite.execute('group delete %s --quiet --json', groupName, function () {
                done();
              });
            });
          });
        });
      });
    });

    describe('set', function () {
      it('should work to overwrite existing resource', function(done) {
        var groupName = suite.generateId('xTestResourceSet', createdGroups, suite.isMocked);
        var resourceName = suite.generateId('xTestGrpResSet', createdResources, suite.isMocked);
        suite.execute('group create %s --location %s --json', groupName, testLocation, function (result) {
          result.exitStatus.should.equal(0);

          suite.execute('resource create %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '", "SiteMode": "Limited", "ComputeMode": "Shared" }', function (result) {
            result.exitStatus.should.equal(0);

            //Make a change like set the 'SiteMode' To 'Free'
            suite.execute('resource set %s %s %s %s -p %s --json', groupName, resourceName, 'Microsoft.Web/sites', testLocation, '{ "Name": "' + resourceName + '","SiteMode": "Free", "ComputeMode": "Shared" }', function (setResult) {
              setResult.exitStatus.should.equal(0);

              suite.execute('resource show %s %s %s --json', groupName, resourceName, 'Microsoft.Web/sites', function (showResult) {
                showResult.exitStatus.should.equal(0);

                //Serach for "siteMode":"Free" to make sure Set did work
                showResult.text.indexOf('"siteMode": "Free",').should.be.above(-1);

                suite.execute('group delete %s --quiet --json', groupName, function () {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
});