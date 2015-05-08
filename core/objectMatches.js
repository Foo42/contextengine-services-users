var sift = require('sift');

module.exports = function(object, conditions){
	var query = sift(conditions);
	return query(object);			
}
