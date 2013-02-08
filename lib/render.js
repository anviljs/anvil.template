/*
	anvil.template - HTML template rendering for anvil
	version:	0.1.4
	author:		Alex Robson <alex@sharplearningcurve.com> (http://sharplearningcurve.com)
	copyright:	2011 - 2012
	license:	Dual licensed
				MIT (http://www.opensource.org/licenses/mit-license)
				GPL (http://www.opensource.org/licenses/gpl-license)
*/
var path = require( "path" );

module.exports = function( _, anvil ) {
	anvil.plugin( {
		name: "anvil.template",
		activity: "compile",
		context: {},
		dataFiles: {},
		dataLookup: {},
		engines: {},
		templateFiles: {},
		implicitFiles: [],
		sourceData: {},
		config: {
			path: "./data",
			files: {}
		},
		

		addRenderEngine: function( extension, render, mimeType ) {
			var self = this,
				extensions = !_.isArray( extension ) ? [ extension ] : extension;
			_.each( extensions, function( ext ) {
				self.engines[ ext ] = render;
			} );
		},

		configure: function( config, command, done ) {
			var self = this;
			anvil.addWatchPath( this.config.path );
			this.scrub( this.config );
			this.processConfig();
			this.initData( done );
			path = require( "path" );

			anvil.on( "file.change", function( args ) {
				self.templateFiles = [];
				var file = _.find( self.dataFiles, function( df ) { return df.fullPath.indexOf( args.file ) >= 0; } );
				self.loadDataFile( file, function() {
					if( file ) {
						self.flagTemplates( args.file );
						anvil.emit( "rebuild", { step: "combine" } );
					}
				} );
			} );
		},

		flagTemplates: function( file ) {
			var self = this,
				key = path.sep + path.relative( this.config.path, file ),
				list = this.dataLookup[ key ];
			if( list ) {
				_.each( list, function( template ) {
					var source = anvil.project.getFile( anvil.config.source + template );
					source.state = "inProcess";
				} );
			}
		},

		getContext: function( file, output ) {
			var self = this,
				sources = [];
			_.each( this.sourceData , function( data, source ) {
				if( data.global ) {
					sources.unshift( data.content );
				}
			} );
			sources.push( output );
			_.each( output.data, function( source ) {
				sources.push( self.sourceData[ source ].content );
			} );
			sources.unshift( {} );
			var context = _.extend.apply( _, sources );
			return context;
		},

		getFile: function( relativePath ) {
			var self = this;
			return _.find( anvil.project.files, function( file ) {
				return relativePath === self.getRelativePath( file );
			} );
		},

		getRelativePath: function( file ) {
			return anvil.fs.buildPath( [ file.relativePath, file.name ] ).replace( /^[.]?[\\\/]/, "" );
		},

		getTemplateFiles: function() {
			var self = this;
			return _.filter( anvil.project.files, function( file ) {
				var ext = file.extension();
				return file.state !== "done" && self.engines[ ext ];
			} );
		},

		initData: function( done ) {
			var self = this;
			anvil.fs.getFiles( this.config.path, this.config.path, function( files ) {
				self.dataFiles = files;
				anvil.scheduler.parallel( files, self.loadDataFile, done );
			} );
		},

		loadDataFile: function( file, done ) {
			var self = this;
			anvil.fs.read( file.fullPath, function( content, err ) {
				var p = self.getRelativePath( file ),
					global = true;
				if( _.contains( self.implicitFiles, p ) ){
					global = false;
				}
				self.sourceData[ p ] = {
					content: self.parse( content, file.extension() ),
					global: global
				};
				done();
			} );
		},

		normalizeConfig: function() {
			var self = this;
				files = this.getTemplateFiles();
			_.each( files, function( file ) {
				var relative = self.getRelativePath( file );
				if( !self.config.files[ relative ] ) {
					var ext = path.extname( relative ),
						output = relative.replace( ext, ".html" );
					self.templateFiles[ relative ] = {};
					self.templateFiles[ relative ][ output ] = {};
				} else {
					self.templateFiles[ relative ] = self.config.files[ relative ];
				}
			} );
		},

		parse: function( content, extension ) {
			if( extension === ".json" ) {
				return JSON.safeParse( content );
			} else {
				return {};
			}
		},

		processConfig: function() {
			var self = this;
			_.each( this.config.files, function( input, inputName ) {
				_.each( input, function( output ) {
					if( output.data ) {
						self.implicitFiles = self.implicitFiles.concat( output.data );
						_.each( output.data, function( dataFile ) {
							var list = self.dataLookup[ dataFile ];
							if( !list ) {
								self.dataLookup[ dataFile ] = list = [];
							}
							list.push( inputName );
						} );
					}
				} );
			} );
		},

		render: function( key, done ) {
			var self = this,
				file = this.getFile( key ),
				ext = file.extension(),
				engine = this.engines[ ext ],
				stop = false;
			if( engine ) {
				var specs = this.templateFiles[ key ];
				
				anvil.fs.read( [ file.workingPath, file.name ], function( content ) {
					_.each( specs, function( spec, output ) {
						var context = self.getContext( output, spec ),
							relative = anvil.fs.buildPath( [ file.workingPath, key ] );
						engine.render( relative, content, context, function( result, err ) {
							if( !err ) {
								var newName = path.basename( output ),
									outputPath = anvil.fs.buildPath( [ file.workingPath, newName ] );
									newFile = _.find( anvil.project.files, function( p ) {
										return p.fullPath === file.fullPath && p.name === newName;
									} );
								if( !newFile ) {
									newFile = _.deepExtend( {}, file );
									newFile.name = newName;
									anvil.project.files.push( newFile );
								}
								newFile.noCopy = false;
								anvil.fs.write( outputPath, result, function() {
									done();
								} );
							} else {
								anvil.stopBuild( "Error rendering template, '" + relative + "' \n" + err );
							}
						}, context.options || {} );
					} );
					file.noCopy = true;
				} );
			} else {
				done();
			}
		},

		run: function( done, activity ) {
			if( !this.config.disable ) {
				this.normalizeConfig();
				var inputs = _.keys( this.templateFiles );
				anvil.scheduler.parallel( inputs, this.render, function() {
					done();
				} );
			} else {
				done();
			}
		},

		// removes any leading path characters from the file names in the config block
		scrub: function( config ) {
			var self = this;
			if( !_.isString( config ) ) {
				_.each( config, function( value, key ) {
					delete config[ key ];
					var newKey = _.isString( key ) ? key.replace( /^[.]?[\\\/]/, "" ) : key;
					config[ newKey ] = value;
					if( _.isObject( value ) ) {
						self.scrub( value );
					}
				} );
			}
		}
	} );
	anvil.addRenderEngine = anvil.extensions.plugins[ "anvil.template" ].addRenderEngine;
};