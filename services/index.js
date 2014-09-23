var Promise = require('promise');
var fork = require('child_process').fork;

var childProcesses = [];

function startService(path) {
    var fullPath = require.resolve(path);
    return new Promise(function (resolve, reject) {
        var service = fork(fullPath, {
            silent: false
        });
        service.on('message', function (msg) {
            console.log('recieved message from historicalEventService, assuming ready');
            //assume ready message
            resolve();
        })
        childProcesses.push(service);
        process.on('exit', service.kill.bind(service));
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
    return Promise.all(
        [
            startService('./historicalEventService'),
            startService('./legacyContextEngine'),
            startService('./webFrontEnd')
        ]
    );
}
