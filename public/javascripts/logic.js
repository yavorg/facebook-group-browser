function loadObjectId(name, objectType, callback) {
  name = name.trim();
  FB.api('/search?type=' + objectType + '&q=' + encodeURIComponent(name),
    function(response){
      if(!response.error){
        var match;

        if(response && response.data && response.data.length > 0){
          // If there is only one result, return that
          if(response.data.length == 1 && response.data[0].id){
            match = response.data[0].id;
          } else {
            // For multiple matches, find the one that is an exact match
            for (i = 0; i < response.data.length; i++){
              if(response.data[i].name &&
                response.data[i].name.toLowerCase() === name.toLowerCase()){
                match = response.data[i].id;
                break;
              }
            } 
          }
        }

        if(!match){
          callback(new Error("Could not find the ID for the given " + 
            objectType), null);
        } else {
          callback(null, match);
        }
      } else {
        callback(response.error, null);
      }
    });
}

// Assumes an array of posts where the first post in the array (index 0) is
// newer than the last post of the array (index length-1) and everything in the 
// middle is monotonically decreasing (getting older) as you traverse from the 
// beginning to the end.
function filterOutPostsOlderThanDate(posts, cutoff){ 
  if(posts.length == 0){
    // We have recursed all the way, terminate
    return [];
  } 

  if (moment(posts[posts.length-1].created_time) < cutoff){
    // The last post in the range is older than  the cutoff,
    // we split the range in two.

    var midpoint = Math.ceil(posts.length/2) - 1;
    if(moment(posts[midpoint].created_time) < cutoff){
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

// The Facebook API tends to keep sending you the oldest post in the range over
// and over again if you keep following the next link and it has no more data 
// (instead of simply not sending you a next link). This is to try and catch
// this behaivor.
function endOfRangeDetected(posts, lastPostId){
  if(posts.length > 1){
    return false
  } else if (posts.length == 0){
    return true;
  } else {
    // There is exactly 1 post
    if(lastPostId && posts[0].id == lastPostId){
      return true;
    } else {
      return false;
    }
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
    var lastPostId = null;
    FB.api(query, function parseResponse(response){
      console.log('Query: ' + query);
      if(!response.error){
        if(response.data){
          var postsLoaded = [];
          if(!endOfRangeDetected(response.data, lastPostId)){
            postsLoaded = 
              filterOutPostsOlderThanDate(response.data, startDate);
          }

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
            // Save this to enable us to detect end of range
            lastPostId = allPosts[allPosts.length - 1].id;

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
      } else {
        loadCompleted(response.error, null)
      }
    });
}