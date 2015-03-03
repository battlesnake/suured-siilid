'use strict';

module.exports = {
	linear: linear,
	stepIn: stepIn,
	stepOut: stepOut,
	easeIn: easeIn,
	easeOut: easeOut,
	ease: ease
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

function easeIn(t) {
}

function easeOut(t) {
}

function ease(t) {
}
