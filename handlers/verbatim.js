const debug = require( 'debug' )( 'streaming-data:verbatim' ),
  Block = require( './block' );

class Verbatim extends Block {

  constructor( opts ) {
    super( opts, {
      leader        : 'StreamingData.Verbatim<<',
      keep_markers  : false,
    } );
  }

}

module.exports = Verbatim;
