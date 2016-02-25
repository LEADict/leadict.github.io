function setSessions(val) {
  if (navigator.id) {
    navigator.id.sessions = val ? val : [ ];
  }
} 

// when the user is found to be logged in we'll update the UI, fetch and
// display the user's favorite beer from the server, and set up handlers to
// wait for user input (specifying their favorite beer).
function loggedIn(email, immediate) {
  setSessions([ { email: email } ]);

  $('#the-college-application-xhtml-form input,#the-college-application-xhtml-form textarea, #the-college-application-xhtml-form select').attr('readonly', true);
  //$('#the-college-application-xhtml-form').children('input, select, textarea').attr('readonly', true);
  
  //var formElems = document.getElementsByTagName('INPUT');
  var formElems = document.getElementById('HTMLForm').elements;
  for (var i = 0, e ; e = formElems[i]; i++)
  {  
     if ((e.type == 'checkbox') || (e.type == 'radio'))
     { 
        e.disabled = true;
     }
  }


  // set the user visible display
  var l = $("#the-college-application-xhtml-form .userSign").removeClass('clickable');;
  l.empty();
  l.css('opacity', '1');
  l.append($("<span>").text(email).addClass("username"));
  // l.append($('<div><a id="logout" href="#" >(logout)</a></div>'));
  
  $("#logout").bind('click', logout);

  if (immediate) {
    $("#content .intro").hide();
    $("#content .business").fadeIn(300);
  }
  else {
    $("#content .intro").fadeOut(700, function() {
      $("#content .business").fadeIn(300);
    });
  }

  // enter causes us to save the value and do a little animation
  $('input').keypress(function(e){
    if(e.which == 13) {
      save(e);
    }
  });

  $("#save").click(save);

  $.ajax({
    type: 'GET',
    url: '/api/get',
    success: function(res, status, xhr) {
      $("input").val(res);
    }
  });

  // get a gravatar cause it's pretty
  var iurl = 'http://www.gravatar.com/avatar/' +
    Crypto.MD5($.trim(email).toLowerCase()) +
    "?s=32";
  $("<img>").attr('src', iurl).appendTo($("#the-college-application-xhtml-form .userPicture"));
}

function save(event) {
  event.preventDefault();
  $.ajax({
    type: 'POST',
    url: '/api/set',
    data: { beer: $("input").val() },
    success: function(res, status, xhr) {
      // noop
    }
  });
  $("#content input").fadeOut(200).fadeIn(400);
}

// when the user clicks logout, we'll make a call to the server to clear
// our current session.
function logout(event) {
  event.preventDefault();
  $.ajax({
    type: 'POST',
    url: '/api/logout',
    success: function() {
      // and then redraw the UI.
      loggedOut();
    }
  });
}

// when no user is logged in, we'll display a "sign-in" button
// which will call into browserid when clicked.
function loggedOut() {
  setSessions();
  /*$("input").val("");
  $("#content .business").hide();
  $('.intro').fadeIn(300);*/
  $("#the-college-application-xhtml-form .userPicture").empty();
  var l = $("#the-college-application-xhtml-form .userSign").removeClass('clickable');
  l.html('<img src="images/sign_red.png" alt="Sign">')
    .show().one('click', function() {
      $("#the-college-application-xhtml-form .userSign").css('opacity', '0.5');
      navigator.id.getVerifiedEmail(gotVerifiedEmail);
    }).addClass("clickable").css('opacity','1.0');
}

// a handler that is passed an assertion after the user logs in via the
// browserid dialog
function gotVerifiedEmail(assertion) {
  // got an assertion, now send it up to the server for verification
  if (assertion !== null) {
    $.ajax({
      type: 'POST',
      url: '/api/login',
      data: { assertion: assertion },
      success: function(res, status, xhr) {
        //var resObj = jQuery.parseJSON(res);
        if ((res !== null) && (status == 'success')) loggedIn(res.email);
        else loggedOut();
      },
      error: function(res, status, xhr) {
        alert("login failure" + res);
      }
    });
  }
  else {
    loggedOut();
  }
}

// For some reason, login/logout do not respond when bound using jQuery
if (document.addEventListener) {
  document.addEventListener("login", function(event) {
    $("#the-college-application-xhtml-form .userSign").css('opacity', '0.5');
    navigator.id.getVerifiedEmail(gotVerifiedEmail);
  }, false);

  document.addEventListener("logout", logout, false);
}

// at startup let's check to see whether we're authenticated to
// leadict.com (have existing cookie), and update the UI accordingly
$(function() {
  /*$.get('/api/whoami', function (res) {
    if (res === null) loggedOut();
    else loggedIn(res, true);
  }, 'json');*/
  loggedOut();
});
