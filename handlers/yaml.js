const debug = require( 'debug' )( 'streaming-data:yaml' ),
  Block = require( './Block' ),
  yaml = require( 'js-yaml' );

class YAML extends Block {

  constructor( opts ) {
    super( opts, {
      single    : true,
      multi     : true,
    } );
  }

  process( line, active ) {
    if ( active ) {
      if ( line === '...' || line === '---' ) {
        this.produce();
        if ( line === '...' ) this.deactivate();
      } else {
        this.buffer( line );
      }
      return true;
    } else if ( line === '---' && this.multi ) {
      this.buffer( line );
      this.activate();
      return true;
    } else if ( this.single && line.startsWith( '--- ' ) ) {
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

  parse( text ) { return yaml.safeLoad( text ); }

}

module.exports = YAML;
