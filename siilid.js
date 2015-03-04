'use strict';

var canvas;

var _ = require('underscore');
var dom = require('./dom');
var Siil = require('./siil');
var animation = require('./animation');

window.addEventListener('load', init);

function init() {
	canvas = dom.byId('canvas');
	var siil = new Siil(canvas);
	setTimeout(function () {
		siil.walk.start();
		siil.container.animate(Infinity)
			.speed(1)
			.transition({ './@transform': 'translate(-400, 200),scale(0.5)' }, 0, 'ease')
			.transition({ './@transform': 'translate(400, 200),scale(2)' }, 4000, 'linear')
			.delay(200)
			.start();
	}, 1000);
}
