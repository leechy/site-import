module.exports = function(grunt) {
	grunt.loadTasks('./tasks');
	grunt.initConfig({
		'site-import': {
			main: {
				src: './test/in',
				dest: './test/out-grunt',
				options: {
					'sample-project': {
						xsl: 'xsl/main.xsl',
						rewriteScheme: function(data) {
							return '/-/' + data.version + data.url;
						}
					}
				}
			}
		}
	});

	grunt.registerTask('test', ['site-import']);
};