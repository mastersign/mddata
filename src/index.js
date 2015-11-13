/* global require, module, Buffer */

var through = require('through2');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var md = require('markdown-it')();

var parseMarkdown = function (text) {
    'use strict';
    return md.parse(text);
};

var tailorElement = null;
var tailorElementSequence = function (s) {
    if (s) {
        return _.map(s, tailorElement);
    } else {
        return undefined;
    }
};
tailorElement = function (e) {
    if (e) {
        var e2 = { type: e.type };
        if (e.tag) e2.tag = e.tag;
        if (e.markup) e2.markup = e.markup;
        if (e.content) e2.content = e.content;
        if (e.children) e2.children = tailorElementSequence(e.children);
        return e2;
    } else {
        return e;
    }
};

var buildTree = function (s) {
    var tree = { typ: 'r', text: null, level: 0, children: [] };
    var pivot = tree;
    var stack = [tree];
    var inHeading = false;
    
    var push = function (typ, text, level) {
        var p = {
            typ: typ,
            text: text,
            level: level,
            children: []
        };
        pivot.children.push(p);
        pivot = p;
        stack.push(p);
    };
    var pop = function () {
        stack.pop();
        pivot = _.last(stack);
    };
    var extractId = function (n) {
        var m = n.text.match(/\s+\{[ \t]*#(\S+)[ \t]*\}$/);
        if (m) {
            n.text = n.text.slice(0, n.text.length - m[0].length);
            n.id = m[1];
        }
    };
    
    _.forEach(s, function (e) {
        if (!inHeading) {
            if (e.type == 'heading_open') {
                inHeading = true;
                var level = Number.parseInt(e.tag.slice(1));
                for (var i = _.size(stack); i > level; i--) {
                    pop();
                }
                for (var i = _.size(stack); i < level; i++) {
                    push('h', null, i);
                }
                push('h', '', level);
            }
            else if (e.type == 'list_item_open') {
                push('l', '', _.size(stack));
            }
            else if (e.type == 'list_item_close') {
                pop();
            }
            else if (e.type == 'inline') {
                if (pivot.typ == 'l') {
                    pivot.text += e.content;
                }
            }
        }
        else if (inHeading) {
            if (e.type == 'inline') {
                pivot.text += e.content;
            }
            else if (e.type == 'heading_close') {
                extractId(pivot);
                inHeading = false;
            }
        }
    });
    return tree;
};

var nodeFromText = function (text) {
    if (text == null || text.trim().length == 0) {
        return { };
    }
    var p = text.indexOf(':');
    if (p >= 0) {
        return {
            name: text.slice(0, p).trim(),
            value: text.slice(p + 1).trim()
        };
    } else {
        return { name: text.trim() };
    }
};

var transformTree = function transformTree (n) {
    var n2 = nodeFromText(n.text);
    if (n.id) {
        n2.id = n.id;
    }
    if (_.size(n.children) == 0) {
        if (!n2.value) {
            return n2.name;
        }
    } else {
        n2.children = _.map(n.children, transformTree);
    }
    return n2;
};

var transformDocumentToData = function (doc) {
    'use strict';
    var elements = tailorElementSequence(doc);
    var tree = buildTree(elements);
    return transformTree(tree).children;
};

var extractDataFromMarkdown = function (text) {
    'use strict';
    return transformDocumentToData(parseMarkdown(text));
};

var transformText = function (text) {
    'use strict';
    var data = extractDataFromMarkdown(text);
    // return JSON.stringify(data, null, '  ');
    return data;
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
            try {
                fs.accessSync(fileOrText, fs.R_OK);
                // extractor(filePath) -> returns the processed content of the file
                return transformFile(fileOrText);
            } catch (e) {
                console.log(e);
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
