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

APP.controller('PostsController', ['$scope', '$rootScope', '$location', '$timeout', function ($scope, $rootScope, $location, $timeout) {
  // --------------------------------
  // Defaults
  // --------------------------------
  var PostsController = $scope;

  $scope.view = 'flow';
  $scope.posts = [];

  $scope.pathname = window.location.pathname;
  $scope.subject = $scope.pathname.split('/')[1];

  $scope.root = [{author: 'Hold your horses', contents: 'Waiting on data...'}];

  Syc.loaded(function (root) { 
    $scope.root = Syc.list($scope.subject)

    $scope.posts = determinePosts(Syc.ancestors($scope.root));

    $scope.$digest();

    Syc.watch($scope.root, function (change) { 
      if (change.type === 'delete') { 
        $scope.$digest();
      } else if (typeof change.change === 'object') {
        var ancestors = Syc.ancestors(change.change),
            newPosts = determinePosts(ancestors);

        $scope.posts.push.apply($scope.posts, newPosts);
        $scope.$digest();
      }
    }, {recursive: true});

    function determinePosts (objects) { 
      return objects.filter( function (object) { return (Syc.Type(object) === 'object'); });
    }
  });

  // --------------------------------
  // Node manipulation
  // --------------------------------
  // Replying to a node
  $scope.action = { 
      replying: undefined,
      selection: undefined,
      message: '',
  }

  $scope.reply = function (parent) {
    if ($scope.action.message.length === 0) return;

    var item = {
        contents: $scope.action.message,
        author: LOGIN.username,
        children: []
    }

    if (!parent.children) parent.children = [];
    parent.children.push(item);

    $scope.action.replying = undefined;
    $scope.action.selection = undefined;
    $scope.action.message = '';
  }

  $scope.openReply = function (item) { 
    $scope.action.replying = item;
  }

  $scope.select = function (item) { 
    $scope.action.selection = item;
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
    else $scope.view = 'flow';
  });

  // --------------------------------
  // Search Filter
  // --------------------------------
  $scope.search = {query: ""};
  $scope.filter = function () {  
    var query = $scope.search.query;

  }

  $scope.postFilter = function (post) { 
    var query = $scope.search.query.toLowerCase();

    if (query.length === 0) { return true };

    if (post.contents.toLowerCase().indexOf(query) > -1 ||
        post.author.toLowerCase().indexOf(query) > -1 ||
        post.time === query) {
      return true;
    }

    return false;
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
          $animate.addClass(element, 'slide');
        else 
          $animate.removeClass(element, 'slide');
      });
    }
  } 
});

APP.directive('ngGlide', function ($animate, $timeout) { 
  return {
    link: function (scope, element, attrs) { 
      scope.$watch(attrs.ngSlide, function (ngSlide) { 
        if (ngSlide) 
          $animate.removeClass(element, 'flowSlide');
        else 
          $animate.addClass(element, 'flowSlide');
      });
    }
  } 
});
