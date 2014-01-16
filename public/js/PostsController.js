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

  $scope.anchorRoots = flow();

  // --------------------------------
  // Testing/Debugging
  // --------------------------------
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
    $scope.debugView = true;
    convo.debug = true;
  }

  $scope.closeDebug = function (convo) { 
    $scope.debugView = false;
    convo.debug = false;
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
  debug = $scope;

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

