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
			fs.writeFile(stateConfigPath, JSON.stringify(newConfig), done);
		} 

		access.getStateConfig = function getStateConfig(done){
			console.info('getting state config for user ' + user.id);
			
			fs.readFile(stateConfigPath, function(err, fileContent){
				var fileContent = fileContent || '{"states":[]}';
				
				//It's ok if the file isnt there, we'll use a default config
				if(err && err.code == 'ENOENT'){
					err = null;
				}

				err && console.error('error reading state config ' + err);

				config = JSON.parse(fileContent);

				config.states.forEach(function(state){
					var hash = createHash();
					hash.update(JSON.stringify(state));
					state.sha = hash.digest('hex');
				});

				done(err, config);
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