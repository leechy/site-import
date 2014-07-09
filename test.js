var path = require('path');
var glob = require('glob');
var locator = require('./lib/locator');
var importer = require('./lib/importer');

locator('./test/fixtures', function(err, links) {
	console.log('found', links);

	if (links.length) {
		var project = Object.create(links[0]);
		console.log('importing project', links[0]);

		project.xsl = './xsl/main.xsl';
		project.dest = path.join('./out', project.prefix);

		importer(project, function(err) {
			console.log('import complete', err);
		});

		// glob('!**/*.html', {cwd: project.root}, function(err, files) {
		// 	console.log(files);
		// });
	}
});