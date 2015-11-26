var path = require('path');
var fs = require('fs');
var os = require('os');
var assert = require('assert');

var mddata = require('../src/index');

var basePath = path.resolve('./test/data');

var checkFileTransformation = function (done, fileName) {
	var expectedFile = path.join(basePath, fileName + '.json');
	var expected = fs.readFileSync(expectedFile, 'utf-8').replace(new RegExp(os.EOL, "g"), "\n");

	var sourceFile = path.join(basePath, fileName + '.md');
	var result = JSON.stringify(mddata(sourceFile), null, '  ');
	assert.equal(result, expected, 'result after data extraction matches expected file content');
	done();
};

describe('data-extraction', function () {
	it('should extract the correct data structure', function(done) {
		checkFileTransformation(done, 'data');
	});
});
