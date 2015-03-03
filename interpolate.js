'use strict';

var numberRx = /\b[\-\+]?\d+(?:\.\d+)?(?:[eE][\-\+]?\d+)?\b/g;

module.exports = {
	constant: constant,
	number: number,
	string: string
};

function constant(value) {
	return function (t) {
		return value;
	};
}

function number(start, end) {
	if (start === null || start === undefined) {
		return constant(start);
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
		return constant(start);
	}
	var groups = start.replace(numberRx, '\0').split('\0');
	var n0 = start.match(numberRx).map(Number);
	var n1 = end.match(numberRx).map(Number);
	if (n0.length !== n1.length) {
		throw new Error('Inconsistend series lengths');
	}
	var N = n0.length;
	if (!N) {
		return constant(start);
	}
	var res = [];
	for (var i = 0; i < groups.length; i++) {
		if (i > 0) {
			res.push('');
		}
		res.push(groups[i]);
	}
	var interps = [];
	for (var i = 0; i < N; i++) {
		interps.push(number(n0[i], n1[i]));
	}
	return function (t) {
		for (var i = 0; i < N; i++) {
			res[i * 2 + 1] = interps[i](t);
		}
		return res.join('');
	};
}
