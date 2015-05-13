var distex = require('distex');
var rabbitPie = require('rabbit-pie');
var logger = require('../../core/logger');

module.exports = {
	create: function (handlerPredicate) {
		return rabbitPie.connect().then(function (connection) {
			logger.info('distex provider connected');
			return distex.provider.create(connection, handlerPredicate);
		});
	}
};
