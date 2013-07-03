// TODO:
// although it is quite rare situation, ruby disappears when
// 1. line overflow by tail ruby and
// 2. it is placed at the head of next line but
// 3. parent page can't contain the line because of block level overflow.
// then after rollback and 2nd-yielding by parent generator,
// ruby disappears because stream already steps to the next pos of ruby.
// any good idea to solve this problem?
var InlineTreeGenerator = ElementGenerator.extend({
  init : function(markup, stream, context){
    this.markup = markup;
    this.stream = stream;
    this.context = context;
    this._terminate = false;
  },
  hasNext : function(){
    if(this._terminate){
      return false;
    }
    if(this.generator && this.generator.hasNext()){
      return true;
    }
    return this.stream.hasNext();
  },
  backup : function(){
    this.stream.backup();
  },
  // caution! : this rollback function is to be ALWAYS called from parent generator.
  // so do not call this from this generator.
  rollback : function(){
    this.stream.rollback();
    this.generator = null;
  },
  _getLineSize : function(parent){
    var measure = parent.getContentMeasure();
    var extent = parent.getContentExtent();
    return parent.flow.getBoxSize(measure, extent);
  },
  _createLine  : function(parent){
    var size = this._getLineSize(parent);
    var line = Layout.createTextLine(size, parent);
    line.markup = this.markup;
    return line;
  },
  yield : function(parent){
    var line = this._createLine(parent);
    return this._yield(line);
  },
  _yield : function(line){
    var ctx = new LineContext(line, this.stream, this.context);

    // even if extent for basic line is not left,
    // just break and let parent generator break page.
    if(!ctx.canContainBasicLine()){
      return Exceptions.BREAK;
    }

    // backup inline head position.
    this.backup();

    while(true){
      var element = this._yieldElement(ctx);

      if(element == Exceptions.BUFFER_END){
	ctx.setLineBreak();
	break;
      } else if(element == Exceptions.SKIP){
	return Exceptions.IGNORE;
      } else if(element == Exceptions.LINE_BREAK){
	ctx.setLineBreak();
	break;
      } else if(element == Exceptions.RETRY){
	ctx.setLineBreak();
	break;
      } else if(element == Exceptions.IGNORE){
	continue;
      } else if(element == Exceptions.BREAK){
	ctx.setLineBreak();
	break;
      }

      try {
	ctx.addElement(element);
      } catch(e){
	if(this.generator){
	  this.generator.rollback();
	} else {
	  ctx.pushBackToken();
	}
	break;
      }

      // if devided word, line break and parse same token again.
      if(element instanceof Word && element.isDevided()){
	ctx.pushBackToken();
	break;
      }
    } // while(true)

    line = ctx.createLine();
    if(!this.hasNext()){
      this._onLastTree(ctx, line);
    }
    this._onCompleteTree(ctx, line);
    return line;
  },
  _onLastTree : function(ctx, line){
    if(this.markup){
      this.context.popInlineTagByName(this.markup.getName());
    }
  },
  _onCompleteTree : function(ctx, line){
    line.setMaxExtent(ctx.getMaxExtent());
    line.setMaxFontSize(ctx.getMaxFontSize());
  },
  _yieldElement : function(ctx){
    if(this.generator && this.generator.hasNext()){
      return this.generator.yield(ctx.line);
    }
    this.generator = null;
    var token = ctx.getNextToken();
    return this._yieldToken(ctx, token);
  },
  _yieldToken : function(ctx, token){
    if(token === null){
      return Exceptions.BUFFER_END;
    }
    if(token instanceof Ruby){
      return token;
    }
    // CRLF
    if(Token.isChar(token) && token.isNewLineChar()){

      // if pre, treat CRLF as line break
      if(ctx.isPreLine()){
	return Exceptions.LINE_BREAK;
      }
      // others, just ignore
      return Exceptions.IGNORE;
    }
    if(Token.isText(token)){
      return this._yieldText(ctx, token);
    }
    if(Token.isTag(token) && token.getName() === "br"){
      return Exceptions.LINE_BREAK;
    }
    /*
    // if pseudo-element tag,
    // copy style of <this.markup.name>:<pseudo-name> dynamically.
    if(this.markup && token.isPseudoElementTag()){
      var pseudo_name = token.getPseudoElementName();
      var pseudo_css_attr = this.markup.getPseudoCssAttr(pseudo_name);
      for(var prop in pseudo_css_attr){
	if(prop !== "content"){
	  token.setCssAttr(prop, pseudo_css_attr[prop]);
	}
      }
    }
    */

    // if block element, break line and force terminate generator
    if(token.isBlock()){
      ctx.pushBackToken(); // push back this token(this block is handled by parent generator).
      this._terminate = true; // force terminate
      return ctx.isEmptyText()? Exceptions.SKIP : Exceptions.LINE_BREAK;
    }
    // token is static size tag
    if(token.hasStaticSize()){
      return this._yieldStaticElement(ctx.line, token, this.context);
    }
    // token is inline-block tag
    if(token.isInlineBlock()){
      this.generator = new InlineBlockGenerator(token, ctx.createInlineRoot());
      return this.generator.yield(ctx.line);
    }
    // token is other inline tag
    return this._yieldInlineTag(ctx, token);
  },
  _yieldStaticElement : function(line, tag, context){
    var element = this._super(line, tag, context);
    if(element instanceof Box){
      element.display = "inline-block";
    }
    return element;
  },
  _yieldText : function(ctx, text){
    if(!text.hasMetrics()){
      text.setMetrics(ctx.getLineFlow(), ctx.getFontSize(), ctx.isBoldEnable());
    }
    switch(text._type){
    case "char":
    case "tcy":
      return text;
    case "word":
      return this._yieldWord(ctx, text);
    }
  },
  _yieldWord : function(ctx, word){
    var advance = word.getAdvance(ctx.getLineFlow(), ctx.getLetterSpacing());

    // if advance of this word is less than ctx.maxMeasure, just return.
    if(advance <= ctx.maxMeasure){
      word.setDevided(false);
      return word;
    }
    // if advance is lager than max_measure,
    // we must cut this word into some parts.
    var font_size = ctx.getFontSize();
    var is_bold = ctx.isBoldEnable();
    var flow = ctx.getLineFlow();
    var part = word.cutMeasure(ctx.maxMeasure); // get sliced word
    part.setMetrics(flow, font_size, is_bold); // metrics for first half
    word.setMetrics(flow, font_size, is_bold); // metrics for second half
    return part;
  },
  _yieldInlineTag : function(ctx, tag){
    if(tag.isSingleTag()){
      ctx.inheritParentTag(tag);
      return tag;
    }
    switch(tag.getName()){
    case "script":
      return Exceptions.IGNORE;
    case "style":
      ctx.addStyle(tag);
      return Exceptions.IGNORE;
    default:
      this.generator = this._createChildInlineTreeGenerator(ctx, tag);
      return this.generator.yield(ctx.line);
    }
  },
  _createChildInlineTreeGenerator : function(ctx, tag){
    switch(tag.getName()){
    case "ruby":
      return new RubyGenerator(tag, this.context);
    case "a":
      return new LinkGenerator(tag, this.context);
    default:
      return new ChildInlineTreeGenerator(tag, this.context);
    }
  }
});
