var fakeData = [
  {
    name: "Cowboy Dude",
    genre: "country",
    venue: "303 Country Venue Ln."
  },
  {
    name: "Ranch Gal",
    genre: "country",
    venue: "303 Country Venue Ln."
  },
  {
    name: "Deathmetal Dave",
    genre: "metal",
    venue: "14 Warehouse Rd."
  },
  {
    name: "Dustin Beaver",
    genre: "pop",
    venue: "100 Main St."
  }
];

var session = {
  zip: '',
  radius: '',
  seatgeekResponse: [],
  spotifyResponse: [],
  playlistURL: '',
}

//HELPER FUNCTIONS

function zipError(errorMessage) {
  $('#zip').val(errorMessage).css('color', 'red');
  setTimeout(function () {
    $('#zip').val("enter zip").css('color', 'black');
  }, 1000);
};

function validateZip(zip){
  if (zip.length != 5) {
    zipError("invalid zip length");
    return;
  }
  for (let i = 0; i < zip.length; i++) {
    if (typeof zip.charAt(i) != 'number') {
      zipError("invalid zip");
      return;
    }
  }
  return true;
}

function callseatGeek() {
  //whatever we do, eventually set response to session.seatgeekResponse
}

//WORKFLOW

function load() {
  bounceIn("#landing-page");
  //get location/prompt for location?

}

$("#launch-button").on("click", function () {
  let proceed = validateInput();
  if (proceed) {
    //set session.zip
    //set session.radius
    //callseatGeek();
    bounceOut("#landing-page")
    bounceIn('#sort-page');
  }
})

//DISPLAY

//transition in section
function bounceIn(section) {
  setTimeout(function () {
    $(section).addClass("bounceInDown")
      .css("display", "block")
  }, 600);
}

//transition out section
function bounceOut(section) {
  $(section).removeClass("bounceInDown")
    .addClass("bounceOutUp");
  setTimeout(function () {
    $(section).removeClass("bounceOutUp")
    $(section).css("display", "none");
  });
}

$(document).ready(function () {
  //load();
})
