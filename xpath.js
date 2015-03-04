'use strict';

var _ = require('underscore');

var resolutions = {
	svg: 'http://www.w3.org/2000/svg',
	xhtml: 'http://www.w3.org/1999/xhtml',
	mathml: 'http://www.w3.org/1998/Math/MathML'
};

module.exports = {
	bind: bind,
	bindOne: bindOne,
	resolutions: resolutions
};

function bind(el, expressions) {
	return new Bindings(el, expressions);
}

function bindOne(el, expression) {
	return new Binding(el, expr);
}

function resolver(prefix) {
	if (prefix in resolutions) {
		return resolutions[prefix];
	} else {
		return null;
	}
}

function Bindings(el, expressions) {
	var bindings = _(expressions)
		.map(function (expr, name) {
			/* TODO: expr can be object, containing expression, serializer, deserializer */
			/* The interpolators then only need to support array/object/number */
			/* serializer/deserializer could also be as simple as the String/Number functions */
			return {
				name: expressions instanceof Array ? expr : name,
				accessor: new Binding(el, expr)
			};
		});

	this.get = get.bind(this);
	this.set = set.bind(this);
	return this;

	function get() {
		return _(bindings).chain()
			.map(function (binding) {
				return [binding.name, binding.accessor.get()];
			})
			.object()
			.value();
	}

	function set(values) {
		bindings
			.forEach(function (binding) {
				if (binding.name in values) {
					binding.accessor.set(values[binding.name]);
				}
			});
	}
}

function Binding(el, expr) {
	var target = new XPathEvaluator().evaluate(expr, el, resolver,
		XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

	if (!target) {
		console.error('Cannot resolve XPath expression', expr, el);
		throw new Error('Failed to resolve XPath expression');
	}

	var prop;
	if (target.nodeType === 2) {
		prop = 'value';
	} else if (target.nodeType === 3) {
		prop = 'data';
	} else {
		throw new Error('Unsupported node type: ' + target.nodeType);
	}

	this.get = get.bind(this);
	this.set = set.bind(this);
	return this;

	function get() { 
		return target[prop];
	}

	function set(value) {
		target[prop] = value;
		if (target[prop] != value) {
			console.error('Failed to set value', this);
			throw new Error('Failed to set value');
		}
	}
}
