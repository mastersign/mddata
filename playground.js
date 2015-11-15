var fs = require('fs');
var mdd = require('./src/index');

//fs.writeFileSync('./tmp/result.json', JSON.stringify(mdd('./tests/data/data.md'), null, '  '));

var data = mdd('./tests/data/data.md');

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

var findSelection = function findSelection(data, selector, ref) {
	
};

console.log(findSelection(data, '/Section 1'));

