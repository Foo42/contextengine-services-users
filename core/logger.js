var serviceName = process.env.SERVICE_NAME;

module.exports = {
	log: console.log.bind(console, serviceName + ':'),
	info: console.info.bind(console, serviceName + ':'),
	error: console.error.bind(console, serviceName + ':'),
	warn: console.warn.bind(console, serviceName + ':')
}
