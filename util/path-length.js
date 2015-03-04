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
	if (cmd === '--help') {
		help();
	} else if (cmd.substr(0, 2) === '--') {
		console.error('Wtf is "' + cmd + '"?');
		help();
	} else {
		id.push(cmd);
	}
}

var page = require('webpage').create();

if (img === '-') {
	page.content = system.stdin.read();
	loaded();
} else {
	page.open(img, loaded);
}

/*******************************************************************************/

function help() {
	[
		'path-length.js  {file}  [ {id} ] [ {id} ]',
		'\tIf {file} is -, data is read from STDIN',
		'\t{id} specifies the ID attribute of the element to measure the bounding box of.  Default is all items which have an id attribute.'
	].forEach(function (s) { console.warn(s); });
	phantom.exit(1);
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

	var num = '\\b[\\-\\+]?\\d+(?:\\.\\d+)?([eE][\\-\\+]?\\d+)?\\b';
	var coord = num + ',' + num;
	var pt = '(?:M ' + coord + '|C ' + coord + ' ' + coord + ' ' + coord + ')';
	var ptRx = new RegExp(pt, 'g');
	var pts = data.match(ptRx);
}

function getBBox(id) {
	var el = document.getElementById(id);
	if (!el) {
		return 0;
	}
	return el.getAttribute('path');
}

function getBBoxes() {
	var els = [].slice.apply(document.querySelectorAll('path[id]'));
	return els.map(function (el) {
		return {
			id: el.id,
			data: el.getAttribute('path')
		};
	});
}

})();
