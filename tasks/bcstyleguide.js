'use strict';
var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var marked = require('marked');

module.exports = function(grunt) {
	var styleGuide;
	var sanitizeOptions;
	var moduleHelpers;
	var getInstalledModules;
	var getBaseModule;
	var writeModuleDocs;
	var parseCodeBlock;
	var prepareFrame;

	// @TODO Add more sanitize checks for options
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

		if (_.isString(options.modulePaths)) {
			options = _.assign({}, options, {
				modulePaths: [options.modulePaths]
			});
		}

		return options;
	};

	prepareFrame = function(frame) {
		var frameContent = grunt.file.read(frame);

		if (!frameContent) {
			grunt.fail.fatal('Frame file doesn\'t exists');
			return false;
		}

		return _.template(frameContent);
	};

	// ------

	getInstalledModules = function(paths) {
		var installedModules = [];

		paths.forEach(function(currentPath) {
			var directories;
			var modules;

			currentPath = path.join(process.cwd(), currentPath);

			directories = grunt.file.expand({ filter: 'isDirectory' }, [
				path.join(currentPath, '/components/*'),
				path.join(currentPath, '/objects/*'),
				path.join(currentPath, '/utilities/*')
			]);

			modules = directories
			.filter(function(directory) {
				return !_.isEmpty(directory);
			})
			.map(function(directory) {
				var module;
				var doc;
				var split = directory.split(path.sep);
				var name = split.pop();
				var type = split.pop();

				module = {
					name: name,
					type: type,
					path: directory,
					base: false
				};

				doc = path.join(directory, '/docs/' + name + '.html')
				if (grunt.file.exists(doc)) {
					module = _.assign({}, module, {
						doc: doc
					});
				}

				return module;
			});

			if (modules.length) {
				installedModules = _.assign([], installedModules, modules);
			}
		});

		return installedModules;
	};

	// Add base module path to modules
	getBaseModule = function(modules) {
		return modules.map(function(module) {
			var pathToBaseDoc;

			// @TODO Only top level lookup ** doubles compilation time npm3 higher =>
			pathToBaseDoc = grunt.file.expand({ filter: 'isFile' }, [
				path.join(process.cwd(), '/node_modules/bettercss-' + module.type + '-' + module.name + '/docs/*')
			]);

			pathToBaseDoc = (_.isArray(pathToBaseDoc) && pathToBaseDoc.length)
				? pathToBaseDoc.shift()
				: pathToBaseDoc;

			if (pathToBaseDoc.length > 0) {
				return _.assign({}, module, {
					doc: pathToBaseDoc,
					base: true
				});
			} else {
				delete module.doc;
			}

			return module;
		})
		.filter(function(module) {
			return (module.doc);
		});
	};

	// @TODO Possible refactor of this function
	writeModuleDocs = function(options, modules, frame) {

		// @NOTE Needed to be filtered for next map
		modules = modules.filter(function(module) {
			return (module.doc);
		});

		return modules.map(function(module) {
			return _.assign({}, module, {
				doc: moduleHelpers.parseCodeBlock(grunt.file.read(module.doc))
			});
		})
		.map(function(module) {
			var contentToWrite;
			var cssPath = path.join(process.cwd(), options.css);
			var outputPath = path.join(options.output, '/' + ((module.base) ? 'base-' : '') + module.name + '.html');
			var written;
			var nav;

			nav = modules.map(function(module) {
				var outputPath = path.join(process.cwd(), options.output);
				return _.assign({}, module, {
					href: path.join(outputPath, '/' + ((module.base) ? 'base-' : '') + module.name + '.html')
				})
			});

			contentToWrite = frame({
				content: module.doc,
				nav: nav,
				css:  cssPath
			});

			written = grunt.file.write(outputPath, contentToWrite);

			if (written) {
				return _.assign({}, module, {
					written: true
				});
			} else {
				grunt.fail.warn('Unable to write module ' + module.name);

				return _.assign({}, module, {
					written: false
				});
			}

		});
	};

	parseCodeBlock = function(html) {
		var codeBlocks;

		codeBlocks = html.match(/(`{3}[\s\S]*?`{3})/g);
		if (_.isArray(codeBlocks)) {
			codeBlocks.forEach(function(code) {
				var parsed = marked(code);
				html = html.replace(/(`{3}[\s\S]*?`{3})/, parsed);
			});
		}

		return html;
	};

	// Module Helpers
	moduleHelpers = {
		getInstalledModules: getInstalledModules,
		getBaseModule: getBaseModule,
		writeModuleDocs: writeModuleDocs,
		parseCodeBlock: parseCodeBlock
	};

	// ------

	styleGuide = function(options) {
		var modules;
		var frame;

		options = sanitizeOptions(options);

		modules = moduleHelpers.getInstalledModules(options.modulePaths);

		if (options.includeBaseModules) {
			modules = modules.concat(moduleHelpers.getBaseModule(modules));
		}

		frame = prepareFrame(options.frame);

		// Write docs
		modules = moduleHelpers.writeModuleDocs(options, modules, frame);

		// @TODO Multiline output of what modules were written maybe?
		grunt.log.ok('Style guide was successfully generated');
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