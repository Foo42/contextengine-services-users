var contextEngines = require('../../core/contextEngine').createContextEnginesForRegisteredUsers();
setTimeout(function () {
	process.send(JSON.stringify({
		status: "ready"
	}));
}, 500);
