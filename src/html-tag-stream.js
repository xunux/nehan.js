var HtmlTagStream = FilteredTagStream.extend({
  init : function(src){
    this._super(src, function(tag){
      var name = tag.getName();
      return (name === "head" || name === "body");
    });
  }
});

