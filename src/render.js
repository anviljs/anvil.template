module.exports = function( _, anvil ) {
	anvil.plugin( {
		name: "anvil.template",
		activity: "compile",
		engines: {},
		context: {},
		sourceData: {},
		implicitFiles: [],
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
			this.processConfig();
			this.initData( done );
			path = require( "path" );
		},

		run: function( done, activity ) {
			if( !this.config.disable ) {
				this.normalizeConfig();
				var inputs = _.keys( this.config.files );
				anvil.scheduler.parallel( inputs, this.render, function() { done(); } );
			} else {
				done();
			}
		},

		initData: function( done ) {
			var self = this;
			anvil.fs.getFiles( this.config.path, this.config.path, function( files ) {
				anvil.scheduler.parallel( files, function( file, done ) {
					anvil.fs.read( file.fullPath, function( content ) {
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
				}, done );
			} );
		},

		parse: function( content, extension ) {
			if( extension === ".json" ) {
				return JSON.safeParse( content );
			} else {
				return {};
			}
		},

		render: function( key, done ) {
			var self = this,
				file = this.getFile( key ),
				ext = file.extension(),
				engine = this.engines[ ext ];
			if( engine ) {
				var spec = this.config.files[ key ];
				anvil.fs.read( [ file.workingPath, file.name ], function( content ) {
					_.each( spec, function( spec, output ) {
						var context = self.getContext( output, spec ),
							relative = file.workingPath + key;
						engine.render( relative, content, context, function( result, err ) {
							if( !err ) {
								var newFile = _.deepExtend( {}, file ),
									newName = path.basename( output );
								newFile.name = newName;
								anvil.project.files.push( newFile );
								anvil.fs.write( [ file.workingPath, newName ], result, function() { done(); } );
							} else {
								anvil.log.error( "Error rendering template, '" + relative + "' " + err );
								done();
							}
						}, context.options || {} );
					} );
					file.noCopy = true;
				} );
			} else {
				done();
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
			return anvil.fs.buildPath( [ file.relativePath, file.name ] ).replace( /^[.][\\\/]/, "" ).replace( /^(\\|\/)/, "");
		},

		normalizeConfig: function() {
			var self = this;
				files = _.filter( anvil.project.files, function( file ) {
					var ext = file.extension();
					return self.engines[ ext ];
				} );
			_.each( files, function( file ) {
				var relative = self.getRelativePath( file );
				if( !self.config.files[ relative ] ) {
					var ext = path.extname( relative ),
						output = relative.replace( ext, ".html" );
					self.config.files[ relative ] = {};
					self.config.files[ relative ][ output ] = {};
				}
			} );
		},

		processConfig: function() {
			var self = this;
			_.each( this.config.files, function( input ) {
				_.each( input, function( output ) {
					if( output.data ) {
						self.implicitFiles = self.implicitFiles.concat( output.data );
					}
				} );
			} );
		}
	} );
	anvil.addRenderEngine = anvil.extensions.plugins[ "anvil.template" ].addRenderEngine;
};
