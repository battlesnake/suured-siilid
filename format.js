var moreConflict = true;

module.exports.format = format;

if (moreConflict) {
	String.prototype.format = function () {
		var args = [].slice.apply(arguments);
		args.unshift(this);
		return format.apply(null, args);
	}
}

function format(str, args) {
	if (arguments.length > 2) {
		args = [].slice.apply(arguments).splice(1);
	}
	return str
		.replace(/\$(\d+)|{(\w+)}/g, function (all, m, n) {
			var id;
			if (m !== undefined) {
				id = m;
				id = Number(id);
				if (id > 0 && id <= args.length) {
					return args[id - 1];
				}
			} else if (n !== undefined) {
				id = n;
				if (args.hasOwnProperty(id)) {
					return args[id];
				}
			}
			throw new Error('Format string not found: "' + id + '"');
		});
}
