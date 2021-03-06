var InsideListItemGenerator = ChildBlockTreeGenerator.extend({
  init : function(markup, parent, context){
    var marker = parent.listStyle.getMarkerHtml(markup.order + 1);
    var marker_html = Html.tagWrap("span", marker, {
      "class":"nehan-li-marker"
    });
    //markup.content = marker_html + Const.space + markup.getContent();
    markup.contentRaw = marker_html + Const.space + markup.getContentRaw();
    this._super(markup, context);
  }
});
