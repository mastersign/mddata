/* globals require, describe, it */

var path = require('path');
var fs = require('fs');
var assert = require('assert');

var mddata = require('../src/index');

var basePath = path.resolve('./test/data');

var checkFileTransformation = function (fileName) {
	'use strict';
	var expectedFile = path.join(basePath, fileName + '.json');
	var expected = JSON.parse(fs.readFileSync(expectedFile, 'utf-8'));

	var sourceFile = path.join(basePath, fileName + '.md');
	var result = mddata(fs.readFileSync(sourceFile, 'utf-8'));
	assert.deepEqual(result, expected, 'result after data extraction matches expected file content');
};

describe('mddata', function () {
	'use strict';

	it('should extract the expected data structure', function() {
		checkFileTransformation('data');
	});

});
