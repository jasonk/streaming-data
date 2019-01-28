const debug = require( 'debug' )( 'streaming-data:json' ),
  Block = require( './Block' ),
  json = require( 'json5' );

const charmap = { '{' : '}', '[' : ']' };

class JSON extends Block {

  constructor( opts ) {
    super( opts, {
      single    : true,
      multi     : true,
    } );
  }

  process( line, active ) {
    if ( active ) {
      this.buffer( line );
      if ( line === this.endchar ) {
        this.produce();
        this.deactivate();
      }
      return true;
    } else if ( this.multi && charmap[ line ] ) {
      this.buffer( line );
      this.endchar = charmap[ line ];
      this.activate();
      return true;
    } else if ( this.single ) {
      const f = line.charAt( 0 );
      if ( ! charmap[ f ] ) return false;
      const l = line.charAt( line.length - 1 );
      if ( l !== charmap[ f ] ) return false;
      try {
        this.produce( this.parse( line ) );
        return true;
      } catch( err ) {
        return false;
      }
    } else {
      return false;
    }
  }

  parse( text ) { return json.parse( text ); }

}

module.exports = JSON;
