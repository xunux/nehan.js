var ChildInlineTreeGenerator = InlineTreeGenerator.extend({
  _createLine : function(parent){
    var line = this._super(parent);
    this._setBoxStyle(line, parent);
    return line;
  },
  _getLineSize : function(parent){
    var measure = parent.getContentMeasure();
    if(this.context.isFirstLocalLine()){
      measure -= parent.childMeasure;
    }
    var extent = parent.getContentExtent();
    return parent.flow.getBoxSize(measure, extent);
  },
  _onCompleteLine : function(line){
    line.shortenMeasure();
  }
});

