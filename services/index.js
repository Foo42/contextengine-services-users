var Promise = require('promise');
var fork = require('child_process').fork;
var path = require('path');

process.env.USER_DATA_PATH = process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific');
console.log('user data path = ', process.env.USER_DATA_PATH);

var childProcesses = [];

function startService(path) {
    var fullPath = require.resolve(path);
    return new Promise(function (resolve, reject) {
        console.log('starting service:', path);
        var service = fork(fullPath, {
            silent: false
        });
        service.on('message', function (msg) {
            console.log('recieved message from ', path, ', assuming ready');
            //assume ready message
            resolve();
        })
        childProcesses.push(service);
        service.on('exit', console.log.bind(console, path, "exitted"));
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
            startService('./finateStateMachines'),
            startService('./webFrontEnd')
        ]
    );
}
