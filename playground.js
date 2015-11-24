var _ = require('lodash');
var fs = require('fs');
var mdd = require('./src/index');

//fs.writeFileSync('./tmp/result.json', JSON.stringify(mdd('./tests/data/data.md'), null, '  '));

var data = mdd('./tests/data/data.md');

var query0 = { selector: '/*' };
var query1 = { selector: '/Section 1/List/*' };
var query2 = { selector: 'list/a/*' };
var query3 = {
	selector: '/Section 1/List/*',
	columns: [
		{
			name: 'Entry',
			selector: '.',
			attribute: 'name'
		},
		{
			name: 'Value',
			selector: '.',
			attribute: 'value'
		}
	]
};
var query4 = {
	selector: '/Paragraph 1.1.1/list/*/x',
	columns: [
		{
			name: 'List',
			selector: '..',
			attribute: 'name'
		},
		{
			name: 'Value',
			selector: '.',
			attribute: 'value'
		}
	]
};

var __debug = function(msg) {
	// console.log('# ' + msg);
};

var isText = _.isString;
var isNode = function (x) { return isText(x.name); };
var isArray = _.isArray;
var isContainer = function (x) { return isArray(x.children); }
var isNodeWithChildren = function (x) { return isNode(x) && isContainer(x); };

var formatData = function (data) {
	if (isText(data)) {
		return 'Text(' + data + ')';
	} else if (isArray(data)) {
		return 'Array (' + _.size(data) + ')';
	} else if (isNodeWithChildren(data)) {
		return 'Node(' + data.name + ', ' + _.size(data) + ')';
	} else if (isNode(data)) {
		return 'Node(' + data.name + ')';
	} else {
		return 'Unknown';
	}
};

var parsePath = function (path) {
	if (typeof(path) == 'string') {
		return path.split("/");
	} else {
		return path;
	}
};

var escapeRegExp = function (str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var buildCriterium = function (pathPart) {
	return new RegExp(
		'^' + escapeRegExp(pathPart).
		replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$');
};

var testNode = function (data, criterium) {
	if (isText(data)) {
		__debug('TEST STRING ' + formatData(data));
		return criterium.test(data);
	} else if (isNode(data)) {
		__debug('TEST NODE ' + formatData(data));
		return criterium.test(data.name);
	} else {
		__debug('TEST UNKNOWN');
		return false;
	}
};

var formatResult = function (result) {
	var path = result[0];
	var node = result[1];
	if (isText(node)) {
		return { name: node, path: path };
	} else if (isNode(node)) {
		var result = _.omit(node, 'children');
		result.path = path;
		return result;
	} else {
		return null;
	}
};

var extendResultList = function (resultList, additionals) {
	function arraysEqual(a, b) {
		if (a === b) return true;
		if (a == null || b == null) return false;
		if (a.length != b.length) return false;
		for (var i = 0; i < a.length; ++i) {
			if (a[i] !== b[i]) return false;
		}
		return true;
	}
	_.forEach(additionals, function (x) {
		if (_.every(resultList, function (y) {
			return !arraysEqual(x.path, y.path);
		})) {
			resultList.push(x);
		}
	});
};

var resolvePath = function (coll, path) {
	if (_.size(path) == 0) {
		return null;
	}
	var n = { children: coll };
	_.forEach(path, function (i) {
		n = n.children[i];
	});
	return n;
};

var globPath = function globPath(coll, query_path, absolute, path, result) {
	if (isNodeWithChildren(coll)) {
		coll = coll.children;
	}
	if (!isArray(coll)) {
		__debug('GLOB ERROR Invalid input: ' + coll);
		return null;
	}
	__debug('GLOB ' + formatData(coll));
	__debug('GLOB Path (absolute=' + absolute + '): ' + query_path);
	path = path || [];
	result = result || [];
	var criterium = buildCriterium(query_path[0]);
	__debug('GLOB Criterium: ' + criterium);
	var selection = [];
	_.forEach(coll, function (e, i) {
		if (testNode(e, criterium)) {
			__debug('GLOB Select ' + i + ': ' + formatData(e));
			selection.push([path.concat([i]), e]);
		}
	});
	if (_.size(query_path) == 1) {
		extendResultList(result, _.map(selection, formatResult));
	} else if (_.size(query_path) > 1) {
		_.forEach(selection, function (s) {
			var p = s[0];
			var e = s[1];
			if (e.children) {
				result = globPath(e.children, _.drop(query_path),
					absolute, p, result);
			}
		});
	}
	if (!absolute) {
		_.forEach(coll, function (e, i) {
			if (isNodeWithChildren(e)) {
				result = globPath(e.children, query_path, false,
					path.concat([i]), result);
			}
		});
	}
	return result;
};

var findNodes = function (coll, selector) {
	var query_path = parsePath(selector);
	if (query_path.size == 0) {
		return null;
	}
	var absolute = query_path[0] == '';
	if (absolute) {
		query_path = _.drop(query_path, 1);
	}
	return globPath(data, query_path, absolute);
};

var findRelativeNode = function (coll, refPath, selector) {
	var query_path = parsePath(selector);
	
};

var table = function (data, query) {
	var nodes = findNodes(data, query.selector);
	if (isArray(query.columns)) {

	} else {
		if (_.every(nodes, function (n) { return n.value === undefined; })) {
			return {
				columns: [{ text: 'Name' }],
				rows: _.map(nodes, function (n) {
					var cell = { text: n.name };
					if (n.id) {
						cell.href = '#' + n.id;
					}
					return [cell];
				})
			};
		} else {
			return {
				columns: [
					{ text: 'Name' },
					{ text: 'Value' }
				],
				rows: _.map(nodes, function (n) {
					var nameCell = { text: n.name };
					if (n.id) {
						nameCell.href = '#' + n.id;
					}
					var valueCell = { text: n.value ? n.value : null };
					return [nameCell, valueCell];
				})
			};
		}
	}
};

var formatMarkdownCell = function (cell) {
	if (cell.href) {
		return '[' + cell.text + '](' + cell.href + ')';
	} else {
		return cell.text;
	}
};

var formatMarkdownTable = function (table) {
	var md = '| ' +
		_.map(table.columns,
			function (column) {
				return column.text;
			})
			.join(' | ') + ' |\n';
	md += '|' +
		_.map(table.columns,
			function (column) {
				return _.repeat('-', _.size(column.text) + 2);
			})
			.join('|') + '|\n';
	_.forEach(table.rows, function (cells) {
		md += '| ' +
			_.map(cells, formatMarkdownCell)
				.join(' | ') + ' |\n';
	});
	return md;
};

console.log(findNodes(data, '/Section 1'));
console.log(findNodes(data, '/Section 1/*/Subproperty*'));
console.log(findNodes(data, '?/x'));

console.log(formatMarkdownTable(table(data, query0)));
console.log(formatMarkdownTable(table(data, query1)));
console.log(formatMarkdownTable(table(data, query2)));
