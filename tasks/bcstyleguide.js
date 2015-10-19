'use strict';
var _ = require('lodash');
var path = require('path');

module.exports = function(grunt) {
	var styleGuide;

	var sanitizeOptions;

	// @TODO Add more comples sanitize checks for options
	sanitizeOptions = function(options) {

		if (_.isArray(options.modulePaths) && !options.modulePaths.length) {
			grunt.fail.fatal('Invalid module paths');
		}

		if (_.isEmpty(options.frame)) {
			grunt.fail.fatal('Please provide a frame file');
		}

		if (_.isEmpty(options.css)) {
			grunt.fail.fatal('Please provide a CSS file');
		}

		// @NOTE Change string to array for latter
		if (_.isString(options.modulePaths)) {
			options = _.extend({}, options, {
				modulePaths: [options.modulePaths]
			});
		}

		return options;
	};

	// ------

	var moduleHelpers;
	var getInstalledModules;
	var getBaseModules;

	getInstalledModules = function(paths) {
		var modules = [];

		paths.forEach(function(currentPath) {
			var folders;

			currentPath = path.join(process.cwd(), currentPath);

			folders = grunt.file.expand({ filter: 'isDirectory' }, [
				path.join(currentPath, '/components/*'),
				path.join(currentPath, '/objects/*'),
				path.join(currentPath, '/utilities/*')
			]);

			folders = folders
			.filter(function(folder) {
				return !_.isEmpty(folder);
			})
			.map(function(folder) {
				var folderSplit = folder.split(path.sep);

				// @TODO more error checking here
				return {
					name: folderSplit.pop(),
					type: folderSplit.pop(),
					path: folder,
					base: false
				};
			});

			if (folders.length) {
				modules.push(folders);
			}
		});

		return modules;

	};

	getBaseModules = function(installedModules) {
		var modules = [];

		installedModules.forEach(function(module) {



		});

		return modules;
	};

	// Module Helpers
	moduleHelpers = {
		getInstalledModules: getInstalledModules,
		getBaseModules: getBaseModules
	};


	// ------

	styleGuide = function(options) {
		var modules = [];

		options = sanitizeOptions(options);

		modules = _.extend([], modules, moduleHelpers.getInstalledModules(options.modulePaths));

		// In this flag is true then we will look in the node_modules folder
		// for base modules else we will just go use the installed modules
		if (options.includeBaseModules) {
			modules = _.extend([], modules, moduleHelpers.getBaseModules(modules);
		}

		console.log(modules);
	};

	// ------

	grunt.registerMultiTask('bcstyleguide', 'Generate BetterCSS style guides', function() {
		var done = this.async();

		// Set some defaults if options are not set
		var options = this.options({
			modulePaths: [],
			output: '',
			frame: '',
			css: '',
			includeBaseModules: false
		});

		done(styleGuide(options));
	});
};

//var path = require('path');
//var Promise = require('bluebird');
//var fs = require('fs-extra');
//var _ = require('lodash');
//var marked = require('marked');
//
//module.exports = function (grunt) {
//
//	// Setup marked options for code parsing
//	marked.setOptions({
//		highlight: function (code) {
//			return require('highlight.js').highlightAuto(code).value;
//		}
//	});
//
//
//
//	function StyleGuide(options) {
//		this.options = options;
//	}
//
//	StyleGuide.prototype.make = function() {
//		return this._make();
//	};
//
//	// ------
//
//	StyleGuide.prototype._make = function() {
//		return this._prep()
//			.then(function(prep) {
//				return this._process(prep);
//			}.bind(this))
//			.then(function() {
//				// Files got process we are good
//			}, function() {
//				// Something happened lets do clean up
//			});
//	};
//
//	StyleGuide.prototype._prep = function() {
//		return Promise.props({
//			modules: this._getModules(),
//			frame: this._setupFrame()
//		});
//	};
//
//	StyleGuide.prototype._process = function(prep) {
//		var modules = prep.modules;
//		var frame = prep.frame;
//
//		if (!modules) {
//			// We need to remove the styleguide folder as we have no modules
//			// function to process cleanup on error
//			return Promise.reject();
//		}
//
//		return this._buildNavigationForDoc(modules)
//			.then(function(nav) {
//				frame = _.merge(frame, {
//					nav: nav
//				});
//				return this._writeModulesDocs(modules, frame);
//			}.bind(this))
//
//	};
//
//	// Modules
//
//	StyleGuide.prototype._buildNavigationForDoc = function(modules) {
//		var nav;
//
//		nav = modules.map(function(module) {
//			return {
//				name: _.capitalize(module.name),
//				href: module.name + '.html'
//			};
//		});
//
//		return Promise.resolve(nav);
//	};
//
//	StyleGuide.prototype._writeModulesDocs = function(modules, frame) {
//		var promises = [];
//
//		modules.forEach(function(module) {
//			promises.push(new Promise(function(resolve, reject) {
//				return this._writeModuleDoc(module, frame);
//			}.bind(this)));
//		}.bind(this));
//
//		return Promise.all(promises)
//			.then(function(modules) {
//				return modules;
//			});
//	};
//
//	StyleGuide.prototype._writeModuleDoc= function(module, frame) {
//		return new Promise(function (resolve, reject) {
//			var moduleDocContent = grunt.file.read(module.docs);
//			var compiledTpl = _.template(frame.frameContent);
//			var contentToWrite;
//
//			// @TODO test this doesn't fall over :P
//			if (!moduleDocContent) {
//				reject(new Error('Couldn\'t read content from ' + module.name + '.html'));
//			}
//
//			moduleDocContent = this._parseCodeBlocks(moduleDocContent);
//
//			contentToWrite = compiledTpl({
//				content: moduleDocContent,
//				nav: frame.nav,
//				css: path.join(process.cwd(), this.options.css) // @TODO possibly some more validation for this in future
//			});
//
//			grunt.file.write(path.join(frame.path, '/' + module.name + '.html'), contentToWrite);
//
//			resolve(module.name + ' was written to disk');
//		}.bind(this));
//	};
//
//	StyleGuide.prototype._parseCodeBlocks = function(fileContent) {
//		var codeBlocks;
//
//		codeBlocks = fileContent.match(/(`{3}[\s\S]*?`{3})/g);
//		if (codeBlocks.length) {
//			codeBlocks.forEach(function(code) {
//				var parsed = marked(code);
//				fileContent = fileContent.replace(/(`{3}[\s\S]*?`{3})/, parsed);
//			});
//		}
//
//		return fileContent;
//	};
//
//	StyleGuide.prototype._getModules = function() {
//		return this._getModulesPaths()
//			.then(function(paths) {
//				return this._getModulesByPath(paths);
//			}.bind(this))
//			.then(function(modules) {
//				return this._filterUnusableModules(modules);
//			}.bind(this));
//	};
//
//	StyleGuide.prototype._getModulesPaths = function() {
//		return new Promise(function (resolve) {
//			var paths = grunt.file.expand({ filter: 'isDirectory' }, [
//				path.join(this.options.local, '/components/*'),
//				path.join(this.options.local, '/objects/*'),
//				path.join(this.options.local, '/utilities/*')
//			]);
//
//			resolve(paths);
//		}.bind(this));
//	};
//
//	StyleGuide.prototype._getModulesByPath = function(paths) {
//		return new Promise(function (resolve, reject) {
//			var modules;
//
//			modules = paths.map(function(pathToModule) {
//				var pathSplit = pathToModule.split(path.sep);
//
//				// @TODO more error checking here
//				return {
//					name: pathSplit.pop(),
//					type: pathSplit.pop(),
//					path: pathToModule
//				};
//			});
//
//			resolve(modules);
//		});
//	};
//
//	StyleGuide.prototype._filterUnusableModules = function(modules) {
//		var promises = [];
//
//		modules.forEach(function(module) {
//			promises.push(new Promise(function(resolve) {
//				var getModuleDoc = this._getDocForModule(module);
//
//				getModuleDoc
//				.then(function(docPath) {
//					module.docs = docPath;
//					resolve(module);
//				}, function() {
//					module.docs = false;
//					resolve(module);
//				});
//
//			}.bind(this)));
//		}.bind(this));
//
//
//		return Promise.all(promises)
//		.then(function(modules) {
//			return modules.filter(function(module) {
//				return (module.docs) ? true : false;
//			});
//		});
//	};
//
//	StyleGuide.prototype._getDocForModule = function(module) {
//		return new Promise(function (resolve, reject) {
//			var pathToLocalDoc = path.join(module.path, '/docs/' + module.name + '.html');
//			var pathToNodeDoc;
//
//			// Ok we have a doc file lets use this one.
//			if (grunt.file.exists(pathToLocalDoc)) {
//				resolve(pathToLocalDoc);
//			}
//
//			// Options for looking in node_modules is disabled
//			if (!this.options.node) {
//				reject();
//			}
//
//			// @TODO This needs to be tested I'm unsure if it even works.
//			pathToNodeDoc = grunt.file.expand({ filter: 'isFile' }, [
//				path.join(process.cwd(), '/node_modules/**/bettercss-' + module.type + '-' + module.name + '/docs/*')
//			]);
//
//			if (pathToNodeDoc && pathToNodeDoc.length) {
//				// We only want one mate!
//				resolve(pathToNodeDoc.shift());
//			} else {
//				reject();
//			}
//
//		}.bind(this));
//	};
//
//	// Frame
//
//	StyleGuide.prototype._setupFrame = function(destination) {
//
//		return this._prepareDestination()
//			.then(function(destination) {
//				return this._frameSetup(destination)
//			}.bind(this));
//
//	};
//
//	StyleGuide.prototype._prepareDestination = function() {
//		return new Promise(function (resolve, reject) {
//			var from = path.join(path.dirname(__dirname), '/styleguide/');
//			var to = path.join(this.options.destination, '/styleguide/');
//			var destination;
//
//			destination = {
//				path: to,
//				frame: path.join(to, '/frame.html'),
//				index: path.join(to, '/index.html')
//			};
//
//			fs.copy(from, to, function (error) {
//				if (error) {
//					reject(error);
//				}
//
//				resolve(destination);
//			}.bind(this));
//		}.bind(this));
//	};
//
//	StyleGuide.prototype._frameSetup = function(destination) {
//		return new Promise(function (resolve, reject) {
//			var frameContent = grunt.file.read(destination.frame);
//
//			// @TODO test this doesn't fall over :P
//			if (!frameContent) {
//				reject(new Error('Couldn\'t read content from frame.html'));
//			}
//
//			destination = _.merge(destination, {
//				frameContent: frameContent
//			});
//
//			resolve(destination);
//		});
//	};
//
//	// ------
//
//	grunt.registerMultiTask('bcstyleguide', 'Generate BetterCSS style guides', function () {
//		var done = this.async(),
//			styleguide;
//
//		// Set some defaults if options are not set
//		var options = this.options({
//			local: path.join(process.cwd(), '/sass'),
//			node: false,
//			destination: path.join(process.cwd(), '/dist/styleguide'),
//			css: path.join(process.cwd(), '/css/bundle.css')
//		});
//
//		styleguide = new StyleGuide(options);
//
//		styleguide.make()
//			.then(function() {
//				grunt.log.ok('Style guide was built');
//				done();
//			}, function(error) {
//				grunt.log.error(error);
//				done();
//			});
//	});
//
//};