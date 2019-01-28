const debug = require( 'debug' )( 'streaming-data:chunk' ),
  Block = require( './Block' );

class Chunk extends Block {

  process( line, active ) {
    if ( active ) {
      if ( line === this.trailer ) {
        debug( `      - Not active, found trailer, producing output` );
        if ( this.keep_markers || this.keep_trailer ) this.buffer( line );
        this.produce();
        this.deactivate();
        return true;
      } else {
        debug( `      - Not active, did not find trailer, buffering` );
        this.buffer( line );
      }
    } else {
      if ( line.startsWith( this.leader ) ) {
        debug( `      - Active, found leader, activating` );
        if ( this.keep_markers || this.keep_leader ) this.buffer( line );
        this.trailer = line.substring( this.leader.length );
        this.activate();
        return true;
      } else {
        debug( `      - Active, did not find leader, skipping` );
        return false;
      }
    }
  }

}

module.exports = Chunk;
