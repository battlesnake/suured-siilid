'use strict';

var canvas, sprites;

var dom = require('./dom');

window.addEventListener('load', init);

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
	debugger;
	var el = sprites.stand.template.clone();
	el.appendTo(canvas)
		.transform(['+', 400, 200]);
}
