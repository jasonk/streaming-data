describe( 'verbatim', () => {

  it( 'should parse verbatim chunks', () => {
    return testfile( 'verbatim' ).then( data => data.should.eql( [
      'This is a line.',
      'This is another line.',
      `This is all verbatim, and should not get parsed..
{ this : 'is not a single-line json.object' }
[ 'this', 'is', 'not', 'a', 'single-line', 'json.array' ]
---
This: is not some yaml
---
This: Is Not Sparta!
...
This really is more text
{
  this : 'is not a multi-line json.object',
  it   : 'does have multi-lines',
}
[
  'this is not a multi-line json.array',
  'it also does have multi-lines',
]`,
    ] ) );
  } );

} );
