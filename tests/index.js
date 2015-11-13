var path = require('path');
var fs = require('fs');
var os = require('os');
var test = require('tape').test;

var mddata = require('../src/index');

var basePath = path.resolve('tests/data');

var checkFileTransformation = function (t, fileName) {
	var expectedFile = path.join(basePath, fileName + '.json');
	var expected = fs.readFileSync(expectedFile, 'utf-8').replace(new RegExp(os.EOL, "g"), "\n");

	var sourceFile = path.join(basePath, fileName + '.md');
	var result = JSON.stringify(mddata(sourceFile), null, '  ');
	t.equals(expected, result, 'result after data extraction matches expected file content');
	t.end();
};

test('data-extraction', function(t) {
	checkFileTransformation(t, 'data');
});
