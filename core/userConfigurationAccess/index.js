var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var createHash = crypto.createHash.bind(crypto, 'sha1');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

module.exports = {
	forUser:function(user){
		var userDataPath = path.join(path.dirname(require.main.filename),'data','userSpecific', user.id);
		var userConfigPath = path.join(userDataPath, 'config');
		var stateConfigPath = path.join(userConfigPath, 'stateConfig.json');
		
		var events = new EventEmitter();
		var access = {};

		access.setStateConfig = function setStateConfig(newConfig, done){					
			var copyOfConfig = JSON.parse(JSON.stringify(newConfig));
			copyOfConfig.states.forEach(function(state){delete state.sha});

			fs.writeFile(stateConfigPath, JSON.stringify(copyOfConfig), done);
		} 

		access.getStateConfig = function getStateConfig(done){
			console.info('getting state config for user ' + user.id);
			

			var createStateConfigFromJSONString = function createStateConfigFromJSONString(fileContent){
				config = JSON.parse(fileContent);

				config.states.forEach(function(state){
					var hash = createHash();
					hash.update(JSON.stringify(state));
					state.sha = hash.digest('hex');
				});
				return config;	
			}

			console.log('about to try reading state config file');
			fs.readFile(stateConfigPath, function(err, fileContent){
				if(err && err.code == 'ENOENT'){
					fileContent = '{"states":[]}'
					fs.writeFile(stateConfigPath, fileContent, function(err){
						if(err){
							return done(err);
						}
		
						done(null, createStateConfigFromJSONString(fileContent));
					});
				} else {
		
					done(err, createStateConfigFromJSONString(fileContent));
				}
			});
		};

		access.watchStateConfig = function watchStateConfig(callback){
			access.getStateConfig(function(err,config){
				var currentConfig = config;

				fs.watch(stateConfigPath, { persistent: false }, function configFileChanged(event){				
					if(event === 'change'){
						console.log('detected file change event on file: ' + stateConfigPath);
						access.getStateConfig(function(err, newConfig){
							if(err){
								return;
							}
							var delta = {};
							
							var getStatesInFirstArrayButNotSecond = function(array1, array2){
								var makePredicateForStatesWithSha = function(desiredSha){return function(state){return state.sha === desiredSha}};
								return array1.filter(function(state){return !_.find(array2, makePredicateForStatesWithSha(state.sha))});
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