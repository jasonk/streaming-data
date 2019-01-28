const debug = require( 'debug' )( 'streaming-data:handler' ),
  { EventEmitter } = require( 'events' );

class Handler extends EventEmitter {

  /**
   * Types of handlers:
   *  BLOCK
   *    - Processes multiple lines
   *    - Can be activated/deactivated
   *    - Has pairs of handler methods (start/end)
   *  LINE
   *    - Processes one line at a time
   *    - Cannot be activated/deactivated
   *    - Has single handler method (match)
   *  TRANSFORM
   *  EXTRACT
   */
  constructor( ...configs ) {
    super();
    for ( const def of configs.reverse() ) {
      Object.assign( this, def );
    }
  }

  buffer( line ) {
    if ( ! this.linebuffer ) this.linebuffer = [];
    this.linebuffer.push( line );
  }

  activate() { this.emit( 'activate' ); }
  deactivate() { this.emit( 'deactivate' ); }

  getData() {
    let data = '';
    if ( this.data ) {
      data = this.data;
      this.data = '';
    } else if ( this.linebuffer ) {
      data = this.linebuffer.join( '\n' );
      this.linebuffer = [];
    }
    try {
      data = this.parse( data );
    } catch( err ) {
      return err;
    }
    return data;
  }

  // default pass-through parser
  parse( data ) { return data; }

  produce( data ) {
    this.emit( 'produce', data || this.getData() );
  }

  error( message, props ) {
    const err = new Error( message );
    Object.assign( err, props );
    this.produce( err );
  }

  /**
   * Called to process a line by the streamer.
   *
   * When there is an active handler then only the process method of
   * that active handler will be called.  Iff it returns the word
   * `continue` then the other handers will be iterated, if it returns
   * anything else then it will be assumed that the active handler
   * handled that line and nothing else will be done with it.
   *
   * When there is not an active handler, then each handler is tried
   * in turn, and it's process method is called.  If the handler
   * returns a truthy value or activates itself then the iteration
   * will stop there.  If it activates itself and also returns the
   * word `continue` then the remaining handlers will still be run.
   * 
   * @param {string} line - The line of text to be processed.
   * @param {boolean} active - Whether this handler is the active
   * handler or not.
   */
  process( line, active ) {
    this.produce( line );
    return true;
  }

  getMethodFor( item ) {
    const name = `${item}_${typeof this[ item ]}`;
    if ( typeof this[ name ] === 'function' ) return name;
  }
  runMethodFor( item, line ) {
    if ( Array.isArray( item ) ) {
      return item.some( i => this.runMethodFor( i, line ) );
    }
    const method = this.getMethodFor( item );
    if ( ! method ) return;
    return this[ method ]( line );
  }

  [ Symbol.for('nodejs.util.inspect.custom') ]( depth, options ) {
    const out = {};
    for ( const [ key, val ] of Object.entries( this ) ) {
      if ( key.startsWith( '_' ) ) continue;
      out[ key ] = val;
    }
    return out;
  }

  toString() { return `Handler: <${this.name}>`; }

}

module.exports = Handler;
