'use strict';

var easings = module.exports = {
	linear: linear,
	stepIn: stepIn,
	stepOut: stepOut,
	easeIn: easeIn,
	easeOut: easeOut,
	easeInOut: easeInOut,
	ease: easeInOut
};

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
