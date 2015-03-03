'use strict';

var canvas, sprites;

var _ = require('underscore');
var keyframes = require('./data/keyframes');
var dom = require('./dom');
var animation = require('./animation');

window.keyframesLoaded = init;

function init() {
	canvas = dom.byId('canvas');
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

	start();
}

function start() {
	var keys = ['walk1', 'stand', 'walk2', 'stand'];
	var el = sprites.stand.template.clone();
	el.appendTo(canvas)
		.transform(['+', 400, 200]);
	var anim = animation.create(el.get(), Infinity);
	anim
		.transition({ path: sprites.walk1.path }, 600, 'ease')
		.delay(1000)
		.transition({ path: sprites.stand.path }, 600, 'ease')
		.delay(1000)
		.transition({ path: sprites.walk2.path }, 600, 'ease')
		.delay(1000)
		.transition({ path: sprites.stand.path }, 600, 'ease')
		.start()
		;
}
