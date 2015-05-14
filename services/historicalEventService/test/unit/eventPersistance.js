var proxyquire = require('proxyquire').noPreserveCache();
require('chai').should();
var pathEndsWith = require('../../../../test/server/unit/testUtils').pathEndsWith;

describe('Event persistance', function () {
    it('should append a line to correct users file when handed event to persist', function (done) {
        var fakeFs = {
            appendFile: function (filePath, content, callback) {
                pathEndsWith(filePath, "data/userSpecific/someUser42/eventLog.txt").should.equal(true, 'filePath = ' + filePath);
                done();
            }
        }

        var eventPersistance = proxyquire('../../lib/eventPersistance', {
            'fs': fakeFs
        });

        eventPersistance.persistEvent({
            text: 'blah blah',
            userId: 'someUser42'
        });
    });
});
