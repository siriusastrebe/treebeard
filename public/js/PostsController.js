/*                    */
/*      Socket.io     */
/*                    */
var Convos = new Convoset();
var debug;


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

/*                       */
/*       Controller      */
/*                       */

window.$scope;

APP.controller('PostsController', ['$scope', '$rootScope', '$timeout', '$location', function ($scope, $rootScope, $timeout, $location) {
  // --------------------------------
  // Defaults
  // --------------------------------
  var PostsController = $scope;

  $scope.view = 'flow';

  $scope.root = [];
  Syc.connect(IO, function () {
    USERNAMES = Syc.list('usernames');
    TREE = Syc.list('Tree');
    $scope.root = Syc.list('Tree')['got']
  });

  // --------------------------------
  // Testing/Debugging
  // --------------------------------
  /*
  $scope.debugConvo;
  $scope.debugView = false;

  $scope.$watch( 
    function () { return DEBUG }, 
    function (dev, o) { $scope.development = dev }
  );
  

  Convos.debug = function () { 
    $scope.$apply( function () { 
      $scope.roots = $scope.roots[0].children[0];
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
  */
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
    else $scope.view = 'flow';
  });

  // --------------------------------
  // Node manipulation
  // --------------------------------
  // Replying to a node
  $scope.action = { 
      replying: undefined,
      selection: undefined,
      message: ''
  }

  $scope.reply = function (parent) {
    var item = {
        contents: $scope.action.message,
        author: LOGIN.username,
        children: []
    }

    if (!parent.children) parent.children = [];
    parent.children.push(item);

    $scope.action.replying = undefined;
    $scope.action.selection = undefined;
    $scope.action.message = ''
  }

  $scope.openReply = function (item) { 
    $scope.action.replying = item;
  }

  $scope.select = function (item) { 
    $scope.action.selection = item;
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

  // --------------------------------
  // Search Filter
  // --------------------------------
  /*
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
  */
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

