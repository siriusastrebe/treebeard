/*                    */
/*      Socket.io     */
/*                    */
var socket = io.connect();


/*                    */
/*   Convo Wrapper    */
/*                    */

/* Convo wrapper, since our Angular implementation
 * uses methods that the tree/node model does not utilize */

function root (json) { 
  convo = JSONToRoot(json);
  return convo;
}

function branch (json) { 
  convo = JSONToBranch(json);
  if (convo) return convo;
  else  {
    console.log("There's been an error linking a user comment to a parent.");
  }
}

function fromScratch (parent, text, author) { 
  child = parent.addChild(text, author, new Date());
  return child;
}



/*                       */
/*     Ng-Application    */
/*                       */
app = angular.module('convo', []);

/*                       */
/*       Controller      */
/*                       */

var Panther = "testVariable. Delete before deploying."
app.controller('PostsController', ['$scope', '$timeout', '$location', function ($scope, $timeout, $location) {
  // --------------------------------
  // Defaults
  // --------------------------------
  $scope.view = 'forum'
  $scope.icon = true;

  // --------------------------------
  // Navigational menu
  // --------------------------------
  $scope.showNav = function () { 
    $scope.nav = true;
    $scope.icon = false;
  }

  var timeoutId;
  $scope.delayedNavHide = function () { 
    timeoutId = $timeout( function () {
      $scope.nav = false;
      $timeout( function () { 
        $scope.icon = true;
      }, 400);
    }, 2000);
  }

  $scope.resetDelayHide = function () { 
    $timeout.cancel(timeoutId);
  }
  

  // --------------------------------
  // View control
  // --------------------------------
  $scope.$on("$locationChangeStart", function (event, next, current) { 
    if ($location.hash() === 'tree') { 
      $scope.view = 'tree';
    }
    else if ($location.hash() === 'flow') { 
      $scope.view = 'flow';
    }
    else {
      $scope.view = 'forum';
    }
  });

  // --------------------------------
  // Node manipulation
  // --------------------------------
  // Replying to a node
  $scope.reply = function(convo) {
    child = fromScratch(convo, convo.response, "molerat");
    convo.response = "";
    $scope.select(false);
    socket.emit('convo', { convo: child.toJson() });
  };

  // Clicking on a node selects it and allows you to reply
  $scope.select = function (convo, type) { 
    if ($scope.selectedModel !== false)  
      $scope.selectedModel.selected = false;

    if (convo === false) {
      $scope.selectedModel = false;
    }
    else if ($scope.selectedModel !== convo.token) {
      $scope.selectedModel = convo;
      convo.selected = true;
      //TODO: A birdie told me you shouldn't access DOM in the controller
      $timeout(function () {
        $('#' + type + convo.token + ' textarea').focus();
      }, 100);
    }
  }

  // Receiving a new post
  socket.on('convo', function (data) { 
    $scope.$apply(function () { 
      convo = branch(data.convo);
    });
  });

  // Once connected, this client should recieve a list of all current posts
  socket.on('introducing', function (data) { 
    $scope.$apply(function () { 
      console.log("Introductions: ");
      console.log(data);
      $scope.root = root(data.root);
      data.branches.map( function (convo) { 
        branch(convo);
      });
    });
  });

  $scope.posts = nodesChronological;
  $scope.selectedModel = false;
}]);


/*                      */
/*      Directives      */
/*                      */
// Autosubmit on Enter Key
app.directive('ngEnter', function () {
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

// Fade animation
app.directive('ngFade', function ($animate, $timeout) { 
  return function (scope, element, attrs) {
    scope.$watch(attrs.ngFade, function (ngFade) { 
      if (ngFade) {
        $animate.addClass(element, 'fade');
        $timeout(function () { 
          if (element.hasClass('fade') && !element.hasClass('hidden')) // Check if we're still fading
            $animate.addClass(element, 'hidden');
        }, 1000);
      } else { 
        $animate.removeClass(element, 'hidden');
        // Required due to a CSS bug of not fading in if immediately unhidden
        $timeout(function () { 
          if (!element.hasClass('hidden'))
            $animate.removeClass(element, 'fade');
        }, 200)
      }
    });
  }
});

// Slide Up & Down animation
app.directive('ngSlide', function ($animate) { 
  return function (scope, element, attrs) { 
    scope.$watch(attrs.ngSlide, function (ngSlide) { 
      if (ngSlide) {
        $animate.addClass(element, 'slide');
      } else { 
        $animate.removeClass(element, 'slide');
      }
    });
  }
});
