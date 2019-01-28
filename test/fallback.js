describe( 'fallback', () => {

  it( 'should emit unhandled lines', () => {
    return testfile( 'text', [], false ).then( data => data.map( d => {
      d[ producerSymbol ].should.equal( 'unhandled' );
      return d.valueOf();
    } ).should.eql( [
      'This is a line.',
      'This is another line.',
      " { this : 'is', not : 'json' }",
      "[ 'this', 'is', 'also', 'not', 'json' ] ",
      'This is more text',
    ] ) );
  } );

} );
