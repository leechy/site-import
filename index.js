var fs = require('fs');
var path = require('path');
var crc = require('crc');
var async = require('async');
var chalk = require('chalk');
var locator = require('./lib/locator');
var importer = require('./lib/importer');

var defaults = {
	xsl: path.join(__dirname, 'xsl/main.xsl'),
	out: './out',
	rewriteScheme: null,
	transform: function(url, info) {
		if (this.rewriteScheme && info.actual) {
			try {
				var stat = fs.statSync(info.actual);
				if (stat.isFile()) {
					url = this.rewriteScheme({
						version: getFileHash(info.actual),
						url: url
					});
				}
			} catch (e) {
				console.error(e);
			}
		}

		return url;
	}
};

var hashLookup = {};

function getFileHash(file) {
	if (!hashLookup[file]) {
		hashLookup[file] = crc.crc32(fs.readFileSync(file));
	}

	return hashLookup[file];
}

function copy(dest) {
	for (var i = 1, il = arguments.length, src; i < il; i++) {
		src = arguments[i];
		if (!src) {
			continue;
		}

		for (var p in src) {
			dest[p] = src[p];
		}
	}

	return dest;
}

module.exports = {
	/**
	 * Задаёт или возвращает базовые настройки для всех проектов
	 * @param  {Object} value Новые базовые настройки
	 * @return {Object}
	 */
	defaults: function(value) {
		if (value) {
			defaults = copy(defaults, value);
		}

		return defaults;
	},

	/**
	 * Ищет проекты для импорта в указанной папке
	 */
	locate: locator,

	/**
	 * Импортирует указанный проект
	 * @param  {Object}   project  Конфиг проекта
	 * @param  {Function} callback
	 */
	importProject: function(project, callback) {
		// prepare project config
		var config = copy({}, defaults, project);
		if (!config.dest) {
			config.dest = path.join(config.out, config.prefix);
		}

		console.log('Importing', chalk.green(config.name), 'to', chalk.yellow(config.prefix));
		importer(config, callback);
	},

	/**
	 * Поиск и импорт всех проектов в указанной папке
	 * @param  {String}   folder   Папка, в которой нужно искать проекты
	 * @param  {Object}   configs  Дополнительные конфиги для отдельных проектов.
	 * Ключём проекта является имя папки проекта (подразумевается, что эта папка —
	 * отдельный пакет, поэтому все папки будут уникальными)
	 * @param  {Function} callback
	 */
	importFrom: function(folder, configs, callback) {
		if (typeof configs === 'function') {
			callback = configs;
			configs = {};
		}

		var self = this;
		async.waterfall([
			function(callback) {
				self.locate(folder, callback);
			},
			function(projects, callback) {
				async.each(projects, function(project, callback) {
					self.importProject(copy({}, project, configs[project.name]), callback);
				}, callback);
			}
		], callback);
	},

	resetCache: function() {
		hashLookup = {};
	}
};