/**
 * Задача для Grunt по импорту проектов из указанной папки
 * Структура задачи:
 * {
 * 	task_name: {
 * 		// глобальные опции для импорта проектов в папке
 * 		src: 'path/to/web/root',
 * 		dest: 'path/to/dest',
 *
 * 		// опции, которые можно перекрыть в проектах
 * 		xsl: 'path/to/stylesheet.xsl',
 * 		html: 'html/*.mask',
 * 		css: 'css/*.mask',
 * 		files: 'files/*.mask',
 * 		rewriteScheme: function(data) {
 * 			...
 * 		},
 * 		options: {
 * 			project_name: {
 * 				xsl: 'path/to/stylesheet.xsl',
 * 		  		html: 'html/*.mask',
 * 		    	css: 'css/*.mask'
 * 			}
 * 		}
 * 	}
 * }
 */
module.exports = function(grunt) {
	var importer = require('../');
	var utils = require('../lib/utils');

	function extractDefaultConfig(config) {
		var result = utils.extend({}, config);
		result.out = config.dest;
		['src', 'dest', 'options'].forEach(function(key) {
			if (key in result) {
				delete result[key];
			}
		});
		return result;
	}

	grunt.registerMultiTask('site-import', 'Импорт статических сайтов в указанную папку', function() {
		this.requiresConfig('site-import');
		var config = this.data;
		
		// проверим, чтобы все данные были на месте
		if (!config.src) {
			return grunt.fatal('Не указан параметр "src"');
		}
		if (!config.dest) {
			return grunt.fatal('Не указан параметр "dest"');
		}

		var oldDefaults = importer.defaults();
		importer.defaults(extractDefaultConfig(config));

		var done = this.async();
		importer.importFrom(config.src, this.options(), function(err) {
			importer.defaults(oldDefaults, true);
			if (err) {
				grunt.fatal(err);
				done(false);
			}

			done();
		});
	});
};