var fs = require('fs');
var path = require('path');
var FileTree = require('./FileTree.js');
var DependencyTopologic = require('./DependencyTopologic.js');

var REPLACEMENT_STRING = '"something-so-special-that-cant-apear-in-one-project-twice"';



function ReactGraphPlugin(options) {
  this.scanRoot = options.scanRoot;
  this.targetDirectory = options.target;
  this.componentPlace = options.componentPlace;
}

ReactGraphPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', this.emitHandler.bind(this));
};

ReactGraphPlugin.prototype.emitHandler = function(compilation, callback) {
  if (compilation['errors'] && compilation['errors'].length > 0) {
    compilation['errors'].forEach(function(error) {
      console.error(error.stack);
    });
    console.error('=======================================');
    console.error(' COMPILATION ERRORS. SEE ABOVE. ');
    console.error('=======================================');
  }
  var fileTreeInstance = new FileTree(this.scanRoot);
  var generateTopologic = function(modules ,dtInstance){
    modules.forEach((module)=>{
      var file = null;
      if(!isNaN(+module.id)) return;
      if(!(file = fileTreeInstance.findFileByUrl(path.resolve(module.id)))) return;
      var search = function( module ,file ){
        var deps = module.dependencies;
        if(Array.isArray(deps)){
          deps.forEach((dep)=>{
            if(!dep.module) return;
            if(!(tfile = fileTreeInstance.findFileByUrl(path.resolve(dep.module.id)))) return;
            var dependency = {
              from : file,
              to : tfile
            }
            if(!dtInstance.exists(dependency)){
              dtInstance.push(dependency);
              search( dep.module ,tfile);
            }
          })
        }
      }
      search(module ,file );
    });
  }
  var dependencyTopologicInstance = new DependencyTopologic(compilation.modules ,generateTopologic);
  var script = this.inlinedScript(fileTreeInstance ,dependencyTopologicInstance);
  var buffer = compilation.assets[this.componentPlace].source();
  compilation.assets[this.componentPlace] = {
    source : function(){
      return buffer.replace(REPLACEMENT_STRING ,script);
    },
    size : function(){
      return buffer.length;
    }
  }
  callback();
};

ReactGraphPlugin.prototype.inlinedScript = function(ft,dt) {
  if (typeof this.graph === 'undefined') {
    this.generateGraph(ft,dt);
  }
  return  JSON.stringify(this.graph.nodes) + '; var edges = ' + JSON.stringify(this.graph.edges) + ';';
};

ReactGraphPlugin.prototype.generateGraph = function(ft,dt) {
  this.graph = {
    nodes: [],
    edges: []
  };
  this.generateGraphNode(ft,dt);
};

module.exports = ReactGraphPlugin;
