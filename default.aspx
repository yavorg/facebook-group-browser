<%@ Page Language="C#" AutoEventWireup="true" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Facebook Group Wall Browser</title>
    <script src="//ajax.aspnetcdn.com/ajax/jquery/jquery-1.7.1.min.js"></script>
</head>
<body>
<div id="fb-root"></div>
<script>
  // Additional JS functions here
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '<%$appSettings:appId %>', // App ID
      channelUrl : '//channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

  // Here we subscribe to the auth.authResponseChange JavaScript event. This event is fired
  // for any authentication related change, such as login, logout or session refresh. This means that
  // whenever someone who was previously logged out tries to log in again, the correct case below 
  // will be handled. 
  FB.Event.subscribe('auth.authResponseChange', function(response) {
    // Here we specify what we do with the response anytime this event occurs. 
    if (response.status === 'connected') {
      // The response object is returned with a status field that lets the app know the current
      // login status of the person. In this case, we're handling the situation where they 
      // have logged in to the app.
      testAPI();
    } else if (response.status === 'not_authorized') {
      // In this case, the person is logged into Facebook, but not into the app, so we call
      // FB.login() to prompt them to do so. 
      // In real-life usage, you wouldn't want to immediately prompt someone to login 
      // like this, for two reasons:
      // (1) JavaScript created popup windows are blocked by most browsers unless they 
      // result from direct interaction from people using the app (such as a mouse click)
      // (2) it is a bad experience to be continually prompted to login upon page load.
      FB.login();
    } else {
      // In this case, the person is not logged into Facebook, so we call the login() 
      // function to prompt them to do so. Note that at this stage there is no indication
      // of whether they are logged into the app. If they aren't then they'll see the Login
      // dialog right after they log in to Facebook. 
      // The same caveats as above apply to the FB.login() call here.
      FB.login();
    }
  });
  };

  // Load the SDK asynchronously
  (function(d){
   var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement('script'); js.id = id; js.async = true;
   js.src = "/connect.facebook.net/en_US/all.js";
   ref.parentNode.insertBefore(js, ref);
  }(document));

  // Here we run a very simple test of the Graph API after login is successful. 
  // This testAPI() function is only called in those cases. 
  function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Good to see you, ' + response.name + '.');
    });
  }
</script>

<!--
  Below we include the Login Button social plugin. This button uses the JavaScript SDK to
  present a graphical Login button that triggers the FB.login() function when clicked.

  Learn more about options for the login button plugin:
  /docs/reference/plugins/login/ -->

<fb:login-button show-faces="true" width="200" max-rows="1"></fb:login-button>  
<label for="groupId">Facebook Group ID</label>
<input type="text" id="groupId" value="9973986703" />
<br />
<label for="startDate">Start date (UTC time)</label>
<input type="text" id="startDate" value="Jan 1, 2008" />
<br />
<label for="endDate">End date (UTC time)</label>
<input type="text" id="endDate" value="Mar 25, 2008" />
<br />
<label for="numPosts">Number of posts</label>
<input type="text" id="numPosts" value="1000" />
<br />
<input type="button" id="submit" value="Submit"/>
<p>Looking at <span id="resultCount">0</span> results</p>
<ul id="posts">
</ul>
<script type="text/javascript">
    $(function () {
        $("#submit").click(function () {
            var groupId = $("#groupId").val();
            var startDate = Date.parse($("#startDate").val()) / 1000;
            var endDate = Date.parse($("#endDate").val()) / 1000;
            var numPosts = $("#numPosts").val();

            var query = "https://graph.facebook.com/" +
            groupId +
            "/feed?access_token=1314ae9f121386eb331452334d56d9e7&callback=?" +
            "&since=" + startDate +
            "&until=" + endDate +
            "&limit=1000";


            var allPosts = [];
            $.getJSON(query, onLoadJSONP);
            function onLoadJSONP(data) {
                allPosts = allPosts.concat(data.data);
                if (data.paging && data.paging.next && allPosts.length <= numPosts) {
                    query = data.paging.next + "&callback=?";
                    $.getJSON(query, onLoadJSONP);
                } else {
                    $("#posts").empty();
                    $("#resultCount").html(allPosts.length);
                    $.each(allPosts, function (index, value) {
                        $("#posts").append("<li><strong>" + value.created_time + ":</strong> "
                        + value.message + "</li>");
                    });
                }
            }
        });
    });
</script>
</body>
</html>
