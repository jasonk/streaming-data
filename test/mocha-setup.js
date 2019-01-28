const chai = require( 'chai' ),
  mocha = require( 'mocha' ),
  fs = require( 'fs' ),
  callback = require( 'callback-stream' ),
  createStreamer = require( '../' );

const { StreamingData } = createStreamer;

chai.should();

const expect = global.expect = chai.expect;

global.testfile = testfile;
global.createStreamer = createStreamer;
global.StreamingData = StreamingData;
global.producerSymbol = Symbol.for( 'streaming-data.producer' );

function testfile( name, streamer, simplify=true ) {
  if ( ! ( streamer instanceof StreamingData ) ) {
    if ( Array.isArray( streamer ) ) {
      streamer = new StreamingData( { handlers : streamer } );
    } else if ( typeof streamer === 'object' ) {
      streamer = new StreamingData( streamer );
    } else {
      streamer = new StreamingData();
    }
  }
  return new Promise( ( resolve, reject ) => {
    fs.createReadStream( `./test/${name}.txt` )
      .pipe( streamer )
      .pipe( callback.obj( ( err, data ) => {
        if ( simplify ) {
          data = data.map( d => d.valueOf ? d.valueOf() : d );
        }
        if ( err ) {
          reject( err );
        } else {
          resolve( data );
        }
      } ) );
  } );
}
