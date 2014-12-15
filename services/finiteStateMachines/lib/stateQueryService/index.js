var EventEmitter = require('events').EventEmitter;

module.exports = function(stateEngine){
	var stateWatches = new EventEmitter();

	stateEngine.on('stateChange.activated',function(stateChangeEvent){
		stateWatches.emit(stateChangeEvent.stateName, true);
	});

	stateEngine.on('stateChange.deactivated',function(stateChangeEvent){
		stateWatches.emit(stateChangeEvent.stateName, false);
	});

	return {		
		createQuery: function(stateName){
			var query = new EventEmitter();

			var publishValueChanged = function(newValue){
				query.emit('valueChanged',newValue);
			}

			query.currentValue = stateEngine.isStateActive.bind(stateEngine, stateName);
			
			query.startWatch = function(){								
				stateWatches.on(stateName, publishValueChanged);
				query.emit('watching');				
			}

			query.stopWatch = function(){
				stateWatches.removeListener(stateName, publishValueChanged);
			};
			return query;
		}
	}
}