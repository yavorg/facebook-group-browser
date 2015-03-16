function loadObjectId(name, objectType, callback) {
  FB.api('/search?type=' + objectType + '&q=' + encodeURIComponent(name),
    function(response){
      if(response && response.data && response.data.length > 0 && 
        response.data[0].id){
        callback(null, response.data[0].id);
      } else {
        callback(new Error("Could not find the ID for the given " + 
          objectType), null);
      }
    });
}

function filterOutPostsOlderThanDate(posts, cutoff){ 
  if(posts.length == 0){
    // We have recursed all the way, terminate
    return [];
  } 

  if (Date.parse(posts[posts.length-1].created_time) < cutoff){
    // The last post in the range is older than  the cutoff,
    // we split the range in two.

    var midpoint = Math.ceil(posts.length/2) - 1;
    if(Date.parse(posts[midpoint].created_time) < cutoff){
      // The middle of the range is still older than the cutoff,
      // so we know for sure if any dates are newer than the cutoff
      // they will be in the first half of the range
      return filterOutPostsOlderThanDate(posts.slice(0, midpoint), cutoff);
    } else {
      // The middle of the range is newer than the cutoff. That means
      // the first part of the range is definitely newer. We need to now
      // check the second part of the range.
      return posts.slice(0, midpoint + 1).concat(
        filterOutPostsOlderThanDate(
          posts.slice(midpoint + 1, posts.length), cutoff));
    }

  } else {
    // All posts in the range are after the cutoff
    return posts;
  }
}

function loadPosts(startDate, endDate, numPosts, objectId, objectType, 
  loadCompleted) {
    var endDateForFacebook = endDate / 1000;

    var query = objectId + "/feed?until=" + endDateForFacebook
    if (objectType === "group") {
        query += "&limit=500";
    } else {
        query += "&limit=250"; // Pages only allow 250 items at a time
    }

    var allPosts = [];
    FB.api(query, function parseResponse(response){
      console.log('Query: ' + query);
      if(response.data){
        var postsLoaded = 
          filterOutPostsOlderThanDate(response.data, startDate);
        var postsLoadedCount = postsLoaded.length;
        console.log('Received response items: ' + response.data.length);
        console.log('Out of them this many are before the start date ' + 
          postsLoadedCount);
        console.log('Total items cached so far: ' + allPosts.length);
      
        var remainingPostsToLoadCount = numPosts - allPosts.length;
        var actualPostsToLoadCount = 
          Math.min(remainingPostsToLoadCount, postsLoadedCount);
        console.log('Will cache this many from response: ' +
          actualPostsToLoadCount);

        var loadMore = true;
        if(actualPostsToLoadCount > 0){
          // We still need more posts, so add what we fetched
          allPosts = allPosts.concat(
            postsLoaded.slice(0, actualPostsToLoadCount));

          if(postsLoadedCount > remainingPostsToLoadCount){
            // We loaded more than we needed, so we are done now
            loadMore = false;
          }
        } else {
          // We already loaded what we needed
          loadMore = false;
        }

        if(loadMore && response.paging && response.paging.next) {
          console.log('Will load the next page.');
          query = response.paging.next;
          FB.api(query, parseResponse);
        } else{
          console.log('Will not load more, returning all ' 
            + allPosts.length + ' cached items');
          loadCompleted(null, allPosts);
        }
      } else {
        loadCompleted(new Error("No results returned"), null);
      }
    });
}