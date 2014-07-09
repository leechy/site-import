/**
 * Модуль импортирует указанные подпроекты в заданную папку
 */
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var glob = require('glob');
var transformer = require('html-importer');
var rewrite = require('html-importer/lib/rewrite-url');
var locator = require('./locator');

/**
 * Возвращает абсолютный путь файла в папке импорта
 * @param  {Object} project Проект, который импортируем
 * @param  {String} file    Путь к исходному файлу
 * @return {String}
 */
function getTargetPath(project, file) {
	if (typeof file === 'object') {
		file = file.file;
	}

	var relPath = path.relative(project.root, file);
	return path.join(project.dest, relPath);
}

/**
 * Сохраняет содержимое файла
 * @param  {String}   dest     Абсолютный путь, куда нужно сохранить файл
 * @param  {String}   content  Содержимое файла
 * @param  {Function} callback 
 */
function saveFile(dest, content, callback) {
	async.waterfall([
		function(callback) {
			mkdirp(path.dirname(dest), callback);
		},
		function(result, callback) {
			fs.writeFile(dest, content, callback);
		}
	], callback);
}

/**
 * Быстрое копирование файлов
 * @param  {String}   source Откуда копировать файл
 * @param  {String}   target Куда копировать файл
 * @param  {Function} callback
 */
function copyFile(source, target, callback) {
	async.waterfall([
		function(callback) {
			mkdirp(path.dirname(target), callback);
		},
		function(result, callback) {
			var cbCalled = false;
			var done = function(err) {
				if (!cbCalled) {
					callback(err);
					cbCalled = true;
				}
			};

			var rd = fs.createReadStream(source);
			rd.on('error', done);

			var wr = fs.createWriteStream(target);
			wr.on('error', done);
			wr.on('close', function(ex) {
				done();
			});
			rd.pipe(wr);
		}
	], callback);
}

function importProject(project, callback) {
	assert(project.dest, 'Не указана папка, в которую нужно сохранять результат (project.dest)');
	assert(project.xsl,  'Не указаны XSL-файлы, которые нужно применить к HTML (project.xsl)');

	async.parallel([
		function(callback) {
			importHTML(project, callback);
		},
		function(callback) {
			importFiles(project, callback);
		}
	], callback);
}

/**
 * Импорт HTML-файлов проекта.
 * Сценарий импорта HTML следующий:
 * 1. Сначала перезаписываем ссылки на ресурсы в подпроекте на новые,
 * которые будут в родительском проекте
 * 2. Накладываем XSL
 * 3. В полученном документе снова переписываем ссылки: на этот раз для
 * шардирования ресурсов
 * @param  {Object}   project  Описание проекта
 * @param  {Function} callback
 */
function importHTML(project, callback) {
	transformer(project.xsl)
		.use(rewrite(project))
		.run(project.html || '**/*.html', {cwd: project.root}, function(err, files) {
			if (err) {
				return callback(err);
			} else {
				// сохраняем файлы
				async.each(files, function(fileObj, callback) {
					saveFile(getTargetPath(project, fileObj), fileObj.content, callback);
				}, callback);
			}
		});
}

/**
 * Импорт всех остальных файлов проекта
 * @param  {Object} project Описание проекта, который импортируем
 * @param  {Function} callback
 */
function importFiles(project, callback) {
	async.waterfall([
		function(callback) {
			glob('**/*.*', {cwd: project.root}, callback);
		},
		function(files, callback) {
			callback(null, files.filter(function(f) {
				return !/\.html$/.test(f);
			}));
		},
		function(files, callback) {
			async.each(files, function(file, next) {
				copyFile(path.join(project.root, file), path.join(project.dest, file), next);
			}, callback);
		}
	], callback);
}

module.exports = importProject;