module.exports = function( _, anvil ) {
	require( "./render.js" )( _, anvil );
	require( "./underscore.js" )( _, anvil );
	require( "./handlebars.js" )( _, anvil );
};