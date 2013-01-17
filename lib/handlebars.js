/*
	anvil.template - HTML template rendering for anvil
	version:	0.1.1
	author:		Alex Robson <alex@sharplearningcurve.com> (http://sharplearningcurve.com)
	copyright:	2011 - 2012
	license:	Dual licensed
				MIT (http://www.opensource.org/licenses/mit-license)
				GPL (http://www.opensource.org/licenses/gpl-license)
*/
var handlebars;
module.exports = function( _, anvil ) {
	anvil.plugin( {
		name: "anvil.handlebars",
		
		activity: "compile",

		dependencies: [ "anvil.template" ],

		partials: {},

		helpers: {},

		config: {
			partials: "partials",
			helpers: "helpers"
		},

		configure: function( config, command, done ) {
			anvil.addRenderEngine( [ ".hbrs", ".handlebars" ], this, "text/html" );

			anvil.config[ "anvil.combiner" ].patterns.push( {
				extensions: [ ".hbrs", ".handlebars" ],
				find: "/[<][!][-]{2}.?import[(]?.?[\"'].*[\"'].?[)]?.?[-]{2}[>]/g",
				replace: "/([ \t]*)[<][!][-]{2}.?import[(]?.?[\"']replace[\"'].?[)]?.?[-]{2}[>]/g"
			} );

			if( !this.handlebars ) {
				this.handlebars = require( "handlebars" );
			}
			
			done();
		},

		run: function( done ) {
			_.each( anvil.project.files, function( file ) {
				if ( ~file.relativePath.indexOf( this.config.partials ) || ~file.relativePath.indexOf( this.config.helpers ) ) {
					file.noCopy = true;
				}
			}, this);
			done();
		},

		render: function( file, content, context, done, options ) {
			try {
				var compile = this.handlebars.compile( content );
				anvil.scheduler.pipeline( undefined, [ this.registerHelpers, this.registerPartials ], function() {
					done( compile( context, options || {} ) );
				}.bind( this ));
			} catch ( error ) {
				done( "", error );
			}
		},

		rename: function( name ) {
			return name.replace( /([.]hbrs$)|([.]handlebars$)/, ".html" );
		},

		// Will register any file in the partials directory as a partial by the name of the file.
		registerPartials: function( done ) {
			var self = this,
				partialPath = anvil.fs.buildPath( [ anvil.config.source, this.config.partials ] );
			
			anvil.fs.getFiles( partialPath, partialPath, function( files ) {
				anvil.scheduler.parallel( files, function( file, done ) {
					var partialName = path.basename( file.name, ".hbrs" );
					
					anvil.fs.read( file.fullPath, function( content ) {
						self.handlebars.registerPartial( partialName, content );
						done();
					});
				}, function() {
					self.partials = self.handlebars.partials;
					done();
				});
			});
		},

		// Will register any file in the `helpers` directory as a helper by the name of the file, and
		// the function returned via `module.exports`.
		registerHelpers: function( done ) {
			var self = this,
				helperPath = anvil.fs.buildPath( [ anvil.config.source, this.config.helpers ]);
			
			anvil.fs.getFiles( helperPath, helperPath, function( files ) {
				_.each( files, function( file ) {
					var helperFn = require( file.fullPath )( _, self.handlebars ),
						helperName = path.basename( file.name, ".js" );
					
					self.handlebars.registerHelper( helperName, helperFn );
				});

				self.helpers = self.handlebars.helpers;
				done();
			});
		}
	});
};