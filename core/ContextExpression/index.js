var EventEmitter = require('events').EventEmitter;
var objectMatches = require('../objectMatches');

module.exports = function(eventBus, stateQueryService){
	var createStateExpression = function createStateExpression(specification){
		var stateName = specification.isActive || specification.isNotActive;

		var isDesiredState = function(stateActiveState){
			if(specification.isNotActive){
				return !stateActiveState;
			}
			return stateActiveState;
		}

		var query = stateQueryService.createQuery(stateName);
		return {
			startWatch: function(){query.startWatch()},
			onTriggered: function(callback){
				console.log('subscribing to onTriggered');
				query.on('valueChanged',function(newValue){
					callback(isDesiredState(newValue));
				})
			},
			evaluate:function(callback){
				query.currentValue(function(err, currentValue){
					callback(err, isDesiredState(currentValue));
				});
			}
		};
	};

	var createEventWatch = function createEventWatch(specification){
		var expression = new EventEmitter();
			
		var handleEvent = function(e){
			console.log('event detected');
			if(objectMatches(e, specification.eventMatching)){
				expression.emit('triggered');
			}
		};		

		return {
			startWatch:function(){
				eventBus.on('event', handleEvent);
			},
			stopWatch:function(){
				eventBus.removeListener('event', handleEvent);
			},
			onTriggered:function(f){expression.on('triggered',f)}
		}
	};

	var createStateConditionalEventWatcher = function createStateConditionalEventWatcher(eventWatcher, stateCondition){
		var eventPropegator = new EventEmitter();

		eventWatcher.onTriggered(function(e){
			stateCondition.evaluate(function(err, result){
				if(result){
					console.log('event passed state condition');
					return eventPropegator.emit('triggered', e);
				}
				console.log('event failed state condition');
			})
		});

		return {
			startWatch:function(){
				eventWatcher.startWatch();
			},
			onTriggered:function(f){
				eventPropegator.on('triggered',f);		
			}
		}
	}

	return {
		createExpression : function createExpression(specification){
			var eventWatcher;
			var stateCondition;

			if(specification.on){
				eventWatcher = createEventWatch(specification.on);
			}

			if(specification.whilst){
				stateCondition = createStateExpression(specification.whilst);
			}

			if(eventWatcher && !stateCondition){
				return eventWatcher;
			}
			if(stateCondition && !eventWatcher){
				return stateCondition;
			}
			return createStateConditionalEventWatcher(eventWatcher, stateCondition);
		}
	}
}