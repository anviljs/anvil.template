/*
	anvil.template - HTML template rendering for anvil
	version:	0.1.3
	author:		Alex Robson <alex@sharplearningcurve.com> (http://sharplearningcurve.com)
	copyright:	2011 - 2012
	license:	Dual licensed
				MIT (http://www.opensource.org/licenses/mit-license)
				GPL (http://www.opensource.org/licenses/gpl-license)
*/
module.exports = function( _, anvil ) {
	anvil.plugin( {
		name: "anvil.underscore",
		configure: function( config, command, done ) {
			anvil.addRenderEngine( [ ".undr", ".underscore" ], this, "text/html" );

			anvil.config[ "anvil.combiner" ].patterns.push( {
				extensions: [ ".undy" ],
				find: "/[<][!][-]{2}import.?'.*'.? [-]{2}[>]/g",
				replace: "/([ \t]*)[<][!][-]{2}import.?'replace'.?[-]{2}[>]/g"
			} );
			done();
		},

		render: function( file, content, context, done, options ) {
			try {
				done( _.template( content, context, options || {} ) );
			} catch ( error ) {
				done( "", error );
			}
		},

		rename: function( name ) {
			return name.replace( /([.]undr$)|([.]underscore$)/, ".html" );
		}
	} );
};