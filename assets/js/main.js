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
  },
  {
    name: "DJ Bingo",
    genre: "trance",
    venue: "14 Warehouse Rd."
  },
  {
    name: "Frankie Lovejoy",
    genre: "rock",
    venue: "100 Main St."
  }
];

let colors = ['#1be3c9','#6abd75','#b986e0','#32f57d','#eccd52','#f198b2'];

let session = {
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

function validateZip(zip) {
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

function loadFakeData() {
  fakeData.forEach(datum => {
    let randomNum = Math.round(Math.random() * colors.length);
    let color = colors[randomNum];
    console.log(color);
    let index = fakeData.indexOf(datum);
    var html =
      `
    <div id="datum-wrapper-${index}" class="container ${datum.genre}">
      <div id="datum-name-${index}">${datum.name}</div>
      <div id="datum-venue-${index}">${datum.venue}</div>
    </div>
    `;
    let event = $("<div>")
    .attr('id','event-wrapper'+index)
    .addClass('event-wrapper')
    .css('background-color',color)
    .html(html);

    $("#event-container").append(event);
  });
};

$("#get-data").on('click', function () {
  loadFakeData();
});

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
