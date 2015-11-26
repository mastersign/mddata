var path = require('path');
var fs = require('fs');
var os = require('os');
var assert = require('assert');

var mddata = require('../src/index');

var basePath = path.resolve('./test/data');

var checkFileTransformation = function (fileName) {
	var expectedFile = path.join(basePath, fileName + '.json');
	var expected = JSON.parse(fs.readFileSync(expectedFile, 'utf-8'));

	var sourceFile = path.join(basePath, fileName + '.md');
	var result = mddata(sourceFile);
	assert.deepEqual(result, expected, 'result after data extraction matches expected file content');
};

describe('data-extraction', function () {
	it('should extract the correct data structure', function() {
		checkFileTransformation('data');
	});
});
