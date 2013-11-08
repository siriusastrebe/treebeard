/*
 * Node is a superclass of Root and Branches... 
 * Shouldn't have to be instantiated outside
 * of this file.
 * 
 * Argument 'children' are optional.
 */
function Node (contents, author, children) { 
  this.contents = contents;
  this.author = author;

  if (typeof (children) !== undefined) 
    this.children = children;
  else 
    this.children = [];
}




function Root (contents, author, children, title, link) { 
  Node.apply(this, [contents, author, children]);

  this.title = title;
  this.link = link;
}
Root.prototype = Object.create(Node.prototype);


function Branch (contents, author, children, parent) {
  Node.apply(this, [contents, author, children]);

  this.parent = parent;
}
Branch.prototype = Object.create(Branch.prototype);


/* Exporting (requirement of including this file in Node.js) */
if (typeof module !== 'undefined') {
  module.exports.Root = Root;
  module.exports.Branch = Branch;
}

