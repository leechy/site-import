module.exports = function(grunt) {
	grunt.loadTasks('./tasks');
	grunt.initConfig({
		'site-import': {
			main: {
				src: './test/in',
				dest: './test/out-grunt',
				options: {
					'sample-project': {
						xsl: {src: 'main.xsl', cwd: 'xsl'},
						rewriteScheme: function(data) {
							return '/-/' + data.version + data.url;
						}
					}
				}
			}
		},
		'html-import': {
			main: {
				src: ['**/*.html'],
				expand: true,
				cwd: './test/in',
				dest: './test/out-html'
			},
			multiset: {
				files: [{
					src: ['**/*.html'],
					expand: true,
					cwd: './test/in/p1',
					dest: './test/out-import1',
				}, {
					src: ['**/*.html'],
					expand: true,
					cwd: './test/in/p2',
					dest: './test/out-import2'
				}]
			}
		}
	});

	grunt.registerTask('test', ['site-import', 'html-import']);
};