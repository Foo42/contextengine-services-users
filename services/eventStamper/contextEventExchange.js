var connection = require('./connection');

module.exports = connection.then(function (conn) {
	return conn.declareExchange('contextEvents');
});
