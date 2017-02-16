var fs = require('fs');
var path = require('path');
var FileTree = require('./FileTree.js');
var DependencyTopologic = require('./DependencyTopologic.js');


var VIS = path.parse(require.resolve('vis'));
var VIS_PATH = VIS.dir;
var VIS_FILENAME = VIS.base;
var VIS_CSS_FILENAME = VIS.name + '.css';
var HTML_FILENAME = 'index.html';
var REPLACEMENT_STRING = '<!-- webpack-react-graph -->';
var COLORS = {
  ORANGE: '#f37321',
  RED: '#ee3524',
  BROWN: '#54301a',
  BLUE: '#10a6df'
};

function assetDescriptionFromFile(file, script) {
  var buffer = fs.readFileSync(file);
  var description = {
    source: function() {
      return buffer.toString('ascii');
    },
    size: function() {
      return buffer.length;
    }
  };
  if (typeof script !== 'undefined') {
    description.source = function() {
      return buffer.toString('ascii').replace(REPLACEMENT_STRING, script);
    };
  }
  return description;
}

function requestHasSubstring(module, substring) {
  return typeof module.request !== 'undefined' && module.request.indexOf(substring) > -1;
}

function ReactGraphPlugin(options) {
  this.scanRoot = options.scanRoot;
  this.targetDirectory = options.target;
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
  compilation.assets[path.join(this.targetDirectory, VIS_FILENAME)] = assetDescriptionFromFile(path.join(VIS_PATH, VIS_FILENAME));
  compilation.assets[path.join(this.targetDirectory, VIS_CSS_FILENAME)] = assetDescriptionFromFile(path.join(VIS_PATH, VIS_CSS_FILENAME));
  compilation.assets[path.join(this.targetDirectory, HTML_FILENAME)] = assetDescriptionFromFile(path.join(__dirname, HTML_FILENAME), script);
  callback();
};

ReactGraphPlugin.prototype.processComponent = function(module) {
  var componentName = this.componentName(module);
  if (typeof this.components[componentName] === 'undefined') {
    this.components[this.componentName(module)] = {
      dispatchesActions: this.checkForActions(module),
      connectsToStore: this.checkForStoreConnection(module),
      children: []
    };
    module.dependencies.forEach(function(dependency) {
      var dependencyName;
      if (dependency.module !== null) {
        dependencyName = this.componentName(dependency.module);
        if (dependencyName != null) {
          this.components[componentName].children.push(this.componentName(dependency.module));
          this.processComponent(dependency.module);
        }
      }
    }.bind(this));
  }
};

ReactGraphPlugin.prototype.componentName = function(module) {
  var source;
  var displayNameResult;
  var classNameResult;
  var variableNameResult;
  if (module._source === undefined || module._source === null) {
    return null;
  }
  source = module._source._value;
  displayNameResult = /displayName\s*[:=]\s*['"](.+)['"]/.exec(source);
  classNameResult = /class\s+(\w+)\s+extends\s+Component/.exec(source);
  variableNameResult = /var\s+(\w+)\s+=\s+React.createClass/.exec(source);
  if (displayNameResult !== null) {
    return displayNameResult[1];
  } else if (classNameResult !== null) {
    return classNameResult[1];
  } else if (variableNameResult !== null) {
    return variableNameResult[1];
  } else {
    return null;
  }
};

ReactGraphPlugin.prototype.findComponent = function(compilation, name) {
  var i;
  var module;
  for (i = 0; i < compilation.modules.length; i++) {
    module = compilation.modules[i];
    console.log(module.id)
    if (this.componentName(module) === name) {
      return module;
    }
  }
  return null;
}

ReactGraphPlugin.prototype.checkForActions = function(module) {
  return module.dependencies.some(function(dependency) {
    return requestHasSubstring(dependency, this.actionsDirectory);
  }.bind(this));
};

ReactGraphPlugin.prototype.checkForStoreConnection = function(module) {
  return module.dependencies.some(function(dependency) {
    return requestHasSubstring(dependency, this.storesDirectory);
  }.bind(this));
};

ReactGraphPlugin.prototype.inlinedScript = function(ft,dt) {
  if (typeof this.graph === 'undefined') {
    this.generateGraph(ft,dt);
  }
  return 'var nodes = ' + JSON.stringify(this.graph.nodes) + '; var edges = ' + JSON.stringify(this.graph.edges) + ';';
};

ReactGraphPlugin.prototype.generateGraph = function(ft,dt) {
  this.graph = {
    nodes: [],
    edges: []
  };
  this.generateGraphNode(ft,dt);
};

ReactGraphPlugin.prototype.generateGraphNode = function(ft ,dt) {
  var { treeArray } = ft , { dependencies } = dt;
  treeArray.forEach((node)=>{
    this.graph.nodes.push({
      id:node.absUrl,
      label:node.name
    })
  })
  dependencies.forEach((dependency)=>{
    this.graph.edges.push({
      from : dependency.from.absUrl,
      to : dependency.to.absUrl,
      arrows:dependency.twoWay?"from;to":"to"
    })
  });
};

ReactGraphPlugin.prototype.addLegendToGraph = function() {
  var brownNodeId = this.addLegendNodeToGraph(COLORS.BROWN, 'Store and Actions');
  var redNodeId = this.addLegendNodeToGraph(COLORS.RED, 'Store');
  var orangeNodeId = this.addLegendNodeToGraph(COLORS.ORANGE, 'Actions');
  var blueNodeId = this.addLegendNodeToGraph(COLORS.BLUE, 'Pure');
};

ReactGraphPlugin.prototype.addLegendNodeToGraph = function(color, label) {
  var id = this.graph.nodes.length;
  this.graph.nodes.push({
    id: id,
    label: label,
    color: color,
    shape: 'box',
    group: 1
  });
  return id;
};

module.exports = ReactGraphPlugin;
