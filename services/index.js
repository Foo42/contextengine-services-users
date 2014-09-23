var Promise = require('promise');
var fork = require('child_process').fork;

var childProcesses = [];

function startHistoricalEventService() {
    var fullPath = require.resolve('./historicalEventService');
    return new Promise(function (resolve, reject) {
        var historicalEventService = fork(fullPath, {
            silent: false
        });
        historicalEventService.on('message', function (msg) {
            console.log('recieved message from historicalEventService, assuming ready');
            //assume ready message
            resolve();
        })
        childProcesses.push(historicalEventService);
        process.on('exit', historicalEventService.kill.bind(historicalEventService));
        // setTimeout(resolve, 200); //Arbitrary delay at the moment
    });
}

function cleanUpChildProcesses() {
    console.log('recieved signal - terminating child processes');
    childProcesses.forEach(function (child) {
        child.kill();
    });
    setTimeout(process.exit.bind(process), 500);
}

module.exports.bootstrapServices = function () {
    process.on('SIGINT', cleanUpChildProcesses);
    process.on('SIGTERM', cleanUpChildProcesses);
    return startHistoricalEventService();
}
