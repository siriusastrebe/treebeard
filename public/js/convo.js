nodesByKey = {};
nodesChronological = [];

function getNode (token) { 
  try { 
    return nodesByKey[token];
  }
  catch (e) {
    console.log("Error: cannot locate convo with a token of " + token);
    return false
  }
}

function initNode(convo, sortKey) { 
  nodesByKey[convo.token] = convo;
  nodesChronological.push(convo);
  nodesChronological.sort(function (a, b) { 
    if (a["sortkey"] < b["sortkey"]) return 1;
    else return -1;
  });
}




/*
 * Node is a superclass of Root and Branches... 
 * Shouldn't have to be instantiated outside
 * of this file.
 * 
 * Argument 'children' are optional.
 */
function Node (contents, author, timestamp, optional) { 
  this.contents = contents;
  this.author = author;
  this.children = [];
  this.timestamp = timestamp;
  this.token = Math.random().toString(36).substr(2);

  if (!(typeof optional === 'undefined')) { 
    this.children = optional.children || this.children;
    this.token = optional.token || this.token;
  }

  initNode(this);

  this.addChild = function (contents, author, optional) {
    child = new Branch(contents, author, this, optional);
    this.children.push(child);
    return child;
  }
}



// Root
function Root (contents, author, title, link, timestamp, optional) { 
  Node.apply(this, [contents, author, timestamp, optional]);

  this.title = title;
  this.link = link;

  this.toJson = function () { 
    children = this.children.map(function(node) { node.token } );
    return {
      contents: this.contents
    , author: this.author
    , children: children
    , title: this.title
    , link: this.link
    , token: this.token
    }
  }

}
Root.prototype = Object.create(Node.prototype);

function JSONToRoot (json) {
  children = json.children.map(function (childToken) { return getNode(childToken) });
  return new Root(json.contents, json.author, json.title, json.link, json.timestamp, {children: children, token: json.token});
}


/* Branch
 * Argument parent
 */
function Branch (contents, author, parent, timestamp, optional) {
  Node.apply(this, [contents, author, optional]);

  this.parent = parent;

  this.toJson = function () { 
    children = this.children.map(function(node) { return node.token } );
    return {
      contents: this.contents
    , author: this.author
    , children: children
    , parent: parent.token
    , token: this.token
    }
  }

}
Branch.prototype = Object.create(Node.prototype);

function JSONToBranch (json) {
  children = json.children.map(function (childToken) { return getNode(childToken) });
  parent = getNode(json.parent);
  if (parent) 
    return parent.addChild(json.contents, json.author, json.timestamp, {children: children, token: json.token});
  else
    return false;
}






/* Exporting (requirement of including this file in Node.js) */
if (typeof module !== 'undefined') {
  module.exports.Root = Root;
  module.exports.Branch = Branch;
}

