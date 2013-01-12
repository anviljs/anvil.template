var handlebars;
module.exports = function( _, anvil ) {
	anvil.plugin( {
		name: "anvil.handlebars",
		configure: function( config, command, done ) {
			anvil.addRenderEngine( [ ".hbrs", ".handlebars" ], this, "text/html" );

			anvil.config[ "anvil.combiner" ].patterns.push( {
				extensions: [ ".hbrs", ".handlebars" ],
				find: "/[<][!][-]{2}.?import[(]?.?[\"'].*[\"'].?[)]?.?[-]{2}[>]/g",
				replace: "/([ \t]*)[<][!][-]{2}.?import[(]?.?[\"']replace[\"'].?[)]?.?[-]{2}[>]/g"
			} );
			done();
		},

		render: function( file, content, context, done, options ) {
			if( !handlebars ) {
				handlebars = require( "handlebars" );
			}
			try {
				var compile = handlebars.compile( content );
				done( compile( context, options || {} ) );
			} catch ( error ) {
				done( "", error );
			}
		},

		rename: function( name ) {
			return name.replace( /([.]hbrs$)|([.]handlebars$)/, ".html" );
		}
	} );
};