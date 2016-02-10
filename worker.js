'use strict';

var optsString = process.argv[3];
var workerModule = require(process.argv[2]);

if (optsString) {
	workerModule = workerModule(JSON.parse(optsString));
}

function send(type, data) {
	process.send({
		type: type,
		data: data
	});
}

process.on('message', function (data) {
	workerModule(data, function (err, result) {
		if (err) {
			send('error', err);
			return;
		}
		send ('result', result);
	});
});

