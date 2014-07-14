/**
 * Модуль импортирует указанные подпроекты в заданную папку
 */
var assert = require('assert');
var path = require('path');
var async = require('async');
var glob = require('glob');
var htmlImporter = require('html-importer');
var htmlRewrite = require('html-importer/lib/rewrite-url');
var cssImporter = require('css-importer');
var cssRewrite = require('css-importer/lib/rewrite-url');
var utils = require('./utils');

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

function saveFiles(files, project, callback) {
	async.each(files, function(fileObj, callback) {
		utils.saveFile(getTargetPath(project, fileObj), fileObj.content, callback);
	}, callback);
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
	htmlImporter(project.xsl, project.xslOptions)
		.use(htmlRewrite(project))
		.run(project.html || '**/*.html', {cwd: project.root}, function(err, files) {
			if (err) {
				callback(err);
			} else {
				saveFiles(files, project, callback);
			}
		});
}

/**
 * Импорт CSS-файлов проекта с перезаписью ссылок
 * @param  {Object}   project  Описание проекта, который нужно импортировать
 * @param  {Function} callback
 */
function importCSS(project, callback) {
	cssImporter()
		.use(cssRewrite(project))
		.run(project.css || '**/*.css', {cwd: project.root}, function(err, files) {
			if (err) {
				callback(err);
			} else {
				saveFiles(files, project, callback);
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
			glob(project.files || '**/*.*', {cwd: project.root}, callback);
		},
		function(files, callback) {
			async.each(files, function(file, next) {
				utils.copyFile(path.join(project.root, file), path.join(project.dest, file), next);
			}, callback);
		}
	], callback);
}

module.exports = function(project, callback) {
	assert(project.dest, 'Не указана папка, в которую нужно сохранять результат (project.dest)');
	assert(project.xsl,  'Не указаны XSL-файлы, которые нужно применить к HTML (project.xsl)');

	// Запускаем импорт в правильном порядке:
	// сначала обычные файлы, затем те, что переписываем
	async.series([
		function(callback) {
			importFiles(project, callback);
		},
		function(callback) {
			async.parallel([
				function(callback) {
					importHTML(project, callback);
				},
				function(callback) {
					importCSS(project, callback);
				}
			], callback);
		}
	], callback);
};