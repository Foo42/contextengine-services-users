require('chai').should();
var proxyquire = require('proxyquire');
var Promise = require('promise');
var EventEmitter = require('events').EventEmitter;

describe('eventStamper', function () {
	it('should add meta data to events arriving on the unregistered events queue and republish them on the contextEventExchange', function (done) {
		var newEventEmitter = new EventEmitter();
		var unregisteredEventQueue = Promise.resolve({
			topicEmitter: newEventEmitter
		});
		var contextEventExchange = Promise.resolve({
			publish: function (key, event) {
				event.metadata.id.should.not.equal(undefined);
				event.metadata.time.should.not.equal(undefined);
				done();
			}
		});
		var substitutions = {
			'./unregisteredEventQueue': unregisteredEventQueue,
			'./contextEventExchange': contextEventExchange
		}
		var stamper = proxyquire('../../index', substitutions);
		var unregisteredEvent = {};
		setImmediate(function () {
			newEventEmitter.emit('#', JSON.stringify(unregisteredEvent));
		});
	});
});
