/*                    */
/*      Socket.io     */
/*                    */
var Convos = new Convoset();
var debug;


IO.on('connect', function () {
  // Get the names of each topic.
  // the TOPICS variable should be preset in the
  // html portion.
  
  IO.emit('introduceMe', {topics: TOPICS, anchors: ANCHORS});
});


/*                       */
/*    Custom Methods     */
/*                       */
function root (json) {
  node = Convos.JsonToRoot(json);
  node.activeChildren = []; 
  return node;
}

function branch (json) {
  node = Convos.JsonToBranch(json);
  node.activeChildren = [];
  return node;
}

function computeFlow (anchors) {
  var seen = {};
  var maxDepth = 10;
  anchors.forEach( function (anchor) {


function FlowMachine (anchors) { 
  var FM = this;

  this.chainLength = 3;

  this.roots = [];
  this.chains = [];
  this.flows = [];
  this.anchors = [];

  function init (anchors) { 
    anchors.forEach( function (anchor) {
      FM.chains.push( new Chain (anchor) );
    });

    findCommonLinks(flow.chains);

    FM.chains.forEach (function (chain) { 
      if (chain.attached !== false) {
        flow = new Flow(chain);
      }
    });
  }


  function Chain (anchor) { 
    var chain = this;
    this.links = [];
    this.anchor = anchor;
    this.top;

    this.attached = false;
    this.attachments = [];


    this.forge();

    this.forge = function () { 
      chain.links.length = 0;

      chain.top = link(flow.anchor, 0)
      
      function link (node, distance) { 
        chain.links.push(node);

        if (node.parent && distance < FM.chainLength) 
          return link(node.parent, distance + 1);
        else
          return node;
      }
    }
  }

  function findCommonLinks (chains) { 
    chains.sort(depthSortDescending);

    function depthSortDescending (a, b) { 
      return b.anchor.depth - a.anchor.depth;
    }

    chains.forEach( function (chain) { 
      chain.attached = false;
      chain.attachments = [];
    });

    for (var a=0; a<chains.length; a++) { 
      if (chains[a].attached) continue;

      for (var b=a+1; b<chains.length; b++) { 
        if (chains[b].attached) continue;

        aChain = chains[a].links;
        bChain = chains[b].links;
        aChainTop = aChain[aChain.length-1];

        if (bChain[0].depth < aChainTop.depth) break;

        commonLink = bChain[0].depth - aChainTop.depth;

        if (aChainTop === bChain[commonLink]) { 
          chains[b].attached = {host: chains[a], link: commonLink};
          chains[a].attachments.push({guest: chains[b], link: commonLink});
        }
      }
    }
  }


  function Flow (chain) { 
    var flow = this;
    this.chains = [];
    this.root;

    this.chains.push(chain);
    this.chains.attachmentsforEach( function (attachment) {
      this.chains.push(attachment.guest);
    });

    function Flow

    function FlowNode (chain, node, index) { 
      this.flowdaddy = false;
      if (chain[index] < FM.chainLength-1)
        this.flowdaddy = chain[index+1]

      this.flowbabies = [];

      this.anchor = false;
      if (chain.anchor === node)
        this.anchor = true;

      this.root = false;
      if (chain.root === node) 
        this.root = true;

    }
  }
}


/*
function flow () { 
  anchors = [];

  ANCHORS.forEach( function (anchorToken) { 
    anchor = new Anchor(anchorToken);
    if (anchor.root)
      anchors.push(anchor);
  });

  roots = anchors.map( function (anchor) { return anchor.root } );

  return roots;
}

function Anchor (token) { 
  this.anchor = Convos.findNode(token);
  this.root = labelAncestry(this.anchor, this.anchor, 0, 0, false);

  function labelAncestry (anchor, node, ups, downs, previous) {
    // This is a reverse DFS graph starting at a node,
    // traversing parents and any children not yet traversed.
    
    // These are all direct parents of Anchored.
    if (downs === 0) {
      if (previous) 
        node.activeChildren.push(previous);

      if (!node.anchored) { 
        node.anchored = true;
        node.anchor = anchor;
      }
      else { 
        return false;
      }
    }

    if (ups < 4 && node.parent) {
      return labelAncestry (anchor, node.parent, ups+1, downs, node);
    }
    else { 
      node.root = true;
      return node; 
    }
  }
}
*/

/* Marked for deletion
function flow () { 
  var flow = this;
  this.target = Convos.getNodes()[Math.floor(Convos.getNodes().length * Math.random())];
  this.root;


  this.reflow = function () { 
    activate(flow.target, 6);

    function activate (node, depth) { 
      if (node.parent) { 
        node.parent.activeChildren = [node];
        node.expand();
        if (depth > 0)
          activate(node.parent, depth--);
        else
          flow.root = node;
      }
      else 
        flow.root = node;
    }
  }
};



function expand () { 
  console.log(this);
  for (var i=0; i<this.children.length; i++) {
    if (this.activeChildren.indexOf(this.children[i]) === -1) {
      this.activeChildren.push(this.children[i]);
      break;
    }
  }
}

*/

/*
var FlowMachine = function (anchors, convoset) {
  var FM = this,
      anchorChains = {},
      anchorRoots = {};

  this.convoset = convoset;
  this.flows = [];
  this.roots = [];
  this.redraw = redraw();

  
  anchors.forEach( function (anchor) {
    flow = new Flow (anchor);

    FM.flows.push(flow);
    if (flow.attached === false)
      FM.roots.push(flow.root);
  });

  redraw();
  
  return this;


  function redraw () { 
    // reset
    FM.convoset.getNodes().forEach (function (node) { 
      node.activeChildren.length = 0;
      node.anchor = null;
      delete node.root;
      delete node.anchor;
    });
    
    // activate each
    FM.flows.forEach (function (flow) { 
      // Discussion: This doesn't confirm that the nodes
      // will be drawn; it puts faith that the root will
      // contain it already
      for (var i=0; i < flow.chain.length - 1; i++) { 
        parent = flow.chain[i+1];
        child = flow.chain[i];

        if (parent.activeChildren.indexOf(child) === -1) { 
          if (parent.children.indexOf(child) !== -1) { 
            parent.activeChildren.push(child);
          }
          else  
            console.log("Error: Chain for " + parent.contents + " is adding " + child.contents + ", but isn't a child.");
        }
      }

      if (!flow.attached) 
        flow.root.root = true;

      flow.chain[0].anchor = true;
    });
  }


  function Flow (anchor) {
    var flow = this;

    this.anchor = anchor;
    this.root;
    this.chain = [];
    this.type = 'Flow';
    this.attached = false;
    this.reRoot = function (node) { reRoot(node) };
    this.forgeChain = function () { 
        this.root = forgeChain (anchor, 0) } 

    this.reAnchor = function (node) {
      // TODO: this
      return node;
    }

    this.root = forgeChain(anchor, 0);
    
    return this;



    // Helper Functions
    function reRoot (node) { 
      index = flow.chain.indexOf(node);
      if (index >= 0) { 
        position = FM.roots.indexOf(flow.root);

        flow.root = node;
        flow.chain.splice(index+1);

        FM.roots.splice(position, 1, flow.root);

      }
      else {
        console.log("Error: Can't reRoot " + node.contents + " to a node not in the chain.");
      }
    }

    function forgeChain (node, distance) { 
      // Bookkeeping
      flow.chain.push(node);

      // Case 1: Any chain link intersects with the root of a different anchor
      if (node.token in anchorRoots && distance > 0) {
        // Adopt this as our root
        flow.attached = true;
        console.log(flow.anchor.contents + ' adopted onto anchor ' + node.contents);
        return anchorRoots[node.token];
      }

      if (distance < 2 && node.parent) { 
        // Our root isn't here, move up
        track(node.token, flow);
        return forgeChain(node.parent, distance+1);
      }

      else {
        // We've found our root
        // Case 2: This is a root intersecting another's chain
        if (node.token in anchorChains) { 
          anchorChains[node.token].forEach(function (flo) { 
            if (flo.root !== node) { 
              flo.attached = true;
              flo.reRoot(node);
              console.log('reRooting ' + flo.anchor.contents + ' to '  + node.contents);
            }
          });
        }

        anchorRoots[node.token] = flow;
        console.log('anchoring ' + flow.anchor.contents + ' to ' + node.contents);

        return node;
      }
    }
  }

  function track (token, flow) { 
    if (!(token in anchorChains))
      anchorChains[token] = [flow];
    else
      anchorChains[token].push(flow);
  }
}
*/






/*                       */
/*       Controller      */
/*                       */

APP.controller('PostsController', ['$scope', '$rootScope', '$timeout', '$location', function ($scope, $rootScope, $timeout, $location) {
  // --------------------------------
  // Defaults
  // --------------------------------
  $scope.view = 'tree';
  $scope.posts = Convos.getNodes();
  $scope.selectedModel = false;

  $scope.roots = [root(TREEJSON.root)];

  TREEJSON.branches.map( function (convo) { 
    branch(convo);
  });

  var Anchors = ANCHORS.map(function (token) {
    var node = Convos.findNode(token);
    if (node) return node
    else console.log('Warning: Anchor ' + token + ' doesnt exist.');
  });


  fm = new FlowMachine (Anchors);
  debug = fm;
  $scope.flows = fm.flows.map( function (flow) { return flow.root });

  // --------------------------------
  // Testing/Debugging
  // --------------------------------
  $scope.debugConvo;
  $scope.debugView = false;

    $scope.$watch( 
    function () { return DEBUG }, 
    function (dev, o) { $scope.development = dev }
  );
  

  Convos.debug = function () { 
    $scope.$apply( function () { 
      $scope.roots = $scope.roots[0].children[0];
      console.log($scope.roots);
    });
  }

  $scope.debug = function (convo) { 
    if ($scope.debugView === false) { 
      $scope.debugView = true;
      convo.debug = true;
      $scope.debugConvo = convo;
    }
  }

  $scope.closeDebug = function () { 
    $scope.debugView = false;
    $scope.debugConvo = false;
  }

  // --------------------------------
  // Tree/List/Flow View control
  // --------------------------------
  // Triggered on pageload in addition to any url changes.
  $scope.$on("$locationChangeStart", function (event, next, current) { 
    if ($location.hash() === 'forum') { 
      $scope.view = 'forum';
    }
    else if ($location.hash() === 'tree') { 
      $scope.view = 'tree';
    }
    else if ($location.hash() === 'flow') {
      $scope.view = 'flow';
    }
    else $scope.view = 'tree';
  });

  // --------------------------------
  // Node manipulation
  // --------------------------------
  // Replying to a node
  $scope.reply = function(post) {
    if (LOGIN.status === 'participant') {
      json = {
               contents: post.response,
               author: LOGIN.username,
               parentToken: post.token,
             }

      post.response = "";
      post.replying = false;
      $scope.select(false);

      IO.emit('addBranch', { topic: TOPICS, convo: json });
    }
    else { 
      $rootScope.$emit('showLogin');
      LOGIN.watchers['addBranch'] = function (login) { 
        if (login.status === 'participant') { 
          $scope.$apply( function () { 
            $scope.reply(post);
          });
          delete login.watchers['addBranch'];
        }
      }
    }
  };

  $scope.replying = function (post, type) { 
    post.replying = true;
  }

  // Receiving a new post
  IO.on('newBranch', function (data) { 
    console.log('newBranch');
    console.log(data);
    $scope.$apply(function () { 
      b = branch(data.convo);
    });
  });

  // Reanchor command
  IO.on('reanchorThese', function (data) { 
      console.log(data);
  });


  // TODO: I've moved the transfer of convo data to the preprocessor.
  // When you connect, you may be 'behind' on some convos. Instead of 
  // broadcasting willy nilly, I'll need for the client to request for an 
  // update to any new nodes since datetime X.
  IO.on('introducing', function (data) { 
//    $scope.$apply(function () { 
//      $scope.root = root(data.root);
//      data.branches.map( function (convo) { 
//        branch(convo);
//      });
//    });
//
  });


  // --------------------------------
  // Search Filter
  // --------------------------------
  $scope.search = {query: ""};

  $scope.$watch('search', 
      function (newVal, oldVal) { 
        $scope.posts.forEach( function (post) { 
          if ($scope.convoFilter(post))  
            post.filtered = false;
          else
            post.filtered = true;
        });
      },
      true
  );

  $scope.convoFilter = function (convo) { 
    // Generally you would expect the filter to be explicitly declared
    // inline. Unfortunately, if I do this,  convoFilter is called every 
    // time there's a digest cycle in angular. With large datasets, that's 
    // incredibly inefficient. Not to mention, a digest cycle is called on 
    // each mouseenter and mouseleave of a forumView post, increasing client
    // side overhead by a huge margin through normal use. I'm pissed.
    //
    // Anyways, I've implemented a $watch on 'search' so that it only runs
    // a check on the entire post dataset when you update the search query.
    included = false;

    query = $scope.search.query.toLowerCase();
    
    // For efficiency
    if (query.length === 0) { return true };

    if (convo.contents.toLowerCase().indexOf(query) > -1 ||
        convo.author.toLowerCase().indexOf(query) > -1 ||
        convo.time === query) {
      included = true;
    }

    return included;
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // User Interface
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Clicking on a node selects it and allows you to reply
  $scope.select = function (post, type) { 
    if ($scope.selectedModel !== false && $scope.selectedModel !== post) {
      $scope.selectedModel.selected = false;
      $scope.selectedModel.replying = false;
    }

    if (post === false) {
      $scope.selectedModel = false;
    }
    else if ($scope.selectedModel !== post.token) {
      $scope.selectedModel = post;
      post.selected = true;
    }
  }

  $scope.openReply = function (post, type) { 
    post.replying = true;
  }

  $rootScope.$on('key', function (event, key) { 
    if (typeof document.activeElement.readOnly === 'undefined') { 

      cur = $scope.selectedModel;
      if (cur) { 
        if (key === 'left' || key === 'right' || key === 'up') { 
          if (cur.parent) {
            if (key === 'up') { 
              $scope.select(cur.parent, $scope.view);
            }

            else { 
              siblings = cur.parent.children;
              index = siblings.indexOf(cur);
              
              if (key === 'left') {
                target = index - 1;
                if (target === -1) target += siblings.length;
              }
              if (key === 'right') { 
                target = index + 1;
                if (target >= siblings.length) target = 0;
              }


              $scope.select(siblings[target], $scope.view);
            }
          }
        }
        if (key === 'down') {
          if (cur.children.length >= 1) 
            $scope.select(cur.children[0]);
        }
      }
    }
  });

}]);


/*                      */
/*      Directives      */
/*                      */
// Autosubmit on Enter Key
APP.directive('ngEnter', function () {
  return function (scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
      if(event.which === 13) {
        scope.$apply(function (){
          scope.$eval(attrs.ngEnter);
        });

        event.preventDefault();
      }
    });
  };
});

APP.directive('ngFocus', function ($timeout) { 
  return { 
    link: function (scope, element, attrs) { 
      scope.$watch(attrs.ngFocus, function (value) { 
        if (value === true) { 
          $timeout(function () { 
            element[0].focus();
          }, 100);
//          scope[attrs.focusMe] = false;
        }
      });
    }
  }
});

APP.directive('ngSlide', function ($animate, $timeout) { 
  return {
    link: function (scope, element, attrs) { 
      scope.$watch(attrs.ngSlide, function (ngSlide) { 
        if (ngSlide) 
          $animate.removeClass(element, 'slide');
        else 
          $animate.addClass(element, 'slide');
      });
    }
  } 
});

