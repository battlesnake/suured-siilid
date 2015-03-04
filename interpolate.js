'use strict';

var _ = require('underscore');

var format = require('./format');

var numberRx = /[\-\+]?\d+(?:\.\d+)?(?:[eE][\-\+]?\d+)?\b/g;

module.exports = {
	constant: constant,
	number: number,
	string: string,
	array: array,
	object: object,
	auto: auto
};

function constant(value) {
	return function (t) {
		return value;
	};
}

function number(start, end) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	start = Number(start);
	end = Number(end);
	var l = end - start;
	return function (t) {
		return start + t*l;
	};
}

function string(start, end) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	var groups = start.replace(numberRx, '\0').split('\0');
	var n0 = (start.match(numberRx) || []).map(Number);
	var n1 = (end.match(numberRx) || []).map(Number);
	var N = n0.length;
	if (!N) {
		return constant(end);
	}
	if (n0.length !== n1.length) {
		throw new Error('Inconsistent series lengths ($1, $2)'.format(n0.length, n1.length));
	}
	var i;
	var res = [];
	for (i = 0; i < groups.length; i++) {
		if (i > 0) {
			res.push('');
		}
		res.push(groups[i]);
	}
	var interps = [];
	for (i = 0; i < N; i++) {
		interps.push(number(n0[i], n1[i]));
	}
	return function (t) {
		for (var i = 0; i < N; i++) {
			res[i * 2 + 1] = interps[i](t);
		}
		return res.join('');
	};
}

function array(start, end) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	var interps = end
		.map(function (key) {
			return auto(start[key], end[key]);
		});
	return function (t) {
		return interps
			.map(function (interp) {
				return interp(t);
			});
	};
}

function object(start, end) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	var interps = _(end).keys()
		.map(function (key) {
			return {
				key: key,
				interp: auto(start[key], end[key])
			};
		});
	return function (t) {
		return interps
			.reduce(function (memo, data) {
				memo[data.key] = data.interp(t);
				return memo;
			}, {});
	};
}

function auto(start, end) {
	if (typeof end === 'object') {
		return object(start, end);
	} else if (typeof end === 'number') {
		return number(start, end);
	} else if (typeof end === 'string') {
		return string(start, end);
	} else if (start instanceof Array) {
		return array(start, end);
	} else if (typeof end === 'object') {
		return object(start, end);
	} else {
		console.warn('Failed to find suitable interpolator');
		return constant(start, end);
	}
}
