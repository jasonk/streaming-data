# streaming-data #

This is a library for reading text from a stream and processing it
into data in various ways.  Although I'm sure people will find other
uses for it, my original intent was to allow command-line tools
(primarily my [slack-send][slack-send] tool) to read a stream of data
and process it in useful ways before using it.

[slack-send]: https://github.com/jasonk/slack-send

# Usage #

To use it, you simply import it into your program, pipe a stream of
text into it, and then pipe it's output into a suitable stream reader.

    // To process
    const createStream = require( 'streaming-data' );
    const streamer = createStream();
    streamer.on( 'data', data => console.log( data ) );
    stream.on( 'close', () => console.log( 'CLOSED' ) );

# Input Format #

The original purpose of this library was to allow for a standard means
of providing structured data to a logging utility that simply reads
from stdin and then sends the data that it reads off to a logging
aggregator.  When I started also sending these logs to
[Slack](https://slack.com/), I wanted a way for the tool producing the
logs to produce attachments and other nicely formatted output that the
[slack-send][slack-send] tool can consume.

These are the types of data you can produce, and the rules that you
must follow in order for this library to correctly recognize your
data.

## YAML ##

[YAML](https://yaml.org) is supported primarily in a block mode.  You
can start a YAML block with a line that consists of nothing except for
three dashes.  To end YAML mode, emit a line that contains only three
periods:

```yaml
---
- this is yaml
...
```

The YAML parser also supports a continuation mode.  If you start a new
YAML block without ending the previous one, the previous one will be
processed and emitted and then a new block begins.

```yaml
---
this: is a yaml object
---
- this is a yaml array
...
```

It also supports a single-line mode.  If given a line to process while
not currently in a YAML block, if the line begins with `--- ` (three
dashes followed by a space), then the parser will attempt to parse
that line as a single-line YAML document.  If the parsing fails then
it will ignore it and allow the handler chain to continue (so that it
will get emitted by another handler if it looked like YAML but wasn't).

```yaml
--- [ a, single, line, yaml, array ]
--- { this: "is a single-line yaml object" }
```

## JSON ##

[JSON](https://www.json.org/) is handled in much the same way as YAML.

It has a block mode that is started by a line containing only a `{` or
`[`.  That block mode is ended by a line containing only the
matching `}` or `]`.

It also has a single-line mode.  It will attempt to parse a line as
a single-line if it either begins with `{` and ends with `}` or it
begins with `[` and ends with `]`.  If the parsing fails it will
assume that it wasn't actually JSON and let the handler chain
continue.

The `JSON` handler uses the [json5](https://www.npmjs.com/package/json5)
parser, which parses the annoying JSON that you know and love, but also
lets you write "JSON for Humans", which removes some of the annoying
traits of hand-writing JSON.  Some of the differences are:

- You can include extra whitespace anywhere you want
- You can use comments (both single line, starting with `//` and
  multi-line, surrounded by `/*` and `*/`).
- Object keys don't need to be quoted if they don't contain whitespace
  or other odd characters.
- Objects and arrays can have trailing commas
- Strings can be single or double quoted
- Strings can include character escapes
- Strings can span multiple lines by escaping the newline
- Numbers can have leading or trailing decimal points
- You can include `Infinity`, `-Infinity` and `NaN` as numbers
- Numbers can be hexadecimal
- Numbers can start with an explicit plus sign

See https://www.npmjs.com/package/json5 for more details.

## Verbatim ##

The verbatim handler is very useful when you are piping in text where
you know that it could contain things that would otherwise get
processed by the handler rules above.  Verbatim mode is entered by
a line that starts with a leader.  The default leader is
`StreamingData.Verbatim<<`.  When the handler sees a line that starts
with this string, it enters verbatim mode and records whatever was on
the rest of the line as the trailer for this mode.  It will then stay
in verbatim mode until it sees that trailer text.  This ensures that
you can pick a trailer that will never appear in your output.

So, for example, if you had a shell script that was running a bunch of
commands and you wanted the output of those commands to be processed
by [slack-send][slack-send], you might do something like this:

    #!/bin/bash
    (
      prepare-build
      install-prerequisites
      run-unit-tests
      run-acceptance-tests
      bump-version-numbers
      publish-packages
    ) | slack-send --channel=builds --text="Beginning build" --stream

However, if the `bump-version-numbers` script has output that looks
like JSON, but you don't want it to get parsed as JSON, you can make
sure that it stays as plain text by doing this:

    #!/bin/bash
    (
      prepare-build
      install-prerequisites
      run-unit-tests
      run-acceptance-tests
      echo 'StreamingData.Verbatim\<\<END_OF_VERSIONING'
      bump-version-numbers
      echo END_OF_VERSIONING
      publish-packages
    ) | slack-send --channel=builds --text="Beginning build" --stream

## Ignore ##

The ignore handler is useful when you are piping in text that you
don't want to be processed at all.  It's very similar to the verbatim
handler, but instead of producing a block of text, it produces nothing.

The default leader is for the ignore handler is `StreamingData.Ignore<<`.

# Configuration #

By default when you create a new stream it is configured with some
default handlers.  If you want to configure it with a different set of
handlers you can pass an object with a `handlers` property:

```javascript
const stream = createStream( { handlers : [ 'JSON', 'YAML' ] } );
```

Since configuring just the handlers is a very common occurrence, there
is also a shortcut for that.  If you pass an array instead of an
object it will be assumed that you are just passing a list of
handlers:

```javascript
// produces exactly the same result as the one above
const stream = createStream( [ 'JSON', 'YAML' ] );
```

To create a handler, the configuration you provide for it must
indicate the type of handler that it is.  If you provide an object
with a `class` property, then that property indicates the type.  If
you provide an object with a `name` but not a `class` then the `name`
will also be assumed to be the `class`.  If you provide a `class` but
not a `name` then the name will be set to the class as well.  If you
provide just a string then it will be used as both.

```javascript
// These all produce identical results:
streamer.addHandler( 'JSON' );
streamer.addHandler( { class : 'json' } );
streamer.addHandler( { name : 'json' } );
streamer.addHandler( { name : 'json', class : 'JSON' } );
// Note that the case difference don't matter, because class and name
// are both internally converted to lowercase
```

The default handlers (and their default configurations) are:

    JSON:
      single: true
      multi: true
    YAML:
      single: true
      multi: true
    Verbatim:
      leader: "StreamingData.Verbatim<<"
      keep_markers: false
    Ignore:
      leader: "StreamingData.Ignore<<"
