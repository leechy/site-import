/**
 * Модуль находит в указанной папке проекты, которые нужно импортировать, 
 * и возвращает их в виде списка конфигов для модуля `html-importer`.
 *
 * Импортируемыми проектами являются симлинки на папки
 */
var fs = require('fs');
var path = require('path');
var finder = require('findit')
var async = require('async');

function compact(arr) {
	return arr.filter(function(item) {
		return !!item;
	});
}

function filterLinks(links, callback) {
	var filtered = [];
	async.map(links, function(cur, next) {
		var real;
		async.waterfall([
			function(callback) {
				fs.realpath(cur, callback);
			},
			function(realPath, callback) {
				fs.stat(real = realPath, callback);
			},
			
		], function(err, stat) {
			if (err) {
				return next(err);
			}

			next(null, stat.isDirectory() && {
				path: cur,
				real: real
			});
		});
	}, function(err, links) {
		callback(err, links ? compact(links) : null);
	});
}

function convertToConfig(basedir, links) {
	basedir = path.resolve(basedir);
	return links.map(function(link) {
		var prefix = path.resolve(link.path);
		if (prefix.substr(0, basedir.length) === basedir) {
			prefix = prefix.substr(basedir.length);
		}

		prefix = path.normalize(prefix);
		if (prefix[0] !== '/') {
			prefix = '/' + prefix;
		}

		return {
			root: link.real,
			name: path.basename(link.real),
			prefix: prefix
		}
	});
}

module.exports = function(basedir, callback) {
	var out = [];
	finder(basedir)
		.on('link', function(link, stat) {
			out.push(link);
		})
		.on('end', function() {
			filterLinks(out, function(err, links) {
				callback(err, links && convertToConfig(basedir, links));
			});
		});
};