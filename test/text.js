describe( 'text', () => {

  it( 'should parse text', () => {
    return testfile( 'text' ).then( data => data.should.eql( [
      'This is a line.',
      'This is another line.',
      " { this : 'is', not : 'json' }",
      "[ 'this', 'is', 'also', 'not', 'json' ] ",
      'This is more text',
    ] ) );
  } );

  it( 'should parse in blocks with maxlines', () => {
    return testfile( 'text', [
      { class : 'text', maxlines : 2 },
    ] ).then( data => data.should.eql( [
      'This is a line.\nThis is another line.',
      " { this : 'is', not : 'json' }\n[ 'this', 'is', 'also', 'not', 'json' ] ",
      'This is more text',
    ] ) );
  } );

} );
