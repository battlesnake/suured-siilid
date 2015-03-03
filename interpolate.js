'use strict';

var _ = require('underscore');

var easings = require('./easings');

var numberRx = /\b[\-\+]?\d+(?:\.\d+)?(?:[eE][\-\+]?\d+)?\b/g;

module.exports = {
	constant: constant,
	number: number,
	string: string,
	array: array,
	object: object,
	auto: auto
};

function ease(easing, fn) {
	if (!easing) {
		return fn;
	} else if (typeof easing === 'string') {
		easing = easings[easing.replace(/-(\w)/g, function (s, a) { return a.toUpperCase(); })];
	}
	if (easing === 'linear') {
		return fn;
	}
	return function (t) {
		return fn(easing(t));
	};
}

function constant(value) {
	return function (t) {
		return value;
	};
}

function number(start, end, easing) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	start = Number(start);
	end = Number(end);
	var l = end - start;
	return ease(easing, function (t) {
		return start + t*l;
	});
}

function string(start, end, easing) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	var groups = start.replace(numberRx, '\0').split('\0');
	var n0 = (start.match(numberRx) || []).map(Number);
	var n1 = (end.match(numberRx) || []).map(Number);
	if (n0.length !== n1.length) {
		throw new Error('Inconsistent series lengths');
	}
	var N = n0.length;
	if (!N) {
		return constant(start);
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
	return ease(easing, function (t) {
		for (var i = 0; i < N; i++) {
			res[i * 2 + 1] = interps[i](t);
		}
		return res.join('');
	});
}

function array(start, end, easing) {
	if (start === null || start === undefined) {
		return constant(end);
	}
	var interps = end
		.map(function (key) {
			return auto(start[key], end[key]);
		});
	return ease(easing, function (t) {
		return interps
			.map(function (interp) {
				return interp(t);
			});
	});
}

function object(start, end, easing) {
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
	return ease(easing, function (t) {
		return interps
			.reduce(function (memo, data) {
				memo[data.key] = data.interp(t);
				return memo;
			}, {});
	});
}

function auto(start, end, easing) {
	if (typeof end === 'object') {
		return object(start, end, easing);
	} else if (typeof end === 'number') {
		return number(start, end, easing);
	} else if (typeof end === 'string') {
		return string(start, end, easing);
	} else if (start instanceof Array) {
		return array(start, end, easing);
	} else if (typeof end === 'object') {
		return object(start, end, easing);
	} else {
		console.warn('Failed to find suitable interpolator');
		return constant(start, end, easing);
	}
}
