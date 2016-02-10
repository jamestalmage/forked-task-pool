'use strict';

module.exports = function (create, maxSize) {
	if (typeof create !== 'function') {
		throw new TypeError('create must be a function');
	}
	if (typeof maxSize !== 'number') {
		throw new TypeError('maxSize must be a number');
	}
	var size = 0;
	var pool = [];
	var pending = [];

	function returnHandler(handler) {
		if (pending.length) {
			pending.pop()(null, handler);
			return;
		}
		pool.push(handler);
	}

	function createHandler(cb) {
		if (size < maxSize) {
			size ++;
			create(cb);
			return;
		}
		pending.push(cb);
	}

	function exec() {
		var l = arguments.length - 1;

		var cb = arguments[l];

		var args = new Array(arguments.length);
		for (var i =0; i < l; i++) {
			args[i] = arguments[i];
		}

		var handler;

		args[l] = function() {
			returnHandler(handler);
			cb.apply(null, arguments);
		};

		if (pool.length) {
			handler = pool.pop();
			handler.apply(null, args);
		} else {
			createHandler(function (err, newHandler) {
				if (err) {
					cb(err);
					return;
				}
				handler = newHandler;
				newHandler.apply(null, args);
			});
		}
	}

	return exec;
};
