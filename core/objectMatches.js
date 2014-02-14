var filtr = require('filtr');

module.exports = function(object, conditions){
	var query = filtr(conditions);
	return query.test([object]).length > 0;			
}