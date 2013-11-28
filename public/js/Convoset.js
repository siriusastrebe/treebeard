/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Convoset
 * 
 * Public Methods:
 *  - JsonToNode(json)    (returns a Node object)
 *  - JsonToBranch(json)  (returns a Node object)
 *  - nodesToJson()       (returns JSON)
 *  - getNodes()          (returns a reference to the array containing the list of nodes)
 *  - getNodesByKey()     (returns reference to an associative array of nodes by token)
 *  - root                (returns the root object)
 *  - slug                (returns a string)
 *
 *
 * Those node objects contain the following public methods:
 *  - addChild(contents, author, timestamp, optional)
 *    optional takes the following optional parameters:
 *    - {token, children}
 *
 * Additionally, these nodes data are publically accessible: 
 * - node.contents
 * - node.author
 * - node.children
 * - node.timestamp
 * - node.token
 * - node.type
 *
 * Root has access to: 
 * - node.title
 * - node.link
 *
 * Branches have access to:
 * - node.parent
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

var Convoset = function () { 
  var nodesByKey = {};
  var nodesChronological = [];
  var nodesPending = {};
  var convoset = this;

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*     Helper Functions             */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  function getNode (token) { 
    try { 
      return nodesByKey[token];
    }
    catch (e) {
      return false;
    }
  }


  function processChildren (jsonChildren, parentToken, childrenArr) { 
    // TODO: Discussion. Do we really need a nodesPending list? It's mostly
    // for bookkeeping and debugging sake. It isn't used for primary functionality,
    // only to for developers to confirm at the end of the day that we aren't
    // recieving unlinked nodes. For the moment, I'm keeping it incase a future
    // usecase pops up.
    //
    // If we're processing a parent who was pending, it must not be pending anymore. 
    for (key in nodesPending) { 
      if (parentToken === key)
        delete nodesPending[key];
    }

    if (typeof jsonChildren !== 'undefined') {
      // Return children nodes, or add them to the pending list if they don't yet exist. 
      jsonChildren.map(function (childToken) { 
          child = getNode(childToken);
          if (child) childrenArr.push(child);
          else { nodesPending[child] = parentToken }
      });
    }
  }

  function toSlug (title) { 
    return title.toString() 
                .toLowerCase()
                .replace(/-+/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
  }


  function updateRoot(root) { 
    convoset.root = root;
    convoset.slug = root.slug;
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* Publically Accessible Methods    */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  this.nodesToJson = function () { 
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


  this.getNodes = function () {
    return nodesChronological;
  }

  this.getNodesByKey = function () { 
    return nodesByKey;
  }


  this.toString = function () { 
    return this.root.title;
  }

  this.root;
  this.slug;


  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*        Core Objects              */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*
   * Node is a superclass of Root and Branches... 
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
    this.slug = toSlug(this.title);
    updateRoot(this);

    this.toJson = function () { 
      children = this.children.map(function(node) { node.token } );
      return {
        contents: this.contents
      , author: this.author
      , children: children
      , timestamp: this.timestamp
      , title: this.title
      , slug: this.slug
      , link: this.link
      , token: this.token
      }
    }

  }
  Root.prototype = Object.create(Node.prototype);

  this.JsonToRoot = function (json) {
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

  this.JsonToBranch = function (json) {
    children = [];
    processChildren(json.children, json.token, children);
    parent = getNode(json.parent);
    if (parent) 
      return parent.addChild(json.contents, json.author, json.timestamp, {children: children, token: json.token});
    else
      return false;
  }
}


/* Exporting (Require in Node.js) */
if (typeof module !== 'undefined') {
  module.exports = Convoset;
}
