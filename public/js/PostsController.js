/*                    */
/*      Socket.io     */
/*                    */
var Convos = new Convoset();

IO.on('connect', function () {
  // Get the names of each topic.
  // the TOPICS variable should be preset in the
  // html portion.
  
  IO.emit('introduceMe', {topics: TOPICS});
});



/*                       */
/*       Controller      */
/*                       */

var Panther = "testVariable. Delete before deploying."
APP.controller('PostsController', ['$scope', '$rootScope', '$timeout', '$location', function ($scope, $rootScope, $timeout, $location) {
  // --------------------------------
  // Defaults
  // --------------------------------
  $scope.view = 'tree';
  $scope.posts = Convos.getNodes();
  $scope.selectedModel = false;

  $scope.root = Convos.JsonToRoot(ConvoJson.root);
  ConvoJson.branches.map( function (convo) { 
    console.log(convo);
    Convos.JsonToBranch(convo);
  });

  // --------------------------------
  // Tree/List View control
  // --------------------------------
  // Triggered on pageload in addition to any url changes.
  $scope.$on("$locationChangeStart", function (event, next, current) { 
    if ($location.hash() === 'forum') { 
      $scope.view = 'forum';
    }
    else if ($location.hash() === 'flow') { 
      $scope.view = 'flow';
    }
    else {
      $scope.view = 'tree';
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
      Convos.JsonToBranch(data.convo);
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
  });


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
      //TODO: A birdie told me you shouldn't access DOM in the controller
      $timeout(function () {
        $('#' + type + post.token + ' textarea').focus();
      }, 100);
    }
  }

  $scope.openReply = function (post, type) { 
    post.replying = true;
  }

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
