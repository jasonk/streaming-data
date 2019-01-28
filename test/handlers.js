describe( 'handlers', () => {

  it( 'should setup handlers correctly', () => {
    const streamer = createStreamer( {
      handlers  : [ 'JSON', { name : 'Yaml' }, { class : 'text' } ],
    } );
    streamer.should.have.property( 'handlers' );
    const h = streamer.handlers;
    h.should.be.an( 'array' ).with.a.lengthOf( 3 );
    h[0].should.have.property( 'class', 'json' );
    h[1].should.have.property( 'class', 'yaml' );
    h[2].should.have.property( 'class', 'text' );
    h[0].should.have.property( 'name', 'json' );
    h[1].should.have.property( 'name', 'yaml' );
    h[2].should.have.property( 'name', 'text' );
  } );

} );
