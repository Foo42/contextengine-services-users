var EventEmitter = require('events').EventEmitter;
var objectMatches = require('../objectMatches');
var cron = require('cron');

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
		var isWatching = false;		

		var triggerEvent = function triggerEvent(){
			expression.emit('triggered');
		}
			
		if(specification.eventMatching){
			var processEventMatching = function processEventMatching(e){
				if(!isWatching){
					return;
				}				
				if(objectMatches(e, specification.eventMatching)){
					triggerEvent();
				}	
			};
			
			expression.on('processing event',processEventMatching);			
		}

		if(specification.cron){
			var cronJob = new cron.CronJob(specification.cron, triggerEvent);
			expression.on('starting watch', cronJob.start.bind(cronJob));
			expression.on('stopping watch', cronJob.stop.bind(cronJob));
		}

		var handleEvent = function(e){
			console.log('event detected');
			expression.emit('processing event',e);			
		};

		return {
			startWatch:function(){				
				isWatching = true;
				expression.emit('starting watch');
				eventBus.on('event created', handleEvent); //prefer it if the event bus wasnt just the context engine with its odd event name
			},
			stopWatch:function(){
				isWatching = false;
				expression.emit('stopping watch');
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