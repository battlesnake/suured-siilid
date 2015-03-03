#!/usr/bin/env phantomjs
(function () {
'use strict';

var system = require('system');

var args = [].slice.apply(system.args);

args.shift();

if (!args.length) {
	help();
}

var img = !args[0].match(/^--/) && args.shift();
var id = [];
var verbose = false;
var htmlwrap = null;
var save = null;
var varName = null;

function getArg() {
	if (args.length) {
		return args.shift();
	} else {
		console.error('Argument expected');
		phantom.exit(1);
	}
}

while (args.length) {
	var cmd = getArg();
	if (cmd === '--html-wrap') {
		htmlwrap = [Number(getArg()), Number(getArg())];
	} else if (cmd === '--verbose') {
		verbose = true;
	} else if (cmd === '--save') {
		save = getArg();
	} else if (cmd === '--help') {
		help();
	} else if (cmd === '--var-name') {
		varName = getArg();
	} else if (cmd.substr(0, 2) === '--') {
		console.error('Wtf is "' + cmd + '"?');
		help();
	} else {
		id.push(cmd);
	}
}

var page = require('webpage').create();

if (img === '-') {
	if (htmlwrap) {
		phantom.exit(1);
	}
	page.content = system.stdin.read();
	loaded();
} else {
	if (htmlwrap) {
		page.content = [
			'<!doctype html>',
			'<html style="margin: 0; padding: 0; border: 0; background: transparent;">',
			'<head>',
			'<meta charset="utf8">',
			'<title></title>',
			'</head>',
			'<body style="margin:0; padding: 0; border: 0; background: transparent;">',
			'</body>',
			'</html>'
		].join('\n');
		loaded();
	} else {
		page.open(img, loaded);
	}
}

/*******************************************************************************/

function help() {
	[
		'svg-bbox.js  {file}  [ {id} ] [ {id} ]  [ --html-wrap {w} {h} ]  [ --save {save} ]  [ --var-name {varname} ]  [ --verbose ]',
		'\tIf {file} is -, data is read from STDIN',
		'\t{id} specifies the ID attribute of the element to measure the bounding box of.  Default is all items inside the first <defs> tag which have an id attribute.',
		'\thtml-wrap generates a HTML document that <use>s the image specified by {file}#{id}, then measures the bounding box of that <use> element.  {w} and {h} are the width and height for the viewBox.',
		'\t{save} is used by format "IMAGE".  "image-{id}.png" will have the "{id}" part replaced with the element id.  Likewise, use "{index}" to replace with zero-based index of id in passed id list.',
		'\t{varname} prepends "var {varname}=" to the JSON output, ideal for embedding the result via <script> tag.  Prepend ^ to omit the "var" (e.g. for browserify).'
	].forEach(function (s) { console.warn(s); });
	phantom.exit(1);
}

function rf(n) {
	return Math.floor(n * 10) / 10;
}

function rc(n) {
	return Math.ceil(n * 10) / 10;
}

function fail() {
	console.error.apply(console, arguments);
	phantom.exit(1);
	throw new Error();
}

function loaded(status) {
	if (status && status !== 'success') {
		fail('Failed to open ' + img);
	}

	if (htmlwrap) {
		var svg = [
			'	<svg viewBox="0 0 ' + htmlwrap.join(' ') + '">',
			'		<use id="img" xlink:href="' + img + '#' + id + '"></use>',
			'	</svg>'
		].join('\n');
		page.evaluate(function (svg) {
			document.body.innerHTML = svg;
		}, svg);
	}

	function checkState() {
		if (page.evaluate(function () { return document.readyState === 'complete'; })) {
			run();
		} else {
			setTimeout(checkState, 10);
		}
	}

	setTimeout(checkState, 30);
}

function run() {
	/* analyse page */
	var data;
	if (id.length) {
		data = id.map(function (id) {
			return {
				id: id,
				data: page.evaluate(getBBox, id)
			};
		});
	} else {
		data = page.evaluate(getBBoxes);
	}
	
	var result = data.reduce(function (memo, data, index) {
		memo[data.id] = processResult(data.data, data.id, index);
		return memo;
	}, {});
	
	var prefix = varName ? (varName.charAt(0) === '^' ? varName.substr(1) : 'var ' + varName) + '=' : '';

	console.info(prefix + JSON.stringify(result));
	/* exit phantom */
	phantom.exit();
}

function processResult(data, id, index) {
	if (!data || data === 0) {
		fail('Cannot find element "' + id + '"');
	} else if (data === 1) {
		fail('Element "' + id + '" lacks getBBox method');
	}

	var result = {};
	/* json */
	result.json = data;
	/* svg-transform */
	var scale = 100 / Math.max(data.width, data.height);
	result.svgTransform = 'scale(' + scale + ',' + scale + '), translate(' + -data.x + ',' + -data.y + ')';
	/* transformed-size */
	result.transformedSize = [data.width * scale, data.height * scale];
	/* svg-viewbox */
	result.svgViewBox = [data.x, data.y, data.width, data.height].join(' ');
	/* svg-attrs */
	result.svgAttrs = 'viewBox="' + [data.x, data.y, data.width, data.height].join(' ') + '" width="' + data.width + '" height="' + data.height + '"';
	/* coords */
	result.coords = rc(data.width) + 'x' + rc(data.height) + '+' + rf(data.x) + '+' + rf(data.y);
	/* image */
	if (save) {
		var filename = save.replace(/{id}/g, id).replace(/{index}/g, index);
		page.render(filename);
		result.image = filename;
	}

	return result;
}

function getBBox(id) {
	var el = document.getElementById(id);
	if (!el) {
		return 0;
	}
	if (!el.getBBox) {
		return 1;
	}
	return el.getBBox();
}

function getBBoxes() {
	var els = [].slice.apply(document.querySelectorAll('defs>*[id]'));
	return els.map(function (el) {
		return {
			id: el.id,
			data: el.getBBox()
		};
	});
}

})();
