/*
  Gruntfile.js for nehan

   usage
   =====

   1. to make nehan.js
     grunt concat:normal

   2. to make nehan.min.js
     grunt uglify:normal
     grunt concat:min

*/
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint:{
      normal:{
	src:[
	  "src/*.js"
	],
	filter:function(filepath){
	  return (filepath.indexOf("nehan-start.js") < 0 && // special script to start global closure.
		  filepath.indexOf("nehan-end.js") < 0 && // special script to close global closure.
		  filepath.indexOf("class.js") < 0); // class inheritance script by John Resig, uses some tricky technique.
	}
      },
      options:{
	"smarttabs":true
      }
    },
    concat:{
      normal:{
	files:{
	  "build/<%= pkg.name %>.js":[
	    "COPYING",
	    "src/nehan-start.js",
	    "src/config.js",
	    "src/layout.js",
	    "src/env.js",
	    "src/style.js",
	    "src/class.js",
	    "src/list.js",
	    "src/obj.js",
	    "src/unit-size.js",
	    "src/utils.js",
	    "src/math-utils.js",
	    "src/anim.js",
	    "src/const.js",
	    "src/css.js",
	    "src/html.js",
	    "src/closure.js",
	    "src/args.js",
	    "src/exception.js",
	    "src/css-parser.js",
	    "src/selector-attr.js",
	    "src/selector-pseudo.js",
	    "src/selector-type.js",
	    "src/selector-combinator.js",
	    "src/selector-lexer.js",
	    "src/selector-state-machine.js",
	    "src/selector.js",
	    "src/selectors.js",
	    "src/tag-attr-parser.js",
	    "src/tag.js",
	    "src/token.js",
	    "src/text.js",
	    "src/char.js",
	    "src/word.js",
	    "src/tcy.js",
	    "src/ruby.js",
	    "src/rgb.js",
	    "src/color.js",
	    "src/colors.js",
	    "src/palette.js",
	    "src/cardinal.js",
	    "src/text-metrics.js",
	    "src/list-style-type.js",
	    "src/list-style-pos.js",
	    "src/list-style-image.js",
	    "src/list-style.js",
	    "src/flow.js",
	    "src/block-flow.js",
	    "src/inline-flow.js",
	    "src/background-pos.js",
	    "src/background-pos-2d.js",
	    "src/background-repeat.js",
	    "src/background-repeat-2d.js",
	    "src/background.js",
	    "src/box-flow.js",
	    "src/box-flows.js",
	    "src/box-rect.js",
	    "src/box-corner.js",
	    "src/box-sizing.js",
	    "src/box-sizings.js",
	    "src/font.js",
	    "src/edge.js",
	    "src/radius-2d.js",
	    "src/border-radius.js",
	    "src/border-color.js",
	    "src/border-style.js",
	    "src/padding.js",
	    "src/margin.js",
	    "src/border.js",
	    "src/box-edge.js",
	    "src/partition.js",
	    "src/table-partition.js",
	    "src/box-size.js",
	    "src/text-empha-style.js",
	    "src/text-empha-pos.js",
	    "src/text-empha.js",
	    "src/box-child.js",
	    "src/box.js",
	    "src/box-style.js",
	    "src/html-lexer.js",
	    "src/section-header.js",
	    "src/section.js",
	    "src/toc-context.js",
	    "src/outline-buffer.js",
	    "src/outline-context.js",
	    "src/outline-parser.js",
	    "src/outline-converter.js",
	    "src/document-header.js",
	    "src/document-context.js",
	    "src/border-map.js",
	    "src/collapse.js",
	    "src/token-stream.js",
	    "src/filtered-tag-stream.js",
	    "src/direct-token-stream.js",
	    "src/document-tag-stream.js",
	    "src/html-tag-stream.js",
	    "src/head-tag-stream.js",
	    "src/table-tag-stream.js",
	    "src/list-tag-stream.js",
	    "src/def-list-tag-stream.js",
	    "src/ruby-tag-stream.js",
	    "src/document-generator.js",
	    "src/html-generator.js",
	    "src/element-generator.js",
	    "src/static-block-generator.js",
	    "src/inline-box-generator.js",
	    "src/image-generator.js",
	    "src/hr-generator.js",
	    "src/inline-context.js",
	    "src/block-context.js",
	    "src/block-tree-generator.js",
	    "src/inline-tree-generator.js",
	    "src/child-inline-tree-generator.js",
	    "src/ruby-generator.js",
	    "src/rt-generator.js",
	    "src/link-generator.js",
	    "src/first-line-generator.js",
	    "src/inline-block-generator.js",
	    "src/child-block-tree-generator.js",
	    "src/section-content-generator.js",
	    "src/section-root-generator.js",
	    "src/header-generator.js",
	    "src/body-block-tree-generator.js",
	    "src/floated-block-tree-generator.js",
	    "src/inline-page-generator.js",
	    "src/page-group-generator.js",
	    "src/parallel-generator.js",
	    "src/para-child-generator.js",
	    "src/table-generator.js",
	    "src/table-row-group-generator.js",
	    "src/list-generator.js",
	    "src/inside-list-item-generator.js",
	    "src/outside-list-item-generator.js",
	    "src/def-list-generator.js",
	    "src/eval-result.js",
	    "src/page-evaluator.js",
	    "src/block-tree-evaluator.js",
	    "src/inline-tree-evaluator.js",
	    "src/vert-inline-tree-evaluator.js",
	    "src/hori-inline-tree-evaluator.js",
	    "src/page-group-evaluator.js",
	    "src/page-stream.js",
	    "src/page-group.js",
	    "src/page-group-stream.js",
	    "src/main.js",
	    "src/nehan-end.js"
	  ]
	}
      },
      min:{
	files:{
	  "build/<%= pkg.name %>.min.js":[
	    "COPYING",
	    "obj/<%= pkg.name %>.cjs"
	  ]
	}
      }
    },
    uglify: {
      normal: {
        src: "build/<%= pkg.name %>.js",
        dest: "obj/<%= pkg.name %>.cjs"
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  // Default task(s).
  grunt.registerTask("default", ["concat"]);

};