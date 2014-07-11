var fs = require('fs');
var path = require('path');
var async = require('async');
var mkdirp = require('mkdirp');

module.exports = {
	/**
	 * Сохраняет содержимое файла
	 * @param  {String}   dest     Абсолютный путь, куда нужно сохранить файл
	 * @param  {String}   content  Содержимое файла
	 * @param  {Function} callback 
	 */
	saveFile: function(dest, content, callback) {
		async.waterfall([
			function(callback) {
				mkdirp(path.dirname(dest), callback);
			},
			function(result, callback) {
				fs.writeFile(dest, content, callback);
			}
		], callback);
	},

	/**
	 * Быстрое копирование файлов
	 * @param  {String}   source Откуда копировать файл
	 * @param  {String}   target Куда копировать файл
	 * @param  {Function} callback
	 */
	copyFile: function(source, target, callback) {
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
	},

	extend: function(dest) {
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
};