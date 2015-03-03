'use strict';

var _ = require('underscore');

var dom = require('./dom');
var interpolate = require('./interpolate');

module.exports = {
	create: create
};

Wrapper.prototype = {
	transition: transition,
	delay: delay,
	start: start,
	stop: stop
};

function time() {
	return new Date().getTime();
}

function create(el, repeat) {
	return new Wrapper(el, repeat);
}

function Wrapper(el, repeat) {
	this.el = el;
	this.repeat = repeat;
	this.stages = [];
	this.duration = 0;
	this.timeOffset = 0;
	this.currentIndex = 0;
	this.currentInterpolator = null;
	this.repeatsLeft = 0;
	this.frameRequest = null;
	this.frame = frame.bind(this);
}

function transition(end, duration, easing) {
	var el = this.el;
	this.stages.push({
		duration: duration,
		start: this.duration,
		interpolatorFactory: function () { return interpolate.object(getStart(), end, easing); },
		isNoop: false
	});
	this.duration += duration;
	return this;

	function getStart() {
		return _(end).chain()
			.keys()
			.map(function (key) {
				return [key, el.getAttribute(key)];
			})
			.object()
			.value();
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
	this.timeOffset = time();
	this.currentIndex = 0;
	this.currentInterpolator = this.stages[0].interpolatorFactory();
	this.repeatsLeft = this.repeat;
	this.running = true;
	this.frameRequest = requestAnimationFrame(this.frame);
	return this;
}

function stop() {
	if (!this.running) {
		return;
	}
	this.running = false;
	window.cancelAnimationFrame(this.frameRequest);
	this.frameRequest = null;
	return this;
}

function frame(timeStamp) {
	var dt = timeStamp; // - this.timeOffset;
	var currentIndex = this.currentIndex;
	if (currentIndex >= this.stages.length) {
		dt = this.duration;
	}
	var current = this.stages[currentIndex];
	while (dt > current.start + current.duration) {
		if (!current.isNoop) {
			dom(this.el).setAttrs(current.interpolatorFactory()(1));
		}
		currentIndex++;
		if (currentIndex === this.stages.length) {
			if (this.repeatsLeft === 0) {
				return;
			}
			this.currentIndex = 0;
			do {
				this.repeatsLeft--;
				this.timeOffset += this.duration;
			} while (this.timeOffset + this.duration < timeStamp);
		}
		current = this.stages[currentIndex];
		this.currentInterpolator = current.isNoop ? null : current.interpolatorFactory();
	}
	if (!current.isNoop) {
		dom(this.el).setAttrs(this.currentInterpolator((dt - current.start) / current.duration));
	}
	this.frameRequest = requestAnimationFrame(this.frame);
}
