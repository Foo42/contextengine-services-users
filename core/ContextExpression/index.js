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
			on:function(event, callback){
				console.log('stateExpression: adding subscriber to event: ' + event);
				query.on(event, function(newValue){
					callback(isDesiredState(newValue));
				});
			},
			evaluate:function(callback){
				query.currentValue(function(err, currentValue){
					callback(err, isDesiredState(currentValue));
				});
			}
		};
	};

	var createEventWatch = function createEventWatch(specification){
		console.log('creating event expression with spec ' + JSON.stringify(specification));
		var expression = new EventEmitter();
			
		var handleEvent = function(e){
			console.log('event detected');
			if(objectMatches(e, specification.eventMatching)){
				expression.emit('triggered');
			}
		};		

		return {
			startWatch:function(){
				eventBus.on('event created', handleEvent); //prefer it if the event bus wasnt just the context engine with its odd event name
			},
			stopWatch:function(){
				eventBus.removeListener('event', handleEvent);
			},
			on:expression.on.bind(expression)
		}
	};

	var createStateConditionalEventWatcher = function createStateConditionalEventWatcher(eventWatcher, stateCondition){
		var eventPropegator = new EventEmitter();

		eventWatcher.on('triggered',function(e){
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
			on:eventPropegator.on.bind(eventPropegator),			
		}
	}

	return {
		createEventExpression: function createEventExpression(specification){
			var eventSpec = specification.on || specification;
			eventWatcher = createEventWatch(eventSpec);

			if(!specification.whilst){
				return eventWatcher;
			}

			var stateCondition = createStateExpression(specification.whilst);
			return createStateConditionalEventWatcher(eventWatcher, stateCondition);
		},
		createStateExpression:function(specification){return createStateExpression(specification.whilst);}		
	}
}