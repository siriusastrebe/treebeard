nodesByKey = {};
nodesChronological = [];
nodesPending = {};

function getNode (token) { 
  try { 
    return nodesByKey[token];
  }
  catch (e) {
    return false;
  }
}


function processChildren (jsonChildren, parentToken, childrenArr) { 
  // If we're processing a parent who was pending, it must not be anymore. 
  for (key in nodesPending) { 
    if (parentToken === key)
      delete nodesPending[key];
  }

  // Return children nodes, or add them to the pending list if they don't yet exist. 
  jsonChildren.map(function (childToken) { 
      child = getNode(childToken);
      if (child) childrenArr.push(child);
      else { nodesPending[child] = parentToken }
  });
}


function nodesToJson () { 
  json = {branches: []};
  nodesChronological.map(function (item) { 
    if (item.type === 'Root') {
      json['root'] = item.toJson();
    } else { 
      json['branches'].push(item.toJson());
    }
  });
  return json;
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
  this.token = createToken();

  if (!(typeof optional === 'undefined')) { 
    this.children = optional.children || this.children;
    this.token = optional.token || this.token;
    initNode(this, optional.childrenPending || []);
  } else { 
    initNode(this, []);
  }


  this.addChild = function (contents, author, timestamp, optional) {
    child = new Branch(contents, author, this, timestamp, optional);
    this.children.push(child);
    return child;
  }

  function initNode (convo, pending) { 
    if ((convo.token) in nodesByKey) { 
      console.log("Duplicate key found. Double submission.");
      return false;
    }
    nodesByKey[convo.token] = convo;
    nodesChronological.push(convo);
    nodesChronological.sort(function (a, b) { 
      if (a['timestamp'] > b['timestamp']) return 1;
      else return -1;
    });
  }

  function createToken() { 
    rand = Math.random().toString(36).substr(2);
    return rand;
  }
}



// Root
function Root (contents, author, title, link, timestamp, optional) { 
  Node.apply(this, [contents, author, timestamp, optional]);

  this.type = 'Root';
  this.title = title;
  this.link = link;

  this.toJson = function () { 
    children = this.children.map(function(node) { node.token } );
    return {
      contents: this.contents
    , author: this.author
    , children: children
    , timestamp: this.timestamp
    , title: this.title
    , link: this.link
    , token: this.token
    }
  }

}
Root.prototype = Object.create(Node.prototype);

function JSONToRoot (json) {
  children = [];
  processChildren(json.children, json.token, children);
  return new Root(json.contents, json.author, json.title, json.link, json.timestamp, {children: children, token: json.token});
}



/* Branch
 * Argument parent
 */
function Branch (contents, author, parent, timestamp, optional) {
  Node.apply(this, [contents, author, timestamp, optional]);

  this.parent = parent;
  this.type = 'Branch';

  this.toJson = function () { 
    children = this.children.map(function(node) { return node.token } );
    return {
      contents: this.contents
    , author: this.author
    , children: children
    , parent: parent.token
    , timestamp: this.timestamp
    , token: this.token
    }
  }

}
Branch.prototype = Object.create(Node.prototype);

function JSONToBranch (json) {
  children = [];
  processChildren(json.children, json.token, children);
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
  module.exports.nodesToJson = nodesToJson;
  module.exports.JSONToRoot = JSONToRoot;
  module.exports.JSONToBranch = JSONToBranch;
  // Test
  module.exports.nodesChronological = nodesChronological;
}

