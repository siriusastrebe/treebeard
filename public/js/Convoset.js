/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Convoset
 * 
 * Public Methods:
 *  - JsonToNode(json)    (returns a Node object)
 *  - JsonToBranch(json)  (returns a Node object)
 *  - nodesToJson()       (returns JSON)
 *  - getNodes()          (returns a reference to the array containing the list of nodes)
 *  - getNodesByKey()     (returns reference to an associative array of nodes by token)
 *  - findNode(token)     (returns a Node object or false)
 *  - getFamily(token)    (returns an array of Node objects)
 *  - root                (returns the root object)
 *  - slug                (returns a string)
 *
 *
 * Those node objects contain the following public methods:
 *  - newChild(contents, author, timestamp, optional)
 *    optional takes the following optional parameters:
 *    - {token, children}
 *  - getSiblings()          (returns a list of Node objects)
 *
 * Additionally, these nodes data are publically accessible: 
 * - node.contents
 * - node.author
 * - node.children
 * - node.census
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
    node = nodesByKey[token];

    if (typeof node === 'undefined')
      return false

    return node;
  }

  this.toString = function () { 
    return this.root.title;
  }

  this.root;
  this.slug;



  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*       Marked for deletion        */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*
  this.getFamily = function (token) { 
    family = [];
    node = convoset.findNode(token);
     
    // descendants
    iterator = function (depth, cutoff) {
      return {depth: depth, cutoff: cutoff-2} }

    family.concat( getDescendants(node, 4, 8, iterator) );
    
    // siblings
    family.concat(node.getSiblings());
    
    // parents, uncles/aunts
    parent = node.parent;
    family.push(parent);
    
    function getDesendants(node, depth, cutoff, iterator) { 
      descendants = []; 

      if (typeof iterator === 'function')
        nextParams = iterator(depth, cutoff);
      else 
        nextParams = {depth: depth, cutoff: cutoff};

      for (var i=0; i<cutoff; i++) { 
        child = node.children[i];
        descendants.push(child);

        if (depth > 0) {
          descendants.concat( getChildren(child, nextParams.depth, nextParams.cutoff, iterator) );
        }
      };

      return descendants;
    }
  }

  this.findFlow = function () { 
    var flow = this,
        primary,
        ancestors = [],
        relatives = [];

    primary = convoset.nodes[Math.floor(Math.random()*items.length)];
    ancestors = [];

      if (primary.type !== 'root') { 
      ancestors.push(primary.parent);
      for (var i=0; i<6; i++) { 
        if (ancestors[i].type != 'root') { 
          ancestors.push(ancestors[i].parent);
        }
      }

      ancestors.forEach( function (ancestor) { 
          if (ancestor.children.length < 12) 
            relatives.push(ancestor.children);
          else { 
            relatives.push(ancestor.children.splice(0, 12));
          }
      });
    }


    this.toJson = function () {
      primary = flow.primary
      ancestors = flow.ancestors.map(function (a) { a.toJson() });
      relatives = flow.relatives.map(function (r) { r.toJson() });

      return {
        primary: primary,
        family: ancestors.concat(relatives)
      }
    }

    return this;
  }

  */



  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*        Core Objects              */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /*
   * Node is a superclass of Root and Branches... 
   */
  function Node (contents, author, timestamp, parentToken, optional) { 
    var node = this;

    this.depth = false;
    this.author = author;
    this.contents = contents;
    this.timestamp = timestamp;
    this.parentToken = parentToken;
    this.token = createToken();
    this.children = [];
    this.childTokens = [];
    this.amberAlert = [];
    this.census = 0;
    this.time = timestamp.getHours() + ':' + timestamp.getMinutes();

    if (!(typeof optional === 'undefined')) { 
      this.childTokens = optional.childTokens || [];
      this.token = optional.token || this.token;
      this.depth = optional.depth || optional.depth;
      if (this.depth === false && node.type === 'Root')
        this.depth = 0;
    }

    this.updateCensus = function () { 
      node.census = node.childTokens.length;
    }

    this.newChild = function (contents, author, timestamp, optional) {
      return new Branch(contents, author, timestamp, node.token, optional);
    }

    this.addChild = function (node) { 
      // Introducing
      if (node.childTokens.indexOf(node.token) === -1) 
        node.childTokens.push(node.token);
      // Birthing
      if (node.children.indexOf(node) === -1) 
        node.children.push(node);
      else 
        console.log('Warning: raise the alarms! Child adopted twice.');

      node.updateCensus();
    }

    initNode();
    determineAncestry();

    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    //     Housecleaning Functions      //
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    function createToken() {
      rand = Math.random().toString(36).substr(2);
      if (convoset.findNode(rand))
        return createToken();
      else  
        return rand;
    }

    function initNode () { 
      // Add to global node lists.
      if (node.token in nodesByKey) { 
        console.log("Duplicate key found: " + node.token);
        return false;
      }

      nodesByKey[node.token] = node;
      nodesChronological.push(node);
      nodesChronological.sort(function (a, b) { 
        if (a['timestamp'] > b['timestamp']) return 1;
        else return -1;
      });

      node.updateCensus();
    }

    function determineAncestry () { 
      node.parent = convoset.findNode(node.parentToken);

      if (node.parent) {
        // Reuniting
        amber = node.parent.amberAlert.indexOf(node.token);
        if (amber > -1) 
          node.parent.amberAlert.splice(alert, 1);
        
        // Introducing
        if (node.parent.childTokens.indexOf(node.token) === -1)
          node.parent.childTokens.push(node.token);

        // Birthing...?
        if (node.parent.children.indexOf(node) === -1) 
          node.parent.children.push(node);
        else
          console.log("Warning: strange things are afoot. A parent aleady adopted this child.");

        // Depth
        if (!node.depth && node.parent.depth) 
          node.depth = node.parent.depth+1;
      }

      node.childTokens.forEach( function (childToken) {
        child = convoset.findNode(childToken);
        
        if (child) {  
          // Birthing
          if (node.children.indexOf(child) === -1) 
            node.children.push(child); 
          else 
            console.log("Warning: Abandon all hope. This node's already got this child.");
          // Inspecting
          if (child.parentToken !== node.token) 
            console.log("Warning: Ruh roh. This child claims it's owned by a different parentToken.");
          // Impressioning  
          if (child.parent === false) { 
            child.parent = node;
          }
          else {
            if (child.parent !== node)
              console.log("Warning: danger Will Robinson. This child is already owned by a different parent.");
          }
        }
        else {
          node.amberAlert.push(childToken);
        }
      });
    }
  }



  function Root (contents, author, title, link, timestamp, optional) { 
    this.type = 'Root';

    Node.apply(this, [contents, author, timestamp, false, optional]);

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
      , depth: this.depth
      }
    }

    /* Unused. Marked for Deletion
    this.getSiblings = function () { 
      // We could make it return a list of all the roots.
      // or false.
      // However, this plays well with getFamily, so we're
      // sticking with this.
      return [];
    }
    */

  }
  Root.prototype = Object.create(Node.prototype);

  this.JsonToRoot = function (json) {
    return new Root(json.contents, json.author, json.title, json.link, new Date(json.timestamp), {childTokens: json.childTokens, token: json.token, depth: json.depth});
  }



  /* Branch
   * Argument parent
   */
  function Branch (contents, author, timestamp, parentToken, optional) {
    Node.apply(this, [contents, author, timestamp, parentToken, optional]);

    this.type = 'Branch';
 
    /* Unused. Marked for deletion.
    this.getSiblings = function () { 
      generation = this.parent.children;

      position = generation.indexOf(this);
      return generation.splice(position, 1);
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
      , depth: this.depth
      }
    }

  }
  Branch.prototype = Object.create(Node.prototype);

  this.JsonToBranch = function (json) {
    return new Branch(json.contents, json.author, new Date(json.timestamp), json.parentToken, {childTokens: json.childTokens, token: json.token, depth: json.depth});
  }
}


/* Exporting (Require in Node.js) */
if (typeof module !== 'undefined') {
  module.exports = Convoset;
}
