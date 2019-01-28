const { Transform } = require( 'stream' ),
  Handler = require( './handlers/handler' );

const debug = require( 'debug' )( 'streaming-data' );
const producerSymbol = Symbol.for( 'streaming-data.producer' );

class StreamingData extends Transform {

  constructor( opts={} ) {
    super( { readableObjectMode : true, allowHalfOpen : false } );
    if ( Array.isArray( opts ) ) opts = { handlers : opts };
    this.untagged = false;
    this.copy_to_stdout = false;
    Object.assign( this, opts );
    this.last = '';
    this.active = null;
    this.handlers = [];
    if ( opts.handlers ) {
      this.addHandlers( ...opts.handlers );
    } else {
      this.addHandlers( 'JSON', 'YAML', 'Verbatim', 'Ignore' );
    }
  }

  addHandlers( ...handlers ) {
    return handlers.map( conf => this.addHandler( conf ) );
  }

  produce( data, producer ) {
    if ( producer && ! this.untagged ) {
      if ( producer instanceof Handler ) producer = producer.name;
      if ( typeof data === 'string' ) data = new String( data );
      Object.defineProperty( data, producerSymbol, {
        value : String( producer ),
      } );
    }
    this.push( data );
  }

  error( message, producer ) {
    this.produce( new Error( message ), producer );
  }

  addHandler( conf ) {
    const handler = this.makeHandler( conf );
    handler.on( 'produce', ( data ) => {
      debug( `    * ${handler} produced:`, data );
      this.produce( data, handler );
    } );
    handler.on( 'activate', () => {
      if ( this.active ) {
        this.error(
          `${handler} activated while ${this.active} was still active`,
          handler
        );
      }
      debug( `    * ${handler} activated` );
      this.active = handler;
    } );
    handler.on( 'deactivate', () => {
      if ( this.active === handler ) {
        debug( `    * ${handler} deactivated` );
        this.active = null;
      } else {
        this.error(
            `${handler} attempted to deactivate while not active`,
          handler
        );
      }
    } );
    this.handlers.push( handler );
    return handler;
  }

  makeHandler( conf ) {
    if ( typeof conf === 'string' ) conf = { class : conf };
    if ( conf.class && ! conf.name ) conf.name = conf.class;
    if ( conf.name && ! conf.class ) conf.class = conf.name;

    conf.name = conf.name.toLowerCase();
    conf.class = conf.class.toLowerCase();

    if ( ! conf.class ) {
      const txt = JSON.stringify( conf );
      throw new Error( `Cannot create handler without class: ${txt}` );
    }

    const Class = require( `./handlers/${conf.class}` );
    return new Class( conf );
  }

  _transform( chunk, encoding, done ) {
    if ( this.copy_to_stdout ) process.stdout.write( chunk );
    const lines = ( this.last + chunk.toString() ).split( /\r?\n/u );
    this.last = lines.pop();
    for ( let i = 0 ; i < lines.length ; i++ ) this.processLine( lines[ i ] );
    done();
  }

  _flush( done ) {
    debug( '_flush' );
    if ( this.toflush ) this.toflush.flush();
    if ( this.active ) {
      if ( this.last ) this.active.process( this.last );
      this.active.flush();
      this.error( `Stream closed with active handler "${this.active}"` );
    }
    done();
  }

  processLine( line ) {
    debug( `processLine: "${line}"` );
    if ( this.active ) {
      debug( `  -> ${this.active} is active` );
      const res = this.active.process( line, true );
      debug( `  -> ${this.active} returned ${res}` );
      if ( res !== 'continue' ) return;
    }
    for ( const handler of this.handlers ) {
      const res = handler.process( line, false );
      if ( res === 'flush' ) {
        debug( `  -> ${handler} requested flush` );
        if ( this.toflush && this.toflush !== handler ) this.toflush.flush();
        this.toflush = handler;
        return;
      } else if ( res === 'unflush' ) {
        debug( `  -> ${handler} requested unflush` );
        if ( this.toflush && this.toflush === handler ) this.toflush = null;
      }
      if ( this.active ) {
        debug( `  -> ${handler} activated (${res})` );
        if ( res !== 'continue' ) return;
      } else if ( res ) {
        debug( `  -> ${handler} handled (${res})` );
        return;
      } else {
        debug( `  -> ${handler} skipped (${res})` );
      }
    }
    this.produce( line, 'unhandled' );
  }

}

function streamer( opts={} ) { return new StreamingData( opts ); }
streamer.StreamingData = StreamingData;

module.exports = streamer;
