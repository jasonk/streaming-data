const debug = require( 'debug' )( 'streaming-data:ignore' ),
  Block = require( './block' );

class Ignore extends Block {

  constructor( opts ) {
    super( opts, {
      leader        : 'StreamingData.Ignore<<',
      keep_markers  : false,
    } );
  }

  produce() {}

}

module.exports = Ignore;
