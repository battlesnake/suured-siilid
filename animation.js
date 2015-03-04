'use strict';

var _ = require('underscore');

var dom = require('./dom');
var xpath = require('./xpath');
var interpolate = require('./interpolate');
var easings = require('./easings');

module.exports = {
	create: create
};

Wrapper.prototype = {
	transition: transition,
	delay: delay,
	start: start,
	stop: stop,
	pause: pause,
	resume: resume,
	speed: speed
};

dom.proto.animate = function (repeat) {
	return create(this.get(), repeat);
};

function time() {
	return new Date().getTime();
}

function create(el, repeat) {
	return new Wrapper(el, repeat);
}

function Wrapper(el, repeat) {
	this.el = el;
	this.repeat = repeat || Infinity;
	this.stages = [];
	this.duration = 0;
	this.timeOffset = 0;
	this.currentIndex = 0;
	this.currentInterpolator = null;
	this.repeatsLeft = 0;
	this.frameRequest = null;
	this.frame = frame.bind(this);
	this.speedMultiplier = 1;
}

function speed(factor) {
	this.speedMultiplier *= factor;
	return this;
}

function transition(end, duration, easing) {
	var el = this.el;
	var binding = xpath.bind(el, _(end).keys()); 
	var easingFn = easings.get(easing);
	this.stages.push({
		duration: duration,
		start: this.duration,
		binding: binding,
		interpolatorFactory: interpolatorFactory,
		isNoop: false,
		finalState: end
	});
	this.duration += duration;
	return this;

	function interpolatorFactory() {
		var start = binding.get();
		return function (t) {
			var interpolator = interpolate.object(start, end);
			return interpolator(easingFn(t));
		}
	}
}

function delay(duration) {
	this.stages.push({
		duration: duration,
		start: this.duration,
		isNoop: true
	});
	this.duration += duration;
	return this;
}

function start() {
	if (this.running) {
		return;
	}
	this.timeOffset = 0;
	this.currentIndex = 0;
	this.currentInterpolator = this.stages[0].interpolatorFactory();
	this.repeatsLeft = this.repeat;
	this.running = true;
	this.pausedAt = null;
	if (this.stages.length > 0) {
		this.frameRequest = requestAnimationFrame(this.frame);
	}
	return this;
}

function stop() {
	if (!this.running) {
		return;
	}
	this.running = false;
	this.pausedAt = null;
	window.cancelAnimationFrame(this.frameRequest);
	this.frameRequest = null;
	return this;
}

function pause() {
	if (!this.running || this.pausedAt) {
		return;
	}
	this.pausedAt = time();
}

function resume() {
	if (!this.pausedAt) {
		return;
	}
	this.timeOffset += time() - this.pausedAt();
	this.pausedAt = null;
}

function frame(timeStamp) {
	if (this.pausedAt) {
		next();
		return
	}

	var getDt = getDt_.bind(this);
	var next = next_.bind(this);

	var current = this.stages[this.currentIndex];
	while (getDt() > current.start + current.duration) {
		if (!current.isNoop) {
			setState(current.finalState);
		}
		this.currentIndex++;
		if (this.currentIndex === this.stages.length) {
			this.currentIndex = 0;
			do {
				if (this.repeatsLeft === 0) {
					this.stop();
					return;
				}
				this.repeatsLeft--;
				this.timeOffset += this.duration / this.speedMultiplier;
			} while (this.timeOffset + this.duration < timeStamp);
		}
		current = this.stages[this.currentIndex];
		this.currentInterpolator = current.isNoop ? null : current.interpolatorFactory();
	}

	if (!current.isNoop) {
		var t = (getDt() - current.start) / current.duration;
		var interpolation = this.currentInterpolator(t);
		setState(interpolation);
	}

	next();
	return;

	function getDt_() {
		return (timeStamp - this.timeOffset) * this.speedMultiplier;
	}

	function next_() {
		this.frameRequest = requestAnimationFrame(this.frame);
	}

	function setState(state) {
		current.binding.set(state);
	}
}
