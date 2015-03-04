'use strict';

var sprites;

var _ = require('underscore');
var keyframes = require('./data/keyframes');
var dom = require('./dom');
var animation = require('./animation');
var transform = require('./transform');

window.keyframesLoaded = init;

module.exports = Siil;

Siil.prototype = {
	transform: transform_
}

function init() {
	var keyframesDoc = dom.byId('keyframes').get().contentDocument.documentElement;
	sprites = _(keyframes).chain()
		.map(function (data, key) {
			return {
				name: key,
				path: keyframesDoc.getElementById(key).getAttribute('d'),
				xform: data.svgTransform,
				size: data.transformedSize,
				template: null
			};
		})
		.map(function (sprite) {
			var path = dom.createSVG('path')
				.setAttrs({
					'd': sprite.path,
					'transform': sprite.xform
				})
				.classed('siil')
				;
			sprite.template = dom.createSVG('g')
				.append(path);
			return sprite;
		})
		.map(function (sprite) {
			return [sprite.name, sprite];
		})
		.object()
		.value()
		;
}

function Siil(parent) {
	var container = dom.createSVG('g').setAttr('transform', '').appendTo(parent);
	var el = sprites.stand.template.clone().appendTo(container).setClass('siil');
	/* TODO: Animation.js, allow changing of speed during animation */
	var walk = el.animate(Infinity).speed(40);
	['walk1', 'stand', 'walk2', 'stand']
		.map(function (name) {
			var sprite = sprites[name];
			return {
				'svg:path/@d': sprite.path,
				'svg:path/@transform': sprite.xform
			};
		})
		.forEach(function (trans) {
			walk
				.transition(trans, 600, 'ease')
				.delay(1000);
		});
	this.walk = walk;
	this.container = container;
	this.el = el;
}

function transform_() {
	this.container.setAttr('transform', transform.create.apply(args));
}
