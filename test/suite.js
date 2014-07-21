var fs = require('fs');
var path = require('path');
var assert = require('assert');
var glob = require('glob-all');
var crc = require('crc').crc32;
var chalk = require('chalk');
var importer = require('../');
var grunt = require('grunt');

function normalize(text) {
	return text.split(/\r?\n/)
		.map(function(line) {
			return line.trim()
		})
		.join('\n');
}

function compare(folder1, folder2) {
	var list1 = glob.sync('**/*.*', {cwd: folder1}).sort();
	var list2 = glob.sync('**/*.*', {cwd: folder2}).sort();

	assert.deepEqual(list1, list2);

	// compare file contents
	list1.forEach(function(f) {
		var content1 = fs.readFileSync(path.join(folder1, f), 'utf8');
		var content2 = fs.readFileSync(path.join(folder2, f), 'utf8');
		var hash1 = crc(normalize(content1));
		var hash2 = crc(normalize(content2));

		assert.equal(hash1, hash2, 'Comparing ' + f + ':\n\n' + content1 + '\n----------\n' + content2);
	});
}

function p(dst) {
	return path.join(__dirname, dst);
}

describe('Project importer', function() {
	it('should import simple projects', function(done) {
		importer.defaults({
			out: p('out1')
		});

		console.log('');

		importer.importFrom(p('in'), function(err) {
			assert(!err);
			compare(p('out1/p1'), p('fixtures/out1/p1'));
			compare(p('out1/p2'), p('fixtures/out1/p2'));
			done();
		});
	});

	it('should import projects with resource versioning', function(done) {
		importer.defaults({
			out: p('out2'),
			rewriteScheme: function(data) {
				return '/-/' + data.version + data.url;
			}
		});

		console.log('');

		importer.importFrom(p('in'), function(err) {
			assert(!err);
			compare(p('out2/p1'), p('fixtures/out2/p1'));
			compare(p('out2/p2'), p('fixtures/out2/p2'));
			done();
		});
	});

	it('should run Grunt task', function() {
		// test generated data from Grunt task that 
		// must be performed *before* test suite
		console.log('');
		compare(p('out-grunt/p1'), p('fixtures/out2/p1'));
		compare(p('out-grunt/p2'), p('fixtures/out2/p2'));
	});
});