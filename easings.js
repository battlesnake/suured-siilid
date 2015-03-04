'use strict';

var easings = module.exports = {
	linear: clamp(linear),
	stepIn: clamp(stepIn),
	stepOut: clamp(stepOut),
	easeIn: clamp(easeIn),
	easeOut: clamp(easeOut),
	easeInOut: clamp(easeInOut),
	ease: clamp(easeInOut),
	get: get
};

function clamp(fn) {
	return function (t) {
		if (typeof t !== 'number') {
			throw new Error('t must be a number');
		}
		t = t < 0 ? 0 : t > 1 ? 1 : t;
		return fn(t);
	};
}

function get(easing) {
	if (!easing) {
		return linear;
	} else if (typeof easing === 'string') {
		var easingName = easing.replace(/-(\w)/g, function (s, a) { return a.toUpperCase(); });
		if (easingName in easings) {
			return easings[easingName];
		} else {
			throw new Error('Easing "' + easingName + '" not found');
		}
	} else {
		throw new Error('Invalid value for "easing"');
	}
}

function linear(t) {
	return t;
}

function stepIn(t) {
	return t === 0 ? 0 : 1;
}

function stepOut(t) {
	return t === 1 ? 1 : 0;
}

var ease1 = 1.5;
var ease2 = 3;
var tanh1 = Math.tanh(ease1);
var tanh2 = Math.tanh(ease2);

function easeIn(t) {
	return -Math.tanh((t - 1) * ease1) / tanh1;
}

function easeOut(t) {
	return Math.tanh(t * ease1) / tanh1;
}

function easeInOut(t) {
	return (Math.tanh((t * 2 - 1) * ease2) / tanh2 + 1) / 2;
}
