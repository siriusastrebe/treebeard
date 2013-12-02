/*                    */
/*      Socket.io     */
/*                    */
IO.on('connect', function () {
  // Get the names of each topic.
  // the TOPICS variable should be preset in the
  // html portion.
  
  IO.emit('introduceMe', {topics: TOPICS});
});


/*                    */
/*   Convo Wrapper    */
/*                    */

/* Convo wrapper, since our Angular implementation
 * uses methods that the tree/node model does not utilize */

var Convos = new Convoset();

function root (json) { 
  convo = Convos.JsonToRoot(json);
  return convo;
}

function branch (json) { 
  convo = Convos.JsonToBranch(json);
  if (convo) return convo;
  else  {
    console.log("There's been an error linking a user comment to a parent.");
  }
}

function branchFromScratch (parent, text, author) { 
  child = parent.addChild(text, author, new Date());
  return child;
}


/*                       */
/*       Controller      */
/*                       */

var Panther = "testVariable. Delete before deploying."
APP.controller('PostsController', ['$scope', '$timeout', '$location', function ($scope, $timeout, $location) {
  // --------------------------------
  // Defaults
  // --------------------------------
  $scope.view = 'tree';

  // --------------------------------
  // Tree/List View control
  // --------------------------------
  // TODO: this code violates DRY in /views/layout.ejs
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
  $scope.reply = function(post) {
    child = branchFromScratch(post, post.response, LOGIN.username);
    post.response = "";
    $scope.select(false);
    IO.emit('addBranch', { topic: TOPICS, convo: child.toJson() });
  };

  // Clicking on a node selects it and allows you to reply
  $scope.select = function (post, type) { 
    if ($scope.selectedModel !== false)  
      $scope.selectedModel.selected = false;

    if (post === false) {
      $scope.selectedModel = false;
    }
    else if ($scope.selectedModel !== post.token) {
      $scope.selectedModel = post;
      post.selected = true;
      //TODO: A birdie told me you shouldn't access DOM in the controller
      $timeout(function () {
        $('#' + type + post.token + ' textarea').focus();
      }, 100);
    }
  }

  // Receiving a new post
  IO.on('newBranch', function (data) { 
    console.log(data);
    $scope.$apply(function () { 
      branch(data.convo);
    });
  });

  // Once connected, this client should recieve a list of all current posts
  IO.on('introducing', function (data) { 
    $scope.$apply(function () { 
      console.log("Introductions: ");
      console.log(data);
      $scope.root = root(data.root);
      data.branches.map( function (convo) { 
        branch(convo);
      });
    });
  });

  $scope.posts = Convos.getNodes();
  $scope.selectedModel = false;
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

