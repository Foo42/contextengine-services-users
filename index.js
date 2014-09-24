require('./services').bootstrapServices().then(function () {
    console.log('all services bootstrapped and reporting ready');
    process.send(JSON.stringify({
        status: "ready"
    }));
});
