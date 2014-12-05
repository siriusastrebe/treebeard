// This library couples closely with the Convoset library.
//


var Topics = function () { 
  var topics = [];
  var topicsByKey = {};

  this.addTopic = function (json) { 
    var slug = toSlug(json.contents);

    if (topicsByKey[slug] == undefined) { 
      topicsByKey[slug] = json;
      topics.push(json);
      return true;
    } else { 
      return false
    }

  }
  
  // TODO: Everything below this point

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
    return topics.map(function (json) {
      return JSON.stringify(json);
    });
  }

  this.getRootsInJson = function () { 
    return JSON.stringify(topics.map(function (json) {
      return json.root.toJson();
    }));
  }

  return this;
}

function toSlug (title) { 
  return title.toString() 
              .toLowerCase()
              .replace(/-+/g, '')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
}

if (typeof module !== 'undefined') {
  module.exports = Topics;
}
