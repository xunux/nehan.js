var LinkGenerator = ChildInlineTreeGenerator.extend({
  init : function(context){
    this._super(context);
    var anchor_name = this.context.markup.getTagAttr("name");
    if(anchor_name){
      this.context.setAnchor(anchor_name);
    }
  }
});

