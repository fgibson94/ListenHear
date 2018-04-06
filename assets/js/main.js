var session = {
  zip: ,
  radius: ,
  seatgeekResponse: [],
  spotifyResponse:[],
  playlistURL: ,
}


//DISPLAY

//transition in section
function bounceIn(section) {
  setTimeout(function () {
    $(section).addClass("animated bounceInDown")
      .css("display", "block")
  }, 600);
},

//transition out section
function bounceOut(section) {
  $(section).removeClass("bounceInDown")
    .addClass("animated bounceOutUp");
  setTimeout(function () {
    $(section).removeClass("bounceOutUp")
    $(section).css("display", "none");
  }
}

$(document).ready(function(){
  // bounceIn("#landing-page");
})
