
var DependencyTopologic = function( tree ,generateFn){
    this.dependencies = [];
    generateFn(tree , this);
}
DependencyTopologic.prototype.exists = function(dependency){
    for(var i=0 ;i<this.dependencies.length;i++){
        if(dependency.from ==this.dependencies[i].from &&dependency.to ==this.dependencies[i].to){
            return true;
        } else if(dependency.from ==this.dependencies[i].from &&dependency.to ==this.dependencies[i].to){
            this.dependencies[i].twoWay = true;
            return true
        }
    }
    return false;
}
DependencyTopologic.prototype.push = function(dependency){
    if(!dependency.from || !dependency.to ){
        console.error('关系错误 error')
        return
    }
    this.dependencies.push(dependency)
}
DependencyTopologic.prototype.log = function(){
    console.log(this.dependencies);
}
module.exports = DependencyTopologic;