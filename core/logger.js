var colors = require('colors/safe');
var serviceName = process.env.SERVICE_NAME;

function colourArguments(args, colour) {
	return Array.prototype.slice.call(args).map(colors[colour]);
}

module.exports = {
	log: console.log.bind(console, serviceName + ':'),
	info: function () {
		console.info.bind(console, serviceName + ':').apply(console, colourArguments(arguments, 'grey'));
	},
	error: function () {
		console.error.bind(console, serviceName + ':').apply(console, colourArguments(arguments, 'red'));
	},
	warn: function () {
		console.warn.bind(console, serviceName + ':').apply(console, colourArguments(arguments, 'orange'));
	}
}
