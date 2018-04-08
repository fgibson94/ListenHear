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

let colors = ['#1be3c9', '#6abd75', '#b986e0', '#32f57d', '#eccd52', '#f198b2'];

let session = {
  zip: '',
  radius: '',
  EVENT_ARR: [],
}

//HELPER FUNCTIONS

function zipError(errorMessage) {
  $('#zip').val(errorMessage).css('color', 'red');
  setTimeout(function () {
    $('#zip').val("enter zip").css('color', 'black');
  }, 2000);
};

function radiusError(errorMessage) {
  $('#radius').val(errorMessage).css('color', 'red');
  setTimeout(function () {
    $('#radius').val("enter zip").css('color', 'black');
  }, 2000);
};

function validateInput() {
  let zip = $("#zip").val().trim();
  let radius = $("#radius").val().trim();
  console.log(zip);
  console.log(radius);
  //handle zip
  if (zip.length != 5) {
    zipError("enter 5 digit zip");
    console.log("zip length err");
    return false;
  }
  for (let i = 0; i < zip.length; i++) {
    if ( isNaN(zip.charAt(i)) ) {
      zipError("invalid zip");
      console.log("zip err");
      return false;
    }
  }
  //handle radius
  if (radius == ""){
    radiusError("enter a number");
    return false;
  }
  for (let j = 0; j < radius.length; j++) {
    console.log(radius.charAt(j))
    if ( isNaN(radius.charAt(j)) ) {
      radiusError("enter a number");
      console.log("radius err");
      return false;
    }
  }
  //set session vars & return true if conditions met
  session.zip = zip;
  session.radius = radius;
  return true;
}

// API functions


function callSpotify() {
  let accessToken = "BQCMKLl-k2QkfWXwSEfB4ffhPF0SX49RlGbuswV5efZTLwZDFQM1CerqmlM7BXTygZNbckAVn4f0AcirgDm6neirqpTPRWHRonJ5fDkvqKn3pEjQZy1aUH1Psng8xi9ne9ZAyIXn8Wr2FPveoW_24YTYf66n4oy4fRLt3wYSQVbGo8VwCA"
  //optionally: use forEach?
  for (let i = 0; i < session.EVENT_ARR.length; i++) {
    $.ajax({
      url: "https://api.spotify.com/v1/search?q=" + session.EVENT_ARR[i].artist + "&type=artist",
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      success: function (response) {
        console.log("spotify response ",response);
        let genres = response.artists.items["0"].genres;
        genres.forEach(genre =>{
          session.EVENT_ARR[i].genres.push(genre);  
        });
        let spotifyId = response.artists.items["0"].id;
        console.log(spotifyId)
        session.EVENT_ARR[i].spotifyId = spotifyId
      }
    });
  };
  setTimeout( function() {
  for (let i = 0; i < session.EVENT_ARR.length; i++) {
    console.log("session event id ", session.EVENT_ARR[i].spotifyId)
    if (typeof session.EVENT_ARR[i].spotifyId !== "undefined") {
    $.ajax({
      url: "https://api.spotify.com/v1/artists/" + session.EVENT_ARR[i].spotifyId + "/top-tracks?country=US",
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      success: function (response) {
        console.log("spotify two response ",response);
        let spotifyTrackId = response.tracks[0].id;
        console.log("trackID ",spotifyTrackId)
        session.EVENT_ARR[i].spotifyTrackId = spotifyTrackId
      }
    });
    }
    else {
      console.log("get outta here")
    }
  };
  }, 3000)
}

function callSeatGeek() {
  event.preventDefault();
  const ZIP = session.zip;
  const DIST = session.radius;
  const DATE = moment().format("YYYY-MM-DD");
  console.log(DATE, " ", ZIP, " ", DIST);
  var queryURL = "https://api.seatgeek.com/2/events?type=concert&per_page=1000&postal_code=" + ZIP + "&range=" + DIST + "mi&client_id=MTExMzAwNzR8MTUyMjk4NDcwNS4xNg"
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function (response) {
    console.log("seat geek response ",response)
    //clear session on new search
    session.EVENT_ARR = [];
    //optionally: use forEach?
    for (var i = 0; i < response.events.length; i++) {
      let timeChecker = response.events[i].datetime_local
      let timeCheckerTwo = moment(timeChecker).format("YYYY-MM-DD")
      if (timeCheckerTwo == DATE) {
        //build event array of artists/venues
        let artistName = response.events[i].performers[0].name
        let venueName = response.events[i].venue.name
        let event = {};
        event.artist = artistName;
        event.venue = venueName;
        event.genres = [];
        event.spotifyId = ""
        event.spotifyTrackId =""
        session.EVENT_ARR.push(event);
        /* $("#artistsDiv").append(
          `
          <div class="tile col resultCard">
              <p class="tileTitle">${response.events[i].performers[0].name} | <i>${response.events[i].venue.name}</i></p>
            </div>
          </div>
        </div>
        `
        )} */
      }
    }
  callSpotify();
  })
}


//WORKFLOW

function load() {
  bounceIn("#landing-page");
  //get location/prompt for location?
}

$("#launch-button").on("click", function () {
  let proceed = validateInput();
  if (proceed) {
    callSeatGeek();
    //bounceOut("#landing-page")
    //bounceIn('#sort-page');
  }
})

function sortGenre() {
  $('.grid').isotope({
    filter: '.country'
  });
};

$('#sort-page').on('click', '#genre-filter', function () {
  sortGenre();
});

function loadEvents() {
  $("#event-container").html("");
  session.EVENT_ARR.forEach(event => {
    let randomNum = Math.round(Math.random() * colors.length);
    let color = colors[randomNum];
    console.log(event.spotifyId)
    let index = session.EVENT_ARR.indexOf(event);
    var html =
    `
      <div id="datum-name-${index}">${event.artist}</div>
      <div id="datum-venue-${index}">${event.venue}</div>
      <iframe src="https://open.spotify.com/embed/track/${event.spotifyTrackId}"
              width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
    `;
    let eventTile = $("<div>")
      .attr('id', 'event-wrapper' + index)
      .addClass('event-wrapper grid-item')
      .addClass(event.genres)
      .css('background-color', color)
      .html(html);

    $("#event-container").append(eventTile);
  });
};

$("#get-data").on('click', function () {
  loadEvents();
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