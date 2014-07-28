var assert = require("assert");
var pathEndsWith = require('./testUtils').pathEndsWith;
var proxyquire = require('proxyquire');
var path = require('path');


describe('userConfigurationAccess', function () {


	describe('accessing config for specific user', function () {
		var userConfigurationAccess = require('../../../core/userConfigurationAccess');
		it('should return an object for accessing config of a user', function (done) {
			var fakeUser = {
				id: 'someone'
			};
			assert.ok(userConfigurationAccess.forUser(fakeUser));
			done();
		});
	});

	describe('user specific config access object', function () {
		var stubfs = {};
		beforeEach(function (done) {
			delete stubfs.readFile;
			delete stubfs.watch;
			done();
		});

		var userConfigurationAccess = proxyquire('../../../core/userConfigurationAccess', {
			'fs': stubfs
		});

		describe('setting state config', function () {
			it('should write the new config to the users state config file in their data dir, removing any states sha properties', function (done) {
				var fakeUser = {
					id: 'someone'
				};
				var usersStateFilePathEnding = '/data/userSpecific/someone/config/stateConfig.json'
				var newConfig = {
					states: [{
						name: 'foo',
						sha: 'abcdef1234'
					}]
				};
				var expectedContent = '{"states":[{"name":"foo"}]}';


				stubfs.writeFile = function (path, content, cb) {
					assert.equal(true, pathEndsWith(path, usersStateFilePathEnding));
					assert.equal(content, expectedContent);
					cb(null);
				};

				var access = userConfigurationAccess.forUser(fakeUser);
				access.setStateConfig(newConfig, function (err) {
					done();
				});
			});
		});

		describe('accessing state config', function () {
			var fakeFileError = {
				errno: 34,
				code: 'ENOENT'
			};

			it('should return a default object for people without a config file and create the file', function (done) {
				var fakeUser = {
					id: 'someone'
				};
				var usersStateFilePathEnding = '/data/userSpecific/someone/config/stateConfig.json'
				var expectedDefaultConfig = {
					states: []
				};
				var fileWasWritten = false;

				stubfs.readFile = function (path, cb) {
					return cb(fakeFileError, null)
				};
				stubfs.writeFile = function (path, content, cb) {
					assert.equal(true, pathEndsWith(path, usersStateFilePathEnding));
					assert.equal(content, JSON.stringify(expectedDefaultConfig), 'file not written with expected content');
					fileWasWritten = true;
					cb(null);
				};

				var access = userConfigurationAccess.forUser(fakeUser);
				access.getStateConfig(function (err, config) {
					assert.equal(JSON.stringify(config), JSON.stringify(expectedDefaultConfig), 'unexpected config returned');
					assert.equal(true, fileWasWritten, 'file not written');
					done();
				});
			});

			it('should return state config from the users state config file in their data dir', function (done) {
				var fakeUser = {
					id: 'someone'
				};

				stubfs.readFile = function (path, cb) {
					var fakeConfig = {
						states: [{
							name: 'test',
							enterOn: {
								eventMatching: {
									text: 'enter'
								}
							}
						}]
					};

					if (pathEndsWith(path, '/data/userSpecific/someone/config/stateConfig.json')) {
						return cb(null, JSON.stringify(fakeConfig))
					}
					cb('wrong path');
				}


				var access = userConfigurationAccess.forUser(fakeUser);
				access.getStateConfig(function (err, config) {
					assert.ok(config);
					assert.equal(config.states.length, 1);
					done();
				});
			});

			it('should add a sha to each state rule on load', function (done) {
				var fakeUser = {
					id: 'someone'
				};

				stubfs.readFile = function (path, cb) {
					var fakeConfig = {
						states: [{
							name: 'test'
						}, {
							name: 'another'
						}]
					};
					return cb(null, JSON.stringify(fakeConfig))
				}

				var access = userConfigurationAccess.forUser(fakeUser);
				access.getStateConfig(function (err, config) {
					assert.ok(config.states.every(function (state) {
						return state.sha
					}));
					done();
				});
			});
		});

		describe('Subscribing to state config', function () {
			it('should raise a config changed event when users state config file changes', function (done) {
				var fakeUser = {
					id: 'someone'
				};
				var config = {
					states: [{
						name: 'test'
					}, {
						name: 'another'
					}]
				};

				var fakeAFileChangeEvent;
				stubfs.watch = function (filename, options, callback) {
					fakeAFileChangeEvent = callback.bind(callback, 'change', filename);
				};
				stubfs.readFile = function (path, cb) {
					return cb(null, JSON.stringify(config))
				};

				var access = userConfigurationAccess.forUser(fakeUser);
				access.watchStateConfig(function (newStateConfig) {
					assert.equal(newStateConfig.states.length, 3);
					done();
				});

				config.states.push({
					name: 'newState'
				});
				fakeAFileChangeEvent();
			});

			it('should supply a delta parameter in config change callback which has added and removed rules', function (done) {
				var fakeUser = {
					id: 'someone'
				};
				var config = {
					states: [{
						name: 'test'
					}, {
						name: 'another'
					}]
				};

				var fakeAFileChangeEvent;
				stubfs.watch = function (filename, options, callback) {
					fakeAFileChangeEvent = callback.bind(callback, 'change', filename);
				};
				stubfs.readFile = function (path, cb) {
					return cb(null, JSON.stringify(config))
				};

				var access = userConfigurationAccess.forUser(fakeUser);
				access.watchStateConfig(function (newStateConfig, delta) {
					assert.equal(delta.added.length, 1);
					assert.equal(delta.added[0].name, 'newly added');

					assert.equal(delta.removed.length, 1);
					assert.equal(delta.removed[0].name, 'test');

					done();
				});

				config.states = [{
					name: 'another'
				}, {
					name: 'newly added'
				}];
				fakeAFileChangeEvent();
			});
		});
	});
});
