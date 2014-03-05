var assert = require("assert")
var ContextEngine = require('../core/contextEngine').ContextEngine;
var proxyquire = require('proxyquire');
var path = require('path');
var pathEndsWith = require('./testUtils').pathEndsWith;

describe('ContextEngine', function(){
  var contextEngine = new ContextEngine();

  describe('creating context engines', function(){
  	it('should ensure that a directory exists for user', function(done){
		var mock_mkdirp = function(dirToCreate){			
			assert.ok(pathEndsWith(dirToCreate, "data/userSpecific/someone"));
			done();
		};
		var contextEngineModule = proxyquire('../core/contextEngine',{'mkdirp':mock_mkdirp});

		var someUser = {id:'someone'};
		contextEngineModule.createContextEngine(someUser,function(){});
	});
  });

  describe('registering event', function(){  
  	
  	it('should emit event created for registered event', function(done){
  		var eventRaised;
  		contextEngine.on('event created', function(event){
  			eventRaised = event;
  		});

		var event = {hello:"world"};
  		
  		contextEngine.registerNewEvent(event, function(){
  			assert.equal(eventRaised, event);	
  			done();
  		});
	});
 	

  	describe("metadata", function(){
  		describe("timestamping", function(){
	  		it('should add metadata.time property to event when it does not already have one', function(done){
		  		var eventRaised;
		  		contextEngine.on('event created', function(event){
		  			eventRaised = event;
		  		});

				var event = {hello:"world"};
		  		
		  		contextEngine.registerNewEvent(event, function(){
		  			assert.notEqual(eventRaised.metadata, undefined);	
		  			assert.notEqual(eventRaised.metadata.time, undefined);	
		  			done();
		  		});
			});

			it('should not change metadata.time property if event already has one', function(done){
		  		var eventRaised;
		  		contextEngine.on('event created', function(event){
		  			eventRaised = event;
		  		});

		  		var originalTime = "2014-02-07T12:53:46.873Z";
				var event = {hello:"world", metadata:{time:originalTime}};
		  		
		  		contextEngine.registerNewEvent(event, function(){
		  			assert.equal(eventRaised.metadata.time, originalTime);	
		  			done();
		  		});
			});	
  		});
  		describe('event id', function(){
  			it('should add a unique id to events meta data if not already present',function(done){
  				var eventRaised;
		  		contextEngine.on('event created', function(event){
		  			eventRaised = event;
		  		});

				var event = {hello:"world"};
		  		
		  		contextEngine.registerNewEvent(event, function(){
		  			assert.notEqual(eventRaised.metadata, undefined);	
		  			assert.notEqual(eventRaised.metadata.id, undefined);	
		  			done();
		  		});
  			});
  		});	
  	});
	
  });
});