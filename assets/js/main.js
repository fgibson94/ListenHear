var fakeData = [
  Cowboy Dude = {
    genre: "country",
    venue: "303 Country Venue Ln."
  },
  Ranch Gal = {
    genre: "country",
    venue: "303 Country Venue Ln."
  },
  Deathmetal Dave = {
    genre: "metal",
    venue: "14 Warehouse Rd."
  },
  Dustin Beaver = {
    genre: "pop",
    venue: "100 Main St."
  },  
]

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
