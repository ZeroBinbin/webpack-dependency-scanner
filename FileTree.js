var fs = require('fs');
var path = require('path');
var process = require('process');

var FileTree = function( rootPath ){
	this.tree = iteratorDir(rootPath);
	this.log = function(){
		consoleTree(this.tree);
	}
	this.treeArray = tree2Array(this.tree);
}
FileTree.prototype.findFileByUrl = function( url = "" ){
	var retFile = null;
	this.treeArray.forEach((file)=>{
		if(file.absUrl === url){
			retFile = file
		}
	})
	return retFile;
}

var iteratorDir = function(currentPath ,parent){
	var root = null ,{ name ,ext } = path.parse(currentPath) ;
	if(ext === ""){
		var dir = {
			name : name,
			url : parent?path.join(parent.url ,currentPath):path.normalize(currentPath),
			absUrl:parent?path.resolve(parent.url ,currentPath):path.resolve(currentPath),
			children:[]
		}
		parent ? parent.children.push(dir) : root = dir;
		var names = fs.readdirSync(dir.url);
		names.forEach((name)=>{
			iteratorDir(name ,dir);
		});
	}else {
		var file = {
			name : name + ext,
			url : parent?path.join(parent.url ,currentPath):path.normalize(currentPath),
			absUrl:parent?path.resolve(parent.url ,currentPath):path.resolve(currentPath),
		}
		parent ? parent.children.push(file) : root = file;
	}

	return root;
}
var consoleTree = function(tree){
	var str = ""
	var search= function(tree ,level = -1){
		level += 1;
		for(var i = 0;i<level;i++){
			str+='-'
		}
		if(tree) str += tree.name+"\n";
		if(Array.isArray(tree.children)){
			tree.children.forEach((node)=>{
				search(node ,level);
			});
		}
	}
	search(tree);
	console.log(str)
}

var tree2Array = function(tree){
	var arr = []
	var search= function(tree){
		if(tree) arr.push(tree);
		if(Array.isArray(tree.children)){
			tree.children.forEach((node)=>{
				search(node );
			});
		}
	}
	search(tree);
	return arr
}

var test = function(){
    var param = process.argv[2] , tree = null;
    if( param!==null && param!==undefined ){
	    tree = iteratorDir(param);
    }
    else {
	    console.log('�����ò���')
    }
}


module.exports = FileTree;