'use strict';

var _ = require('underscore');

module.exports = {
	create: create
}

function create(xform) {
	if (arguments.length > 1) {
		xform = [].slice.apply(arguments);
	}
	if (typeof xform[0] === 'string') {
		xform = [xform];
	}
	return _(xform)
		.map(function (val) {
			val = [].slice.apply(val);
			var fn = val.shift();
			var params = val;
			if (fn === 'translate' || fn === 't' || fn === '+') {
				return 'translate($1, $2)'.format(params);
			} else if (fn === '-') {
				return 'translate(-$1, -$2)'.format(params);
			} else if (fn === 'rotate' || fn === 'r' || fn === '~') {
				return 'rotate($1)'.format(params);
			} else if (fn === 'scale' || fn === 's' || fn === '*') {
				return 'scale($1)'.format(params);
			}
		})
		.join(', ');
}
