'use strict';
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs-extra');

module.exports = function (grunt) {

	function StyleGuide(options) {
		this.options = options;
		return this._make();
	}

	StyleGuide.prototype._make = function() {

		return this._prep();

		//return Promise.props({
		//	modules: this._getModulesPaths(),
		//	destination: this._prepareDestination()
		//}).then(function(result) {
		//	console.log(this.destination);
		//	console.log(result.modules, result.destination);
		//}.bind(this));

	};

	StyleGuide.prototype._prep = function() {

		return Promise.props({
			modules: this._getModulesDocs(),
			destination: this._prepareDestination()
		});

	};

	StyleGuide.prototype._getModulesDocs = function() {

		return this._getModulesPaths()
			.then(function(paths) {
				return this._getModulesByPath(paths);
			}.bind(this))
			.then(function(modules) {
				return this._addDocToModule(modules);
			}.bind(this))
			.then(function(modules) {
				console.log(modules);
			});

	};

	// ------

	StyleGuide.prototype._getModulesPaths = function() {
		return new Promise(function (resolve) {
			var paths = grunt.file.expand({ filter: 'isDirectory' }, [
				path.join(this.options.local, '/components/*'),
				path.join(this.options.local, '/objects/*'),
				path.join(this.options.local, '/utilities/*')
			]);

			resolve(paths);
		}.bind(this));
	};

	StyleGuide.prototype._getModulesByPath = function(paths) {
		return new Promise(function (resolve, reject) {
			var modules;

			modules = paths.map(function(pathToModule) {
				var pathSplit = pathToModule.split(path.sep);

				// @TODO more error checking here
				return {
					name: pathSplit.pop(),
					type: pathSplit.pop(),
					path: pathToModule
				};
			});

			resolve(modules);

		});
	};

	StyleGuide.prototype._addDocToModule = function(modules) {
		return new Promise(function (resolve, reject) {

			modules = modules.map(function(module) {
				var getModuleDoc = this._getDocForModule(module);

				getModuleDoc
					.then(function(docPath) {
						console.log(docPath);
						module.docs = docPath;
					}, function() {
						module.docs = false;
					});

				return module;
			}.bind(this));

			resolve(modules);

		}.bind(this));
	};

	StyleGuide.prototype._getDocForModule = function(module) {
		return new Promise(function (resolve, reject) {
			var pathToLocalDoc = path.join(module.path, '/docs/' + module.name + '.html');
			var pathToNodeDoc;

			// Ok we have a doc file lets use this one.
			if (grunt.file.exists(pathToLocalDoc)) {
				resolve(pathToLocalDoc);
			}

			// Options for looking in node_modules is disabled
			if (!this.options.node) {
				reject();
			}

			pathToNodeDoc = grunt.file.expand({ filter: 'isDirectory' }, [
				path.join(process.cwd(), '/node_modules/**/bettercss-' + module.type + '-' + module.name + '/docs/*')
			]);

			if (pathToNodeDoc && pathToNodeDoc.length) {
				// We only want one mate!
				resolve(pathToNodeDoc.shift());
			} else {
				reject();
			}

		}.bind(this));
	};

	// ------

	StyleGuide.prototype._prepareDestination = function() {
		return new Promise(function (resolve, reject) {
			var from = path.join(path.dirname(__dirname), '/styleguide/');
			var to = path.join(this.options.destination, '/styleguide/');

			fs.copy(from, to, function (error) {
				if (error) {
					reject(error);
				}

				this.destination = to;
				resolve('Destination was setup!');
			}.bind(this));
		}.bind(this));
	};

	// ------

	grunt.registerMultiTask('bcstyleguide', 'Generate BetterCSS style guides', function () {
		var done = this.async(),
			styleguide;

		// Set some defaults if options are not set
		var options = this.options({
			local: path.join(process.cwd(), '/sass'),
			node: false,
			destination: path.join(process.cwd(), '/dist/styleguide')
		});

		styleguide = new StyleGuide(options)
			.then(function() {
				grunt.log.ok('Style guide was built');
				done();
			}, function(error) {
				grunt.log.error(error);
				done();
			});



		// Copy styleguide folder to new location not including sass folder

		// Get all module docs to be built int styleguide & parse the markdown code samples

		// build menu structure ready for insert

		// process modules and create files in output location

		// insert menu into index file

	});

};