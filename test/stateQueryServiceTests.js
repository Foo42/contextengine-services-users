var assert = require("assert")
var EventEmitter = require('events').EventEmitter;
var StateQueryService = require('../core/stateQueryService');

describe('StateQueryService,', function(){
	describe('created query objects', function(){
		it('should return current state from state engine',function(done){
			var stateEngine = {
				isStateActive:function(stateName, callback){
					return callback(null, true);
				},
				on: function(){}
			};

			var stateQueryService = StateQueryService(stateEngine);
			var query = stateQueryService.createQuery('foo');
			query.currentValue(function(err, value){
				assert.equal(value, true);
				done();
			});
		});

		it('should raise valueChanged events when watching a state which becomes active',function(done){
			var stateEngine = new EventEmitter();
			stateEngine.isStateActive = function(){};
			stateEngine.fakeStateActivating = function(stateName){
				var stateActivedEvent = {type:'stateChange.activated', stateName:stateName};
				stateEngine.emit('stateChange.activated', stateActivedEvent);
			};

			var stateQueryService = StateQueryService(stateEngine);
			var query = stateQueryService.createQuery('foo');

			query.on('watching',function(){
				stateEngine.fakeStateActivating('foo');
			});

			query.on('valueChanged',function(isActive){
				assert.equal(isActive, true);
				done();
			});

			query.startWatch();
		});

		it('should not raise valueChanged events when not watching a state', function(){
			var stateEngine = new EventEmitter();
			stateEngine.isStateActive = function(){};
			stateEngine.fakeStateActivating = function(stateName){
				var stateActivedEvent = {type:'stateChange.activated', stateName:stateName};
				stateEngine.emit('stateChange.activated', stateActivedEvent);
			};

			var stateQueryService = StateQueryService(stateEngine);
			var query = stateQueryService.createQuery('foo');

			query.on('watching',function(){
				query.stopWatch();
				stateEngine.fakeStateActivating('foo');
			});

			query.on('valueChanged',function(isActive){
				assert.equal(isActive, true);
				assert.fail();
			});

			query.startWatch();
		});
	});
});