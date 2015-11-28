# MdData

[![npm package][npm-img]][npm-url]
[![build status][travis-img]][travis-url]

> extracting hierarchic data from [Markdown] documents

## Application

_MdData_ parses a [Markdown] document and extracts a hierarchic data structure,
which represents headlines and lists.

Take a look at the [test document](test/data/data.md) and the [result](test/data/data.json).

It can be used as a function or with [Gulp].

## Interface

_MdData_ makes use of [GulpText _simple_][gulp-text-simple] v0.3 to provide the API.
Therefore, it currently supports three ways of usage.

1. Use the `readFileSync(path)` function, to get the extracted
   data of a [Markdown] file.
2. Specify a [Markdown] string, to get the extracted data.
3. Give no arguments, to get a gulp transformation.

### Transform a file directly

Use the function `readFileSync(path)` and specify a path to the [Markdown] file.

``` js
var mddata = require('mddata');
var result = mddata.readFileSync('project_a/docs/index.md');
```

### Transform a string

Give a [Markdown] string to extract the hierarchic data.

``` js
var mddata = require('mddata');
var documentPath = 'project_a/docs/index.md';
var result = mdinclude('# Introduction ...');
```

### Create a Gulp transformation

``` js
var mddata = require('mddata');
var gulp = require('gulp');

gulp.task('preprocess-markdown', function() {
    return gulp.src('docs/*.md')
        .pipe(mddata())
        .pipe(gulp.dest('out'));
});
```

## License

_MdData_ is published under the MIT license.

[npm-url]: https://www.npmjs.com/package/mddata
[npm-img]: https://img.shields.io/npm/v/mddata.svg
[travis-img]: https://img.shields.io/travis/mastersign/mddata/master.svg
[travis-url]: https://travis-ci.org/mastersign/mddata
[Gulp]: http://gulpjs.com
[Markdown]: https://daringfireball.net/projects/markdown/
