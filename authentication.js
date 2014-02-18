var isOfflineMode = process.env['OFFLINE_MODE'] && process.env['OFFLINE_MODE'].toLowerCase() == 'true';

module.exports.initialise = isOfflineMode ? 
	require('./fakeAuthentication').initialise : 
	require('./googleAuthentication').initialise;
