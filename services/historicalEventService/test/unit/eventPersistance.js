var proxyquire = require('proxyquire').noPreserveCache();
require('chai').should();
var pathEndsWith = require('../../../../test/server/unit/testUtils').pathEndsWith;

describe('Event persistance', function () {
    it.skip('should ensure the directory for the file exists when persisting event', function (done) {
        var fakeFs = {
            appendFile: function (filePath, content, callback) {
                callback();
            }
        }
        var mock_mkdirp = {
            createPath: function (dirToCreate) {
                pathEndsWith(dirToCreate, "data/userSpecific/someUser42/eventLog.txt").should.equal(true, 'filePath = ' + filePath);
                done();
            }
        };
        var eventPersistance = proxyquire('../../lib/eventPersistance', {
            './wrappedMkdirp': mock_mkdirp,
            'fs': fakeFs,
            'banana': {
                dance: function () {
                    console.log('banana');
                }
            }
        });

        eventPersistance.persistEvent({
            text: 'blah blah',
            userId: 'someUser42'
        });
    });

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
