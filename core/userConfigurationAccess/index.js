var path = require('path');
var fs = require('fs');

module.exports = {
	forUser:function(user){
		var userDataPath = path.join(path.dirname(require.main.filename),'data','userSpecific', user.id);
		var userConfigPath = path.join(userDataPath, 'config');
		
		return {
			getStateConfig:function(done){
				console.info('getting state config for user ' + user.id);
				var stateConfigPath = path.join(userConfigPath, 'stateConfig.json');
				fs.readFile(stateConfigPath, function(err, fileContent){
					var fileContent = fileContent || '{}';
					err && console.error('error reading state config ' + err);
					done(err, JSON.parse(fileContent));
				});
			}
		};
	}
}