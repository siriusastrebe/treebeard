// This library couples closely with the Convoset library.
//


var Topics = function () { 
  var topics = [];
  var topicsByKey = {};

  this.addTopic = function (convoset) { 
    if (topicsByKey[convoset.slug] == undefined) { 
      topicsByKey[convoset.slug] = convoset;
      topics.push(convoset);
      return true;
    } else { 
      return false
    }

  }

  this.removeTopic = function (key) { 
    delete topicsByKey[key];

    for (var i=0; i<topics.length; i++) { 
      if (topics[i].slug === key) 
        topics.splice(i--, 1);
    }
  }

  this.findTopic = function (key) { 
    if (key in topicsByKey) {
      return topicsByKey[key];
    } else { 
      return false;
    }
  }

  this.getTopicList = function () { 
    return topics;
  }

  this.getRoots = function () {
    return topics.map(function (convoset) {
      return convoset.root;
    })
  }

  this.getRootsInJson = function () { 
    return JSON.stringify(topics.map(function (convoset) {
      return convoset.root.toJson();
    }));
  }

  return this;
}

if (typeof module !== 'undefined') {
  module.exports = Topics;
}
