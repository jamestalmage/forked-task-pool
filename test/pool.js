import test from 'ava';
import pool from '../pool';
import delay from 'delay';

test('create must be a function', t => {
	t.throws(() => pool(3, 3), 'create must be a function');
});

test('maxSize must be number', t => {
	t.throws(() => pool(() => {}), 'maxSize must be a number');
});

function makeHandler() {
	var pending = false;
	var cb;
	var args;
	var callCount = 0;

	function handler(..._args) {
		if (pending) {
			throw new Error('already pending');
		}
		pending = true;
		callCount++;
		args = _args;
		cb = args.pop();
	}

	function call() {
		if (!pending) {
			throw new Error('not pending');
		}
		pending = false;
		cb.apply(null, args);
	}

	return {
		handler,
		api: {
			call,
			get callCount () {
				return callCount;
			},
			get pending () {
				return pending;
			}
		}
	};

}

function setup(maxSize) {
	const handlers = [];

	const exec = pool(cb => {
		var handler = makeHandler();
		handlers.push(handler.api);
		cb(null, handler.handler);
	}, maxSize);

	function handlerCount() {
		return handlers.length;
	}

	function pending() {
		return handlers.map(handler => handler.pending);
	}

	function callCount() {
		return handlers.map(handler => handler.callCount);
	}

	return {handlers, exec, handlerCount, pending, callCount};
}

test('it will create up to maxSize handlers as needed', t => {
	const {exec, handlerCount} = setup(3);
	t.is(handlerCount(), 0);
	exec(noop);
	t.is(handlerCount(), 1);
	exec(noop);
	t.is(handlerCount(), 2);
	exec(noop);
	t.is(handlerCount(), 3);
	exec(noop);
	t.is(handlerCount(), 3);
});

test('a new handler will not be created if one is already returned to the stack', t => {
	const {exec, handlers} = setup(2);

});

test('it will pass through the args', t => {
	t.plan(8);
	const {exec, handlers, handlerCount} = setup(3);
	exec('a', 'b', 'c', (...args) => t.same(args, ['a', 'b', 'c']));
	t.is(handlerCount(), 1);
	t.true(handlers[0].pending);
	handlers[0].call();
	t.false(handlers[0].pending);
	exec('d', 'e', 'f', (...args) => t.same(args, ['d', 'e', 'f']));
	t.is(handlerCount(), 1);
	t.true(handlers[0].pending);
	handlers[0].call();
	t.false(handlers[0].pending);
});

function noop(){}
