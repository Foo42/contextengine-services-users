var path = require('path');

module.exports = {
	'pathEndsWith': function(p, ending){
		var pParts = p.split(path.sep);	
		var endingParts = ending.split(path.sep);

		while(ending.length > 0){
			if(pParts.pop() != endingParts.pop()){
				return false;
			}
			return true;
		}
		return p.length === 0;
	}
}