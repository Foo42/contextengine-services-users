var distex = require('distex');
module.exports = require('rabbit-pie').connect().then(function (connection) {
	return distex.client.create(connection);
});
