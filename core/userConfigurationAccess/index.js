var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var createHash = crypto.createHash.bind(crypto, 'sha1');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var logger = require('../logger');

var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));
logger.log('USER_DATA_PATH =', process.env.USER_DATA_PATH);
logger.log('baseUserDataPath =', baseUserDataPath);

module.exports = {
	forUser: function (user) {
		logger.log('looking up user config for user ' + user.id);
		var userDataPath = path.join(baseUserDataPath, user.id);
		var userConfigPath = path.join(userDataPath, 'config');
		var stateConfigPath = path.join(userConfigPath, 'stateConfig.json');

		var events = new EventEmitter();
		var access = {};

		access.setStateConfig = function setStateConfig(newConfig, done) {
			var copyOfConfig = JSON.parse(JSON.stringify(newConfig));
			copyOfConfig.states.forEach(function (state) {
				delete state.sha
			});

			logger.log('Setting config for user', user.id);
			fs.writeFile(stateConfigPath, JSON.stringify(copyOfConfig), done);
		}

		access.getStateConfig = function getStateConfig(done) {
			logger.log('getting state config for user', user.id);

			var createStateConfigFromJSONString = function createStateConfigFromJSONString(fileContent) {
				config = JSON.parse(fileContent);

				config.states.forEach(function (state) {
					var hash = createHash();
					hash.update(JSON.stringify(state));
					state.sha = hash.digest('hex');
				});
				return config;
			}

			fs.readFile(stateConfigPath, function (err, fileContent) {
				if (err && err.code == 'ENOENT') {
					logger.log('User', user.id, 'has no config file. Creating it at', stateConfigPath);
					fileContent = '{"states":[]}'
					fs.writeFile(stateConfigPath, fileContent, function (err) {
						if (err) {
							return done(err);
						}

						logger.log('User', user.id, 'config file created at', stateConfigPath);
						done(null, createStateConfigFromJSONString(fileContent));
					});
				} else {
					if (err) {
						logger.error('Unexpected error reading user config file for user', user.id, 'at path', userConfigPath, ':', err);
					}
					done(err, createStateConfigFromJSONString(fileContent));
				}
			});
		};

		access.watchStateConfig = function watchStateConfig(callback) {
			access.getStateConfig(function (err, config) {
				var currentConfig = config;

				fs.watch(stateConfigPath, {
					persistent: false
				}, function configFileChanged(event) {
					if (event === 'change') {
						logger.log('detected file change event on file: ' + stateConfigPath);
						access.getStateConfig(function (err, newConfig) {
							if (err) {
								return;
							}
							var delta = {};

							var getStatesInFirstArrayButNotSecond = function (array1, array2) {
								var makePredicateForStatesWithSha = function (desiredSha) {
									return function (state) {
										return state.sha === desiredSha
									}
								};
								return array1.filter(function (state) {
									return !_.find(array2, makePredicateForStatesWithSha(state.sha))
								});
							};
							delta.removed = getStatesInFirstArrayButNotSecond(currentConfig.states, newConfig.states);
							delta.added = getStatesInFirstArrayButNotSecond(newConfig.states, currentConfig.states);
							currentConfig = newConfig;
							callback(newConfig, delta);
						})
					}
				});
			});

		}

		return access;
	}
}
