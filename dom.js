/* Minimal d3/jQ-like library, does not support multiple elements */

var _ = require('underscore');

var format = require('./format');
var transform = require('./transform');

Wrapper.prototype = {
	getAttr: getAttr,
	setAttr: setAttr,
	setAttrs: polywrap(setAttr),
	getProp: getProp,
	setProp: setProp,
	setProps: polywrap(setProp),
	clone: clone,
	classed: polywrap(setClass),
	setClass: setClass,
	remove: remove,
	append: append,
	appendTo: appendTo,
	get: unwrap,
	transform: setTransform
};

dom.byId = getById;
dom.select = select;	
dom.createHTML = createHTML;
dom.createSVG = createSVG;

module.exports = dom;
module.exports.proto = Wrapper.prototype;

/* Helpers */

function polywrap(fn) {
	return function (obj) {
		var self = this;
		_(obj).each(function (val, key) {
			fn.bind(self)(key, val);
		});
		return this;
	};
}

function evil(val) {
	if (typeof val === 'function') {
		return val.bind(this)(this);
	} else {
		return val;
	}
}

/* Methods */

function dom(el) {
	if (!el) {
		throw new Error('No element provided');
	}
	return el ? new Wrapper(el) : null;
}

function getById(id) {
	return dom(document.getElementById(id));
}

function select(selector) {
	return dom(document.querySelector(selector));
}

function createHTML(name) {
	return dom(document.createElement(name));
}

function createSVG(name) {
	return dom(document.createElementNS('http://www.w3.org/2000/svg', name));
}

function Wrapper(el) {
	this.el = el;
}

function getAttr(key) {
	return this.get().getAttribute(key);
}

function setAttr(key, val) {
	this.get().setAttribute(key, evil(val));
	return this;
}

function getProp(key) {
	return this.get()[key];
}

function setProp(key, val) {
	this.get()[key] = evil(val);
	return this;
}

function clone() {
	return dom(this.get().cloneNode(true));
}

function setClass(name, set) {
	set = set === undefined ? true : evil(set);
	if (set) {
		this.get().classList.add(name);
	} else {
		this.get().classList.remove(name);
	}
	return this;
}

function remove() {
	this.get().remove();
	return this;
}

function append(el) {
	if (el instanceof Wrapper) {
		this.get().appendChild(el.get());
	} else {
		this.get().appendChild(el);
	}
	return this;
}

function appendTo(el) {
	if (el instanceof Wrapper) {
		el.append(this.get());
	} else {
		el.appendChild(this.get());
	}
	return this;
}

function unwrap() {
	return this.el;
}

function setTransform(xform) {
	this.setAttr('transform', transform.create.apply(null, arguments));
}
