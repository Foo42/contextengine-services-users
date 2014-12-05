var fs = require('fs');
var path = require('path');
var log = console.log.bind(console, 'HistorialEventService:');
var Promise = require('promise');
var createPath = require('./wrappedMkdirp').createPath;
// require('banana').dance();

var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));

function getValidDataPath(userId) {
    var userDataPath = path.join(baseUserDataPath, userId);
    var fileName = path.join(userDataPath, 'eventLog.txt');
    return new Promise(function (resolve, reject) {
        console.log('about to createPath');
        createPath(userDataPath, function (error) {
            console.log('in createPath callback in', error);
            if (error) {
                return reject(error);
            }
            resolve(fileName);
        });
    });
}

module.exports.persistEvent = function persistEvent(event) {
    log('persisting event to disk');
    getValidDataPath(event.userId).then(function (fileName) {
        var lineToAppend = JSON.stringify(event) + '\n';
        log('appending event to', fileName);
        fs.appendFile(fileName, lineToAppend, function (err) {
            if (err) {
                console.error('error appending event to', fileName);
                console.error(err)
                throw err;
            } else {
                log('successfully written event to', fileName);
            }
        });
    });
}
