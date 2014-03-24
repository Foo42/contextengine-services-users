var EventEmitter = require('events').EventEmitter;
var objectMatches = require('../objectMatches');

module.exports = function(eventBus, stateQueryService){
	var createStateExpression = function createStateExpression(specification){
		var expression = new EventEmitter();
		
		var stateCheck = function(done){
			if(specification.isActive){
				return stateQueryService.isStateActive(specification.isActive, done);
			}
			if(specification.isNotActive){
				return !stateQueryService.isStateActive(specification.isNotActive, function(err, result){
					done(err, !result);
				});	
			}
		}

		return {
			startWatch:function(){
				setImmediate(function(){
					console.log('about to perform state check');
					stateCheck(function(err, result){
						console.log('statecheck returned ' + arguments);
						if(!err){
							expression.emit('triggered', result);
						}
					});
				});
			},			
			onTriggered:function(f){expression.on('triggered',f)},
			evaluate:stateCheck
		}
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