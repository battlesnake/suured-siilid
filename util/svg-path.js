'use strict';

/*
 * TODO: One object per segment, don't have arrays of ops on each object as it
 * makes changing the middle of a path harder
 */

/* https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d */

var _ = require('lodash');

module.exports = {
};

var rx = {};
rx.num = '([\\-\\+]?\\d+(?:\\.\\d+)?([eE][\\-\\+]?\\d+)?)';
rx.coord = rx.num + ',' + rx.num;

function repeatRx(str, n) {
	var s = [];
	for (var i = 0; i < n; i++) {
		s.push(str);
	}
	return joinRx(s);
}

function joinRx() {
	return _(arguments).flatten().join('\\s*');
}

function parseCoord(str) {
	var m = str.match(coordRx);
	if (!m) {
		throw new Error('Invalid coördinate: ' + s);
	}
	return [
		Number(m[0]),
		Number(m[1])
	];
}

function parseNumber(str) {
	var m = str.match(numRx);
	if (!m) {
		throw new Error('Invalid number: ' + s);
	}
	return Number(m[0]);
}

function offset(p, o) {
	return [p[0] + o[0], p[1] + o[1]];
}

function setPen(pen, p) {
	pen[0] = p[0];
	pen[1] = p[1];
}

function getCoord(s, abs, pen) {
	var c = [parseFloat(s.shift()), parseFloat(s.shift())];
	if (!abs) {
		c[0] += pen[0];
		c[1] += pen[1];
	}
	return c;
}

function getNumber(s, abs, penn) {
	return parseFloat(s.shift()) + (abs ? 0 : penn);
}

function serializePoints() {
	return this.segments
		.map(function (pt) {
			return pt.join(',');
		})
		.join(' ');
}

function deserializePoints(ctor) {
	return 
	function deserializePoints(cmd, abs, pen) {
		var abs = cmd === cmd.toUpperCase();
		var rx = new RegExp(rx.coord, 'g');
		var m, p;
		var ops = [];
		while (m = rx.exec(s)) {
			p = getCoord(m, abs, pen);
			setPen(pen, p);
			ops.push(p);
		}
		return new ctor(ops);
	}
}

function MoveTo(segments) {
	this.segments = segments;
}

MoveTo.prototype = {
	command: 'M',
	serialize: serializePoints
};

MoveTo.deserialize = deserializePoints(MoveTo);

function LineTo(segments, restrict) {
	this.segments = segments;
	this.restrict = restrict;
}

LineTo.prototype = {
	serialize: serializePoints
};

LineTo.deserialize = deserializePoints(LineTo);

LineTo.deserializeHorz = function (cmd, abs, pen) {
	var abs = cmd === cmd.toUpperCase();
	var rx = new RegExp(rx.coord, 'g');
	var m, p;
	var ops = [];
	while (m = rx.exec(s)) {
		p = [getNumber(m, abs, pen[0]), pen[1]];
		setPen(pen, p);
		ops.push(p);
	}
	return new LineTo(ops, 'H');
}

LineTo.deserializeVert = function (cmd, abs, pen) {
	var abs = cmd === cmd.toUpperCase();
	var rx = new RegExp(rx.coord, 'g');
	var m, p;
	var ops = [];
	while (m = rx.exec(s)) {
		p = [pen[0], getNumber(m, abs, pen[1])];
		setPen(pen, p);
		ops.push(p);
	}
	return new LineTo(ops, 'V');
}

function CurveTo(segments) {
	this.segments = segments;
}

CurveTo.prototype = {
	serialize: serializeCurve
};

function serializeCurve() {
	return this.
		.map(function (op) {
			if (op.quadratic) {
				if (op.smooth) {
				} else {
				}
			} else {
				if (op.smooth) {
				} else {
				}
			}
		})
		.join(' ');
}

CurveTo.deserializeCubic = function CurveTo(cmd, abs, pen) {
	var abs = cmd === cmd.toUpperCase();
	var rx = new RegExp(repeatRx(rx.coord, 3), 'g');
	var m, p;
	var ops = [];
	while (m = rx.exec(s)) {
		var op = {
			control1: getCoord(m, abs, pen),
			control2: getCoord(m, abs, pen),
			point: getCoord(m, abs, pen)
		};
		/* TODO: Make control2 relative to point */
		setPen(pen, op.point);
		ops.push(op);
	}
	return new CurveTo(ops);
}

function decompile(d) {
	var parts = d.match(/[MLQTCSAZ][^MLQTCSAZ]+/gi) || [];
	var pen = [0, 0];
	return parts.map(function (s) { return s.trim(); })
		.map(function (s) {
			var cmd = s.charAt(0);
			var cmdU = cmd.toUpperCase();
			var ops = [];
			s = s.substr(1).trim();
			var m, rx, p;
			switch (cmd) {
			case 'M':
				return new MoveTo(cmd, abs, pen);
			case 'L':
				return new LineTo(cmd, abs, pen);
			case 'H':
				return new HorzTo(cmd, abs, pen);
			case 'V':
				return new VertTo(cmd, abs, pen);
			case 'T':
				rx = new RegExp(rx.coord, 'g');
				while (m = rx.exec(s)) {
					p = getCoord(m);
					if (!abs) {

					}
					pen = p;
					ops.push({ point: p });
				}
				break;
			case 'Q':
			case 'S':
				rx = new RegExp(repeatRx(rx.coord, 2), 'g');
				while (m = rx.exec(s)) {
					ops.push({
						control: getCoord(m),
						point: getCoord(m)
					});
				}
				break;
			case 'C':
				rx = new RegExp(repeatRx(rx.coord, 3), 'g');
				while (m = rx.exec(s)) {
					ops.push({
						control1: getCoord(m),
						control2: getCoord(m),
						point: getCoord(m)
					});
				}
				break;
			case 'A':
				rx = new RegExp(joinRx(rx.coord, rx.number, rx.coord, rx.coord), 'g');
				while (m = rx.exec(s)) {
					ops.push({
						radius: getCoord(m),
						rotation: getNumber(m),
						largeArc: !!getNumber(m),
						clockwise: !!getNumber(m),
						point: getCoord(m)
					});
				}
				break;
			case 'Z':
				break;
			default:
				throw new Error('Unknown path command: ' + cmd);
			}
			return {
				command: cmdU,
				absolute: abs,
				operations: ops
			};
		});
}


var d_spec = {
	M: 1,
	L: 1,
	Q: 2,
	T: 1,
	C: 3,
	S: 2,
	A: -1
};

function compile(cmds) {
}
