describe( 'json', () => {

  it( 'should parse json', () => {
    return testfile( 'json' ).then( data => data.should.eql( [
      'This is a line.',
      'This is another line.',
      { this : 'is a single-line json.object' },
      [ 'this', 'is', 'a', 'single-line', 'json.array' ],
      'This is more text',
      {
        this : 'is a multi-line json.object',
        it   : 'has multi-lines',
      },
      [
        'this is a multi-line json.array',
        'it also has multi-lines',
      ],
    ] ) );
  } );

} );
