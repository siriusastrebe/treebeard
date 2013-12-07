/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Convoset
 * 
 * Public Methods:
 *  - JsonToNode(json)    (returns a Node object)
 *  - JsonToBranch(json)  (returns a Node object)
 *  - nodesToJson()       (returns JSON)
 *  - getNodes()          (returns a reference to the array containing the list of nodes)
 *  - getNodesByKey()     (returns reference to an associative array of nodes by token)
 *  - findNode(token)     (returns a Node object)
 *  - root                (returns the root object)
 *  - slug                (returns a string)
 *
 *
 * Those node objects contain the following public methods:
 *  - newChild(contents, author, timestamp, optional)
 *    optional takes the following optional parameters:
 *    - {token, children}
 *
 * Additionally, these nodes data are publically accessible: 
 * - node.contents
 * - node.author
 * - node.children
 * - node.timestamp
 * - node.time
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
  var convoset = this;
  var nodesByKey = {};
  var nodesChronological = [];

  var orphansOf = {};
  var estrangedParentOf = {};

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*     Helper Functions             */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
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

  this.getNodesAssociative = function () { 
    return nodesByKey;
  }

  this.findNode = function (token) { 
    try { 
      return nodesByKey[token];
    }
    catch (e) {
      return false;
    }
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
    this.childTokens = [];
    this.timestamp = timestamp;
    this.time = timestamp.getHours() + ':' + timestamp.getMinutes();
    this.token = createToken();

    if (!(typeof optional === 'undefined')) { 
      this.childTokens = optional.childTokens || [];
      this.children = optional.children || [];
      this.token = optional.token || this.token;
    }

    initNode(this);

    this.newChild = function (contents, author, timestamp, optional) {
      return new Branch(contents, author, this.token, timestamp, optional);
    }


    function createToken() { 
      rand = Math.random().toString(36).substr(2);
      return rand;
    }


    function initNode (convo) { 
      // Reunite missing relations
      if (convo.token in orphansOf) { 
        for (var i=0; i<orphansOf.length; i++) { 
          orphan = orphansOf[convo.token][i];
          orphan.parent = this;
          orphansOf[convo.token].splice(i--, 1);
        }
      }

      // Add to global node lists.
      if (convo.token in nodesByKey) { 
        console.log("Duplicate key found: " + convo.token);
        return false;
      }

      nodesByKey[convo.token] = convo;
      nodesChronological.push(convo);
      nodesChronological.sort(function (a, b) { 
        if (a['timestamp'] > b['timestamp']) return 1;
        else return -1;
      });

      // Find all children.
      convo.childTokens.forEach(function (token) { 
          child = convoset.findNode(token);
          if (child) 
            children.push(child);
          else 
            estrangedParentOf[token] = this.token;
      });
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
      , childTokens: this.childTokens
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
    return new Root(json.contents, json.author, json.title, json.link, new Date(json.timestamp), {childTokens: json.childTokens, token: json.token});
  }



  /* Branch
   * Argument parent
   */
  function Branch (contents, author, parentToken, timestamp, optional) {
    Node.apply(this, [contents, author, timestamp, optional]);

    this.type = 'Branch';
    this.parentToken = parentToken;

    this.parent = convoset.findNode(this.parentToken);
    this.parent.children.push(this);

    if (this.token in estrangedParentOf) { 
      parent = estrangedParentOf[this.token]

      if (parent.token !== this.parentToken) 
        console.log("Unauthorized adoption of orphan");

      else { 
        delete estrangedParentOf[convo.token]
      }
    }


    /*
    else { 
      if (!(parentToken in orphansOf)) 
        orphansOf[parentToken] = [];
      orphansOf[parentToken].push(this);
    }
    */




    
    this.toJson = function () { 
      children = this.children.map(function(node) { return node.token } );
      return {
        contents: this.contents
      , author: this.author
      , childTokens: this.childTokens
      , parentToken: this.parentToken
      , timestamp: this.timestamp
      , token: this.token
      }
    }

  }
  Branch.prototype = Object.create(Node.prototype);

  this.JsonToBranch = function (json) {
    return new Branch(json.contents, json.author, json.parentToken, new Date(json.timestamp), {childTokens: json.childTokens, token: json.token});
  }
}


/* Exporting (Require in Node.js) */
if (typeof module !== 'undefined') {
  module.exports = Convoset;
}
