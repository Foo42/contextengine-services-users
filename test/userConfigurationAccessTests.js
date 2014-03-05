var assert = require("assert");
var pathEndsWith = require('./testUtils').pathEndsWith;
var proxyquire = require('proxyquire');
var path = require('path');


describe('userConfigurationAccess', function(){
	console.log(it);
	describe('accessing config for specific user', function(){
		var userConfigurationAccess = require('../core/userConfigurationAccess');
		it('should return an object for accessing config of a user', function(done){
			var fakeUser = {id:'someone'};
			assert.ok(userConfigurationAccess.forUser(fakeUser));
			done();
		});
	});

	describe('user specific config access object', function(){
		describe('accessing state config', function(){
			it('should return state config from the users state config file in their data dir', function(done){
				var fakeUser = {id:'someone'};
				var stubfs = {};
				var userConfigurationAccess = proxyquire('../core/userConfigurationAccess', {'fs':stubfs});
				
				stubfs.readFile = function(path, cb){
					assert.ok(pathEndsWith(path, '/data/userSpecific/someone/config/stateConfig.json'));
					var fakeConfig = {states:[{name:'test',enterOn:{eventMatching:{text:'enter'}}}]};
					cb(null,JSON.stringify(fakeConfig));
					done();
				}

				var access = userConfigurationAccess.forUser(fakeUser);
				access.getStateConfig(function(err, config){
					assert.ok(config);
					assert.equal(config.states.length,1);
				});
			});
		});
	});
});
