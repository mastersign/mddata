var _ = require('lodash');
var fs = require('fs');
var mdd = require('./src/index');

//fs.writeFileSync('./tmp/result.json', JSON.stringify(mdd('./tests/data/data.md'), null, '  '));

var query0 = { selector: '/*' };
var query1 = { selector: '/Section 1/List/*' };
var query2 = { selector: 'list/a/*' };
var query3 = {
	selector: '/Section 1/Property */*',
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
	selector: 'list/*/x',
	columns: [
		{
			name: 'Chapter',
			selector: '../../..',
			attribute: 'name'
		},
		{
			name: 'List',
			selector: '..',
			attribute: 'name'
		},
		{
			name: 'Value',
			selector: '.',
			attribute: 'value'
		},
		{
			name: 'Y',
			selector: '../y',
			attribute: 'value'
		}
	]
};

var __debug = function(msg) {
	// console.log('# ' + msg);
};

var isText = _.isString;
var isNode = function (x) { return x && isText(x.name); };
var isArray = _.isArray;
var isContainer = function (x) { return x && isArray(x.children); };
var isNodeWithChildren = function (x) { return x && isNode(x) && isContainer(x); };

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
	var regex = new RegExp(
		'^' + escapeRegExp(pathPart).
		replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$');
	return function (x) {
		if (isText(x)) {
			return regex.test(x);
		} else if (isNode(x)) {
			return regex.test(x.name);
		} else {
			return false;
		}
	};
};

var formatResult = function (selection) {
	if (!selection) {
		return null;
	}
	var path = selection[0];
	var node = selection[1];
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
		if (a === null || b === null) return false;
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
	if (_.size(path) === 0) {
		return null;
	}
	var n = { children: coll };
	_.forEach(path, function (i) {
		n = n.children[i];
	});
	if (isText(n)) {
		n = { name: n };
	}
	return n;
};

var globPath = function globPath(coll, queryPath, absolute, path, result) {
	if (isNodeWithChildren(coll)) {
		coll = coll.children;
	}
	if (!isArray(coll)) {
		__debug('GLOB ERROR Invalid input: ' + coll);
		return null;
	}
	__debug('GLOB ' + formatData(coll));
	__debug('GLOB Path (absolute=' + absolute + '): ' + queryPath);
	path = path || [];
	result = result || [];
	var criterium = buildCriterium(queryPath[0]);
	var selections = [];
	_.forEach(coll, function (n, i) {
		if (criterium(n)) {
			__debug('GLOB Select ' + i + ': ' + formatData(n));
			selections.push([path.concat([i]), n]);
		}
	});
	if (_.size(queryPath) == 1) {
		extendResultList(result, _.map(selections, formatResult));
	} else if (_.size(queryPath) > 1) {
		_.forEach(selections, function (s) {
			var p = s[0];
			var e = s[1];
			if (e.children) {
				result = globPath(e.children, _.drop(queryPath),
					absolute, p, result);
			}
		});
	}
	if (!absolute) {
		_.forEach(coll, function (n, i) {
			if (isNodeWithChildren(n)) {
				result = globPath(n.children, queryPath, false,
					path.concat([i]), result);
			}
		});
	}
	return result;
};

var findNodes = function (coll, selector) {
	var queryPath = parsePath(selector);
	if (queryPath.size === 0) {
		return null;
	}
	var absolute = queryPath[0] === '';
	if (absolute) {
		queryPath = _.drop(queryPath, 1);
	}
	return globPath(coll, queryPath, absolute);
};

var firstMatchingChild = function (node, criterium) {
	var nodesWithIndex = _.map(
		node.children,
		function (n, i) { return [i, n]; });
	var matchingNodesWithIndex = _.filter(
		nodesWithIndex,
		function (r) { return criterium(r[1]); });
	return _.first(matchingNodesWithIndex);
};

var findRelativeNode = function (coll, refPath, selector) {
	var queryPath = parsePath(selector);
	var n = resolvePath(coll, refPath);
	__debug('FIND RELATIVE ROOT ' + formatData(n));
	_.forEach(queryPath, function (q) {
		__debug('FIND RELATIVE POS ' + refPath + ': ' + q);
		if (q === '' || q === '.') {
			__debug('FIND RELATIVE skip');
			return;
		} else if (q === '..') {
			__debug('FIND RELATIVE parent');
			refPath = _.dropRight(refPath);
			n = resolvePath(coll, refPath);
		} else {
			var r = firstMatchingChild(n, buildCriterium(q));
			if (r) {
				__debug('FIND RELATIVE children: ' + q + ' -> ' + r[1].name);
				n = r[1];
				refPath.push(r[0]);
			} else {
				__debug('FIND RELATIVE children: ' + q + ' NOT FOUND');
			}
		}
	});
	return n;
};

var cellFromNode = function(node, attribute) {
	if (!node) {
		return null;
	}
	if (attribute === 'name') {
		var cell = { text: node.name };
		if (node.id) {
			cell.href = '#' + node.id;
		}
		return cell;
	}
	if (attribute === 'value') {
		return { text: node.value ? node.value : null };
	}
	return { text: 'unknown attribute: ' + attribute };
}

var table = function (data, query) {
	var nodes = findNodes(data, query.selector);
	if (isArray(query.columns)) {
		return {
			columns: _.map(query.columns, function (col) {
				return { text: col.name };
			}),
			rows: _.map(nodes, function (node) {
				return _.map(query.columns, function (col) {
					var cellNode = findRelativeNode(
						data, node.path, col.selector);
					return cellFromNode(cellNode, col.attribute);
				});
			})
		};
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
	if (!cell) {
		return '';
	}
	if (cell.href) {
		return '[' + cell.text + '](' + cell.href + ')';
	}
	return cell.text;
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

var data = mdd('./tests/data/data.md');

console.log(findNodes(data, '/Section 1'));
console.log(findNodes(data, '/Section 1/*/Subproperty*'));
console.log(findNodes(data, '?/x'));

console.log(formatMarkdownTable(table(data, query0)));
console.log(formatMarkdownTable(table(data, query1)));
console.log(formatMarkdownTable(table(data, query2)));

console.log(formatMarkdownTable(table(data, query3)));
console.log(formatMarkdownTable(table(data, query4)));
