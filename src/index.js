/* global require, module, Buffer */

var through = require('through2');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var parseMarkdown = function (text) {
    'use strict';
    var doc = null;
    // TODO implement document parsing
    return doc;
};

var transformDocumentToData = function (doc) {
    'use strict';
    var data = [];
    // TODO implement data extraction
    return data;
};

var extractDataFromMarkdown = function (text) {
    'use strict';
    return transformDocumentToData(parseMarkdown(text));
};

var transformText = function (text) {
    'use strict';
    var data = extractDataFromMarkdown(text);
    return JSON.stringify(data, null, '  ');
};

var transformBuffer = function (buffer) {
    'use strict';
    return new Buffer(transformText(buffer.toString('utf8')), 'utf8');
};

var transformFile = function (filePath) {
    'use strict';
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        throw 'File not found.';
    }
    var referencePath = path.dirname(filePath);
    var text = fs.readFileSync(filePath, 'utf8');
    return transformText(text, referencePath);
};

var extractor = function (fileOrText) {
    'use strict';

    if (fileOrText) {
        if (typeof(fileOrText) === 'string') {
            if (fs.existsSync(fileOrText)) {
                // extractor(filePath) -> returns the processed content of the file
                return transformFile(fileOrText);
            } else {
                // extractor(text) -> returns the processed text
                return transformText(fileOrText);
            }
        } else {
            throw 'Invalid first argument.';
        }
    }

    // extractor() -> gulp transformation step
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            cb();
            return;
        }
        if (file.isBuffer()) {
            file.contents = transformBuffer(file.contents, path.dirname(file.path));
            this.push(file);
            cb();
            return;
        }
        if (file.isStream()) {
            throw 'Streams are not supported.';
        }
    });
};

module.exports = extractor;
