var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var createPath = require('./wrappedMkdirp').createPath;
var logger = require('../../../core/logger');

var baseUserDataPath = (process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific'));

function getValidDataPath(userId) {
    var userDataPath = path.join(baseUserDataPath, userId);
    var fileName = path.join(userDataPath, 'eventLog.txt');
    return new Promise(function (resolve, reject) {
        createPath(userDataPath, function (error) {
            if (error) {
                return reject(error);
            }
            resolve(fileName);
        });
    });
}

module.exports.persistEvent = function persistEvent(event) {
    getValidDataPath(event.userId).then(function (fileName) {
        var lineToAppend = JSON.stringify(event) + '\n';
        fs.appendFile(fileName, lineToAppend, function (err) {
            if (err) {
                logger.error('error appending event to', fileName);
                logger.error(err)
                throw err;
            } else {
                logger.log('successfully written event to', fileName);
            }
        });
    });
}
