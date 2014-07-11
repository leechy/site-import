var fs = require('fs');
var path = require('path');
var assert = require('assert');
var glob = require('glob');
var crc = require('crc').crc32;
var chalk = require('chalk');
var importer = require('../');

function compare(folder1, folder2) {
	var list1 = glob.sync('**/*.*', {cwd: folder1}).sort();
	var list2 = glob.sync('**/*.*', {cwd: folder2}).sort();

	assert.deepEqual(list1, list2);

	// compare file contents
	list1.forEach(function(f) {
		var hash1 = crc(fs.readFileSync(path.join(folder1, f)));
		var hash2 = crc(fs.readFileSync(path.join(folder2, f)));

		console.log('Comparing', chalk.bold(f));
		assert.equal(hash1, hash2, 'Comparing ' + f);
	});
}

describe('Project importer', function() {
	it('should import simple projects', function(done) {
		importer.defaults({
			out: path.join(__dirname, 'out1')
		});

		console.log('');

		importer.importFrom(path.join(__dirname, 'in'), function(err) {
			assert(!err);
			compare(path.join(__dirname, 'out1/p1'), path.join(__dirname, 'fixtures/out1/p1'))
			compare(path.join(__dirname, 'out1/p2'), path.join(__dirname, 'fixtures/out1/p2'))
			done();
		});
	});

	it('should import projects with resource versioning', function(done) {
		importer.defaults({
			out: path.join(__dirname, 'out2'),
			rewriteScheme: function(data) {
				return '/-/' + data.version + data.url;
			}
		});

		console.log('');

		importer.importFrom(path.join(__dirname, 'in'), function(err) {
			assert(!err);
			compare(path.join(__dirname, 'out2/p1'), path.join(__dirname, 'fixtures/out2/p1'))
			compare(path.join(__dirname, 'out2/p2'), path.join(__dirname, 'fixtures/out2/p2'))
			done();
		});
	});
});