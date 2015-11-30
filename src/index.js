/* global require, module, Buffer */

var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var md = require('markdown-it')();
var mdheadline = require('mdheadline');
var textTransformation = require('gulp-text-simple');

var removeHtmlComments = function (text) {
    return text.replace(/<!--[\s\S]*?-->/gm, function (m) {
        return '';
    });
};

var parseMarkdown = function (text) {
    'use strict';
    text = removeHtmlComments(text);
    return md.parse(text, {});
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
    var listTyp = null;

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
    var parseHeadline = function (n) {
        var attributes = mdheadline.getAttributes(n.text);
        var text = mdheadline.removeAttributes(n.text);
        var anchor = mdheadline.anchor(n.text);
        _.assign(n, attributes, { text: text, anchor: anchor });
    };

    _.forEach(s, function (e) {
        if (!inHeading) {
            if (e.type === 'heading_open') {
                inHeading = true;
                var level = _.parseInt(e.tag.slice(1));
                var i;
                for (i = _.size(stack); i > level; i--) {
                    pop();
                }
                for (i = _.size(stack); i < level; i++) {
                    push('implicit', null, i);
                }
                push('headline', '', level);
            }
            else if (e.type === 'bullet_list_open') {
                listTyp = 'u';
            }
            else if (e.type === 'ordered_list_open') {
                listTyp = 'o';
            }
            else if (e.type === 'list_item_open') {
                push(listTyp + 'list', '', _.size(stack));
            }
            else if (e.type === 'list_item_close') {
                pop();
            }
            else if (e.type === 'inline') {
                if (pivot.typ === 'ulist' || pivot.typ === 'olist') {
                    pivot.text += e.content;
                }
            }
        }
        else if (inHeading) {
            if (e.type === 'inline') {
                pivot.text += e.content;
            }
            else if (e.type === 'heading_close') {
                parseHeadline(pivot);
                inHeading = false;
            }
        }
    });
    return tree;
};

var nodeFromText = function (text, typ) {
    if (text === null || text.trim().length === 0) {
        return { typ: typ };
    }
    var p = text.indexOf(':');
    if (p >= 0) {
        return {
            name: text.slice(0, p).trim(),
            typ: typ,
            value: text.slice(p + 1).trim()
        };
    } else {
        return {
            name: text.trim(),
            typ: typ
        };
    }
};

var transformTree = function transformTree (n) {
    n = _.assign(
        _.omit(n, ['level', 'text']), 
        nodeFromText(n.text, n.typ));
    if (_.size(n.children) === 0) {
        n = _.omit(n, 'children');
    } else {
        n.children = _.map(n.children, transformTree);
    }
    return n;
};

var transformDocumentToData = function (doc) {
    'use strict';
    var elements = tailorElementSequence(doc);
    var tree = buildTree(elements);
    return transformTree(tree).children;
};

var transformText = function (text) {
    'use strict';
    return transformDocumentToData(parseMarkdown(text));
};

var transformation = textTransformation(transformText);

module.exports = transformation;
