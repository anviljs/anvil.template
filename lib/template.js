/*
	anvil.template - HTML template rendering for anvil
	version:	0.1.1
	author:		Alex Robson <alex@sharplearningcurve.com> (http://sharplearningcurve.com)
	copyright:	2011 - 2012
	license:	Dual licensed
				MIT (http://www.opensource.org/licenses/mit-license)
				GPL (http://www.opensource.org/licenses/gpl-license)
*/
module.exports = function( _, anvil ) {
	require( "./render.js" )( _, anvil );
	require( "./underscore.js" )( _, anvil );
	require( "./handlebars.js" )( _, anvil );
};