const debug = require( 'debug' )( 'streaming-data:line' ),
  Handler = require( './handler' );

class Text extends Handler {

  /**
   * Maximum number of lines to buffer.  A block of text will be
   * emitted when the number of lines buffered reaches this length (if
   * you set it to a non-zero value).
   *
   * @property maxlines
   * @type {number}
   */

  process( line ) {
    if ( this.maxlines ) {
      this.buffer( line );
      if ( this.linebuffer.length >= this.maxlines ) {
        this.produce();
        return 'unflush';
      } else {
        return 'flush';
      }
    } else {
      this.produce( line );
      return true;
    }
  }

  flush() { this.produce(); }

}

module.exports = Text;
