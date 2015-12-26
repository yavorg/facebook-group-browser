$(function () {
  if(env === 'development'){
    TraceKit.report.subscribe(function logger(errorReport) {
      console.log(errorReport);
    });
  } else {
    TraceKit.remoteFetching = false;
    TraceKit.report.subscribe(function logger(errorReport) { 
      ga('send', 'event', 'clientError', errorReport);
    });
  }

  $("#submit").click(function () {
    
    loadObjectId($("#objectName").val(), 
      $("#objectType").val(), 
      objectIdLoaded);

    ga('send', 'event', 'comments-search', 'start');
  });
});

function objectIdLoaded(loadObjectIdError, objectId) {    
  setCursorToProgress();
  toggleResultsVisibilityOff();

  if(!loadObjectIdError){
    loadPosts(Date.parse($("#startDate").val()), 
      Date.parse($("#endDate").val()), $("#numPosts").val(), objectId, 
      $("#objectType").val(), loadCompleted);
  } else {
    setCursorToDefault();
    alert(loadObjectIdError.message);
    reportError(loadObjectIdError);
  }
}


function loadCompleted(loadPostsError, posts){
  setCursorToDefault();
  toggleResultsVisibilityOn();

  if(!loadPostsError){
    $("#posts").empty();
    $("#resultCount").html(posts.length);

    if(posts.length){
      ga('send', 'event', 'comments-search', 'completed-with-results');
    }

    $.each(posts, function (index, value) {
      var row = "<tr><td class='metadata'><strong>Id: </strong>" + value.id + "<br/>" +
      "<strong>Created Time: </strong>" + value.created_time + "</td>" +
      "<td>" + value.type + "</td>" + 
      "<td>" + value.from.id + "</td>" +
      "<td class='description'>";

      if(value.message){
        row += "<strong>Message: </strong>" + value.message + "<br/>";
      }
      if(value.link){
        row += '<strong>Link: </strong><a target="_blank" href="' + value.link + '">' + value.link + "</a><br/>";
      }
      if(value.story){
        row += "<strong>Story: </strong>" + value.story + "<br/>";
      }
      if(value.caption){
        row += "<strong>Caption: </strong>" + value.caption + "<br/>";
      }
      if(value.description){
        row += "<strong>Description: </strong>" +  value.description + "<br/>";
      }
      if(value.name){
        row += "<strong>Name: </strong>" + value.name + "<br/>";
      }
      if(value.picture){
        row += '<strong>Picture: </strong><a target="_blank" href="' + value.picture + '">' + value.picture + "</a><br/>";
      }
      row +="</td></tr>";

      $("#posts").append(row);

    });
  } else {
    alert(loadPostsError.message);
    reportError(loadPostsError);
  }
}

function reportError(error){
  TraceKit.report(error);
}

function enableControls(){
  ga('send', 'event', 'facebook-login', 'success');
  $("#controls input, select").removeAttr("disabled");
  $("#intro").css("display", "none");
  $("#searchForm").css("display", "block");
}

function loginNeeded(){
  $("#intro").css("display", "block");
}

function setCursorToProgress(){
  // Make cursor wait
  $("body").css("cursor", "progress");
}

function toggleResultsVisibilityOn(){
  $("#results").css("display", "block");
}

function toggleResultsVisibilityOff(){
  $("#results").css("display", "none");
}

function setCursorToDefault(){
  // Change cursor back
  $("body").css("cursor", "default"); 
}
