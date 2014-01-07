// Some thoughts I had 
      // This is what I'm thinking.
      //
      // This retrieves every node that's somewhat related to Token.
      // These nodes are given priority and sorted based on this priority.
      // Suggested priority is passed to the client, so the client determines
      // the density of nodes they will see.
      //
      // Nodes with timestamps older than specified will not be returned, but
      // their popularity may be updated.
      //
      // This brings up an interesting point. It'd be rude to remove a convo
      // while users may be reading it. But adding convos is entirely acceptable.
      // Therefore, client side, when updating siblings' popularity, refusing
      // to remove already active nodes is a strategy.
      //
      // However, it may be pertinent to hide nodes if the user opens up a bunch
      // of siblings without clear intention of reading all of them. 
      //
      // So if I continuously add nodes to posts further left on the chain, then
      // I can reasonably expect some of those left nodes to be worthy of 
      // anchoring to. As a result, a 'split' algorithm is in the works.
      //
      // So how do we split? If there are two 'targets' in the same flow, then at
      // a certain point, there will be a large enough width of convos in the flow 
      // to cause a split.
      //
      // Two targets in the same flow can be problematic. Reason being is because 
      // the flow automatically screen centers around the current target. So, if
      // one target is lagging behind fairly hard and is no longer in screen
      // range, I suppose it makes sense to split that into a new topic as well.
      



function Weaver (convoset) { 
  var weaver = this;
  this.convoset = convoset; 

  this.weave = function (node, tapestry, previous) { 
    // Distance to applicable relatives
    // Direction of relation (cousins vs uncles vs granduncles)
    // Strength
    // 
    if (typeof tapestry === 'undefined' || tapestry === 'false')
      tapestry = {};

    // Weave Recursively
    if (node.parent) { 
      weaver.weave(node.parent, tapestry, node);
    }
    
    node.children.forEach( function (child) { 
      if (child !== previous) 
        childrenWeave.push(weaver.weave(child, tapestry, node));
    });

    // Process Weaves
    
  }


/*
  this.cache = new function () { 
    // each threa is either a JSON sorted
    var cache = this;
    this.tokens = {};

    this.addToken = function (token, thread) {
      cache.tokens[token] = thread;
    }

    this.updateToken = function (token, thread) {
      cache.tokens[token] = thread;
    }

    this.retrieve = function (token) { 
      // if this thread has a .command method, it is called
      // before being returned.
      thread = cache.tokens[token];
      if (typeof thread.command === 'function')
        thread = thread.command.call(thread, token);

      return thread;
    }
  }
*/
}

if (typeof module !=== 'undefined') {
  module.exports = Weaver;
}
