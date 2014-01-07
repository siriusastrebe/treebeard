/*                    */
/*      Socket.io     */
/*                    */
var Convos = new Convoset();
var debug;

IO.on('connect', function () {
  // Get the names of each topic.
  // the TOPICS variable should be preset in the
  // html portion.
  
  IO.emit('introduceMe', {topics: TOPICS});
});


/*                       */
/*    Custom Methods     */
/*                       */
function root (json) {
  node = Convos.JsonToRoot(json);
  node.activeChildren = []; 
  node.__proto__.expand = expand;
  return node;
}

function branch (json) {
  node = Convos.JsonToBranch(json);
  node.activeChildren = [];
  node.__proto__.expand = expand;
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
*/

function expand () { 
  console.log(this);
  for (var i=0; i<this.children.length; i++) {
    if (this.activeChildren.indexOf(this.children[i]) === -1) {
      this.activeChildren.push(this.children[i]);
      break;
    }
  }
}




/*                       */
/*       Controller      */
/*                       */

APP.controller('PostsController', ['$scope', '$rootScope', '$timeout', '$location', function ($scope, $rootScope, $timeout, $location) {
  // --------------------------------
  // Defaults
  // --------------------------------
  $scope.view = 'flow';
  $scope.posts = Convos.getNodes();
  $scope.selectedModel = false;

  $scope.root = root(TREEJSON.root);

  TREEJSON.branches.map( function (convo) { 
    branch(convo);
  });

  $scope.anchorRoots = flow();
  debug = $scope.anchorRoots;

  // --------------------------------
  // Testing/Debugging
  // --------------------------------
  Convos.debug = function () { 
    $scope.$apply( function () { 
      $scope.root = $scope.root.children[0];
      console.log($scope.root);
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
    else {
      $scope.view = 'flow';
    }
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
      b.parent.expand();
    });
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
  $scope.query = "";

  $scope.convoFilter = function (convo) { 
    included = false;

    query = $scope.query.toLowerCase();

    if (convo.contents.toLowerCase().indexOf(query) > -1 ||
        convo.author.toLowerCase().indexOf(query) > -1 ||
        convo.time === query) {
      console.log(convo);
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

      if ($scope.view === 'flow')
        $scope.selectedModel.expand();
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
})
