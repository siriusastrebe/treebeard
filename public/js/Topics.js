// This library couples closely with the Convoset library.
//


var Topics = function () { 
  var topics = [];
  var topicsByKey = {};

  this.addTopic = function (convoset) { 
    // Add to associative array
    if (topicsByKey[convoset.toSlug()] == undefined) { 
      topicsByKey[convoset.toSlug()] = convoset;
    } else { 
      return false
    }

    // Add to array
    topics.push(convoset);
  }

  this.removeTopic = function (key) { 
    delete topicsByKey[key];

    for (var i=0; i<topics.length; i++) { 
      if (topics[i].toSlug() === key) 
        topics.splice(i--, 1);
    }
  }

  this.getTopic = function (key) { 
    return topicsByKey[key];
  }

  this.getTopicList = function () { 
    return topics;
  }

  this.getRoots = function () {
    return topics.map(function (convoset) {
      return convoset.getRoots()[0];
    })
  }

  this.getRootsInJson = function () { 
    return JSON.stringify(topics.map(function (convoset) {
      return convoset.getRoots()[0].toJson();
    }));
  }

  return this;
}

if (typeof module !== 'undefined') {
  module.exports = Topics;
}
