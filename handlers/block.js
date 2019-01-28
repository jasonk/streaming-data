const debug = require( 'debug' )( 'streaming-data:block' ),
  Handler = require( './handler' );

/**
 * Block handler processes text in blocks, delimited by either
 * start/end markers or a leader that defines it's own trailer.
 */
/**
 * @typedef {Object} BlockHandlerConfig
 * @property {boolean} [keep_start=false] - Keep the start line.
 * @property {boolean} [keep_end=false] - Keep the end line.
 * @property {boolean} [keep_leader=false] - Keep the leader line.
 * @property {boolean} [keep_trailer=false] - Keep the trailer line.
 * @property {boolean} [keep_markers=false] - Keep all the lines
 * (start/end/leader/trailer).
 * @property {string|RegExp} [leader] - An indicator that a block is
 * beginning, that configures it's own indicator for end end of the
 * block.  For example, if the leader is set to `---LEADER---` and
 * during processing a line is found that contains `---LEADER---BOB`
 * then the block will begin at that line, and continue until a line
 * that just contains `BOB`.  If the leader is a string then the start
 * line will be any line that begins with that string, and the trailer
 * will be set to the rest of that line.  if the leader is a RegExp
 * with a capture group then the trailer will be whatever was matched
 * by the first capture group.  If the leader is a RegExp without
 * a capture group, but it matched at the beginning of the line, then
 * the trailer will be the part of the line that didn't match the
 * RegExp.
 * @property {string|RegExp} [start] - An indicator that a block is
 * beginning.  If a string is provided the line must match that string
 * exactly.  If a RegExp is provided then the line must match that
 * RegExp.  The block continues until a line that matches the `end`
 * property is encountered.
 * @property {string|RegExp} [end] - An indicator that a block is
 * ending.  If a string is provided the line must match that string
 * exactly.  If a RegExp is provided then the line must match that
 * RegExp.
 */

class Block extends Handler {

  /**
   * @param {BlockHandlerConfig[]} configs
   */
  constructor( ...configs ) {
    super( ...configs, {
      keep_start    : false,
      keep_end      : false,
      keep_leader   : false,
      keep_trailer  : false,
      keep_markers  : false,
    } );
    if ( this.process === Block.process ) {
      if ( this.start && ! this.end ) {
        throw new Error( `Invalid handler ${this}: start without end` );
      } else if ( this.end && ! this.start ) {
        throw new Error( `Invalid handler ${this}: end without start` );
      }
      if ( ! ( this.start || this.leader ) ) {
        throw new Error( `Invalid handler ${this}: no start or leader` );
      }
    }
  }

  /**
   * Activate this handler and set it's activation mode.
   *
   * @param {string} mode - The handlers activation mode.  If this
   * handler is active because of a `start` match then this gets set
   * to `start`.  If it's active because of a `leader` match then it
   * gets set to `leader`.
   */
  activate( mode ) {
    this.active = mode;
    super.activate();
  }
  /**
   * Deactivate this handler and clear it's activation mode.
   */
  deactivate() {
    this.active = null;
    super.deactivate();
  }

  /**
   * Called to process a line by the streamer.
   *
   * @method process
   * @param {string} line - The line of text to be processed.
   * @param {boolean} active - Whether this handler is the active
   * handler or not.
   */
  process( line, active ) {
    if ( active ) {
      if ( this.active === 'start' ) {
        if ( this.runEnd( line ) ) {
          if ( this.keep_end || this.keep_markers ) this.buffer( line );
          this.produce();
          this.deactivate();
          return true;
        }
      } else if ( this.active === 'leader' ) {
        if ( this.trailer === line ) {
          if ( this.keep_trailer || this.keep_markers ) this.buffer( line );
          this.produce();
          this.deactivate();
          return true;
        }
      } else {
        throw new Error(
          `${this} is active but doesn't know how to deactivate`
        );
      }
      this.buffer( line );
      return true;
    }
    if ( this.runStart( line ) ) {
      if ( this.keep_start || this.keep_markers ) this.buffer( line );
      this.activate( 'start' );
      return true;
    }
    const trailer = this.runLeader( line );
    if ( trailer ) {
      if ( this.keep_leader || this.keep_markers ) this.buffer( line );
      this.trailer = trailer;
      this.activate( 'leader' );
      return true;
    }
    return false;
  }

  /**
   * Check whether a line matches the `start` parameter or not.
   *
   * @param {string} line - The line to check against.
   * @returns {boolean} Whether the line matches the `start` parameter.
   */
  runStart( line ) {
    switch( typeof this.start ) {
      case 'RegExp': return this.start.exec( line );
      case 'string': return this.start === line;
      default: return false;
    }
  }

  /**
   * Check whether a line matches the `end` parameter or not.
   *
   * @param {string} line - The line to check against.
   * @returns {boolean} Whether the line matches the `end` parameter.
   */
  runEnd( line ) {
    switch( typeof this.end ) {
      case 'RegExp': return this.end.exec( line );
      case 'string': return this.end === line;
      default: return false;
    }
  }

  /**
   * Check whether a line matches the `leader` parameter or not.
   *
   * @param {string} line - The line to check against.
   * @returns {string|undefined} If the line matches the leader then
   * the trailer will be returned.  If the line doesn't match the
   * leader then undefined is returned.
   */
  runLeader( line ) {
    switch( typeof this.leader ) {
      case 'RegExp':
        const res = this.leader.exec( line );
        if ( ! res ) return false;
        if ( res[1] ) {
          // If it contained a capture group then the capture group
          // provides the trailer
          return res[1];
        } else if ( res.index === 0 ) {
          // If it matched at the beginning of the string but didn't
          // provide a capture group then we assume that the trailer
          // is just whatever came after the part that matched.
          return res.input.substring( res[0].length );
        } else {
          return;
        }
        break;
      case 'string':
        if ( line.startsWith( this.leader ) ) {
          return line.substring( this.leader.length );
        }
        break;
    }
    return;
  }

}

module.exports = Block;
