// TODO:
// although it is quite rare situation, ruby disappears when
// 1. line overflow by tail ruby and
// 2. it is contained in head of next line but
// 3. parent page can't contain the line and ends with overflow.
// then after rollback and 2nd-yielding by parent generator,
// ruby disappears because stream already steps to the next pos of ruby.
// any good idea to solve this problem?
var InlineGenerator = (function(){
  function InlineGenerator(markup, stream, context){
    this.markup = markup;
    this.stream = stream;
    this.context = context;
    this._hasNext = this.stream.hasNext();
  }

  // shortcut exception code
  var BUFFER_END = Exceptions.BUFFER_END;
  var SKIP = Exceptions.SKIP;
  var LINE_BREAK = Exceptions.LINE_BREAK;
  var RETRY = Exceptions.RETRY;
  var IGNORE = Exceptions.IGNORE;
  var BREAK = Exceptions.BREAK;

  InlineGenerator.prototype = {
    hasNext : function(){
      if(!this._hasNext){
	return false;
      }
      if(this._hasNextInlineBlock()){
	return true;
      }
      if(this._hasNextRuby()){
	return true;
      }
      return this.stream.hasNext();
    },
    backup : function(debug){
      this.stream.backup();
    },
    // caution! : this rollback function is to be ALWAYS called from parent generator.
    // so do not call this from this generator.
    rollback : function(){
      this.stream.rollback();
      this.rubyGenerator = null;
    },
    yield : function(parent){
      var ctx = new LineContext(parent, this.stream, this.context);

      // even if extent for basic line is not left,
      // just break and let parent generator break page.
      if(!ctx.canContainBasicLine()){
	return BREAK;
      }

      // backup inline head position.
      this.backup();

      while(true){
	var element = this._yieldElement(ctx);

	if(element == BUFFER_END){
	  ctx.setLineBreak();
	  break;
	} else if(element == SKIP){
	  ctx.setLineBreak();
	  break;
	} else if(element == LINE_BREAK){
	  ctx.setLineBreak();
	  break;
	} else if(element == RETRY){
	  ctx.setLineBreak();
	  break;
	} else if(element == IGNORE){
	  continue;
	}
	var advance = this._getAdvance(ctx, element); // size of inline flow.
	var extent = this._getExtent(ctx, element); // size of block flow.
	var font_size = this._getFontSize(ctx, element); // font size of element.

	// if overflow inline max, break loop
	if(!ctx.canContain(advance, extent)){
	  if(element._type === "inline-block"){
	    this.inlineBlockGenerator.rollback();
	  } else if(element instanceof Ruby){
	    this.rubyGenerator.rollback();
	  } else {
	    ctx.pushBackToken();
	  }
	  break;
	}
	ctx.addElement(element, {
	  advance:advance,
	  extent:extent,
	  fontSize:font_size
	});
      }
      return ctx.createLine();
    },
    _getExtent : function(ctx, element){
      if(Token.isText(element)){
	return element.fontSize;
      }
      if(element instanceof Ruby){
	return element.getExtent();
      }
      if(element instanceof Box){
	return element.getBoxExtent(ctx.getParentFlow());
      }
      return 0;
    },
    _getFontSize : function(ctx, element){
      if(Token.isText(element)){
	return element.fontSize;
      }
      if(element instanceof Ruby){
	return element.getFontSize();
      }
      return 0;
    },
    _getAdvance : function(ctx, element){
      if(Token.isText(element)){
	return element.getAdvance(ctx.getParentFlow(), ctx.letterSpacing);
      }
      if(Token.isTag(element)){
	return 0;
      }
      if(element instanceof Ruby){
	return element.getAdvance(ctx.getParentFlow());
      }
      return element.getBoxMeasure(ctx.getParentFlow());
    },
    _hasNextRuby : function(){
      return this.rubyGenerator && this.rubyGenerator.hasNext();
    },
    _hasNextInlineBlock : function(){
      return this.inlineBlockGenerator && this.inlineBlockGenerator.hasNext();
    },
    _yieldElement : function(ctx){
      if(this._hasNextInlineBlock()){
	return this._yieldDynamicInlineBlock(ctx);
      }
      if(this._hasNextRuby()){
	return this._yieldRuby(ctx);
      }
      var token = ctx.getNextToken();
      return this._yieldToken(ctx, token);
    },
    _yieldToken : function(ctx, token){
      if(token === null){
	return BUFFER_END;
      }
      // CRLF
      if(Token.isChar(token) && token.isNewLineChar()){

	// if pre, treat CRLF as line break
	if(ctx.isPreLine()){
	  return LINE_BREAK;
	}
	// others, just ignore
	return IGNORE;
      }
      if(Token.isText(token)){
	return this._yieldText(ctx, token);
      }
      if(Token.isTag(token) && token.getName() === "br"){
	return LINE_BREAK;
      }
      // if pseudo-element tag, copy original css
      if(this.markup && token.isPseudoElementTag()){
	var pseudo_name = token.getPseudoElementName();
	this.markup.copyPseudoStyle(pseudo_name, token);
      }
      // if block element, break line and force terminate generator
      if(token.isBlock()){
	ctx.pushBackToken(); // push back this token(this block is handled by parent generator).
	this._hasNext = false; // force terminate
	return LINE_BREAK;
      }
      // token is static size tag
      if(token.hasStaticSize()){
	return this._yieldStaticInlineBlock(ctx, token);
      }
      // token is inline-block tag
      if(token.isInlineBlock()){
	this.inlineBlockGenerator = new InlineBlockGenerator(token, ctx.createInlineRoot());
	return this._yieldDynamicInlineBlock(ctx);
      }
      // token is other inline tag
      return this._yieldInlineTag(ctx, token);
    },
    _yieldRuby : function(ctx){
      return this.rubyGenerator.yield(ctx.parent, ctx.curMeasure, ctx.letterSpacing);
    },
    _yieldDynamicInlineBlock : function(ctx){
      return this.inlineBlockGenerator.yield(ctx.parent, ctx.getRestMeasure());
    },
    _yieldStaticInlineBlock : function(ctx, tag){
      var element = PageGenerator.prototype._yieldStaticElement.call(this, ctx.parent, tag, this.context);
      if(element instanceof Box){
	element.display = "inline-block";
      }
      return element;
    },
    _yieldText : function(ctx, text){
      if(!text.hasMetrics()){
	text.setMetrics(ctx.getParentFlow(), ctx.getInlineFontSize(), ctx.isBoldEnable());
      }
      switch(text._type){
      case "char":
      case "tcy":
	return text;
      case "word":
	return this._yieldWord(ctx, text);
      }
    },
    _yieldInlineTag : function(ctx, tag){
      switch(tag.getName()){
      case "script":
	return IGNORE;

      case "style":
	ctx.addStyle(tag);
	return IGNORE;

      case "ruby":

	// check whether tag.tagFontSize is already set, and avoid overwriting it.
	if(typeof tag.baseFontSize == "undefined"){
	  // set the context font size where <ruby> is first appeared.
	  tag.baseFontSize = ctx.getInlineFontSize();
	}
	// sometimes <ruby> has more than two <rt> tags,
	// so we treat ruby tag as stream data.
	this.rubyGenerator = new RubyGenerator(tag.content, tag.baseFontSize);
	return this._yieldRuby(ctx);

      case "a":
	var anchor_name = tag.getTagAttr("name");
	if(anchor_name){
	  ctx.setAnchor(anchor_name);
	}
	break;

      default:
	break;
      }
      // single tag does not update tag stack of inline, so just return it.
      // or if tag is already parsed, just return too.
      if(tag.isSingleTag() || tag.parsed){
	return tag;
      }
      if(tag.isOpen()){
	ctx.pushTag(tag);
      } else {
	ctx.popTagByName(tag.getOpenTagName());
      }
      // to avoid duplicate parsing by parent rollback,
      // we set parsed flag to this tag object.
      tag.parsed = true;
      return tag;
    },
    _yieldWord : function(ctx, word){
      var advance = word.getAdvance(ctx.getParentFlow(), ctx.letterSpacing);

      // if advance of this word is less than ctx.maxMeasure, just return.
      if(advance <= ctx.maxMeasure){
	return word;
      }
      // if advance is lager than max_measure,
      // we must cut this word into some parts.
      var font_size = ctx.getInlineFontSize();
      var is_bold = ctx.isBoldEnable();
      var flow = ctx.getParentFlow();
      var part = word.cutMeasure(ctx.maxMeasure);  // get sliced word
      word.setMetrics(flow, font_size, is_bold);
      part.setMetrics(flow, font_size, is_bold);
      return part;
    }
  };

  return InlineGenerator;
})();
