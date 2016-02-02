var Promise = require('promise');
var fork = require('child_process').fork;
var path = require('path');
var _ = require('lodash');
var connectToStatusNet = require('../core/serviceStatus').connect();

process.env.RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
process.env.USER_DATA_PATH = process.env.USER_DATA_PATH || path.join(path.dirname(require.main.filename), 'data', 'userSpecific');
console.log('user data path = ', process.env.USER_DATA_PATH);

var childProcesses = [];

function guessServiceName(path) {
    var parts = path.split('/');
    return parts.pop();
}

function startService(path, serviceName) {
    var fullPath = require.resolve(path);
    serviceName = serviceName || guessServiceName(path);
    return new Promise(function (resolve, reject) {
        console.log('starting service:', serviceName, path);
        var service = fork(fullPath, {
            silent: false,
            env: _.extend(process.env, {
                'SERVICE_NAME': serviceName
            })
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

    connectToStatusNet.then(function (statusNet) {
        statusNet.awaitOnline('users').then(console.log.bind(console, 'Users detected as online'));
    });

    return Promise.all(
        [
            // startService('./users'),
            // startService('./eventStamper'),
            // startService('./historicalEventService'),
            // startService('./finiteStateMachines'),
            // startService('./cron'),
            // startService('./webFrontEnd'),
            // startService('./notifier')
        ]
    );
}
