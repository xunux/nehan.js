var Edge = Class.extend({
  init : function(type){
    this._type = type;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
    this.left = 0;
  },
  clear : function(){
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
    this.left = 0;
  },
  isEnable : function(){
    return this.top !== 0 || this.right !== 0 || this.bottom !== 0 || this.left !== 0;
  },
  getDirProp : function(dir){
    return [this._type, dir].join("-");
  },
  getCss : function(){
    var css = {};
    var self = this;
    List.iter(["top", "right", "bottom", "left"], function(dir){
      var value = self[dir];
      if(value > 0){
	css[self.getDirProp(dir)] = self[dir] + "px";
      }
    });
    return css;
  },
  getWidth : function(){
    return this.left + this.right;
  },
  getHeight : function(){
    return this.top + this.bottom;
  },
  getMeasureSize : function(flow){
    return flow.isTextVertical()? this.getHeight() : this.getWidth();
  },
  getExtentSize : function(flow){
    return flow.isBlockflowVertical()? this.getHeight() : this.getWidth();
  },
  setSize : function(flow, size){
    BoxRect.setValue(this, flow, size);
  },
  setStart : function(flow, value){
    this[flow.getPropStart()] = value;
  },
  setEnd : function(flow, value){
    this[flow.getPropEnd()] = value;
  },
  setBefore : function(flow, value){
    this[flow.getPropBefore()] = value;
  },
  setAfter : function(flow, value){
    this[flow.getPropAfter()] = value;
  },
  getStart : function(flow){
    return this[flow.getPropStart()];
  },
  getEnd : function(flow){
    return this[flow.getPropEnd()];
  },
  getBefore : function(flow){
    return this[flow.getPropBefore()];
  },
  getAfter : function(flow){
    return this[flow.getPropAfter()];
  }
});
