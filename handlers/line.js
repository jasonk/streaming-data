const debug = require( 'debug' )( 'streaming-data:line' ),
  Handler = require( './handler' );

class Line extends Handler {

  /**
   * Called to process a line by the streamer.
   *
   * @param {string} line - The line of text to be processed.
   */
  process( line ) {
    if ( ! this.match.test( line ) ) return false;
    debug( 'Matched match (RegExp)' );
    try {
      this.produce();
    } catch( err ) {
      this.error( err.message, { line } );
    }
    return true;
  }

}

module.exports = Line;
