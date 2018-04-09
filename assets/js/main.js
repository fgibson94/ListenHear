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
    if (isNaN(zip.charAt(i))) {
      zipError("invalid zip");
      console.log("zip err");
      return false;
    }
  }
  //handle radius
  if (radius == "") {
    radiusError("enter a number");
    return false;
  }
  for (let j = 0; j < radius.length; j++) {
    console.log(radius.charAt(j))
    if (isNaN(radius.charAt(j))) {
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

function checkGenre(response, index) {

  let k = '';
  'genres' in response.artists.items["0"] ? k = "yup" : k = "nope";
  if (k == "nope") {
    return;
  } else {
    let genres = response.artists.items["0"].genres;
    if (genres.length > 0) {
      console.log("yup ", genres.length);
      genres.forEach(genre => {
        session.EVENT_ARR[index].genres.push(genre);
      });
    } else {
      let genre = "unknown";
      session.EVENT_ARR[index].genres.push(genre);
    }
  }
}

function purgeResponse(index) {
  session.EVENT_ARR.splice(index, 1);
}

function checkId(response, index) {
  let k = '';
  'id' in response.artists.items["0"] ? k = "yup" : k = "nope";
  if (k == 'nope') {
    purgeResponse(index, 1)
    //session.EVENT_ARR.splice(index, 1);
  } else {
    let spotifyId = response.artists.items["0"].id;
    session.EVENT_ARR[index].spotifyId = spotifyId;
  }

}


function callSpotify() {
  //joe's token
  //let accessToken = "BQCMKLl-k2QkfWXwSEfB4ffhPF0SX49RlGbuswV5efZTLwZDFQM1CerqmlM7BXTygZNbckAVn4f0AcirgDm6neirqpTPRWHRonJ5fDkvqKn3pEjQZy1aUH1Psng8xi9ne9ZAyIXn8Wr2FPveoW_24YTYf66n4oy4fRLt3wYSQVbGo8VwCA"
  //tommy's temp token
  let accessToken = "BQD6OATj5SIeCP8MQHuEI56EpuYa1LYQb-zteUF9K6qMkBxi1emesQTc6uDOKI-bH314EoiATTnShqQGUm61fXD8r-WVaXUlVKoBLvllPthpEoSAdC-RisHAXNY0ifvfj5kNvcRxwWRCXYY5KPAwGYdopFppy_Y"
  session.EVENT_ARR.forEach(event => {
    $.ajax({
      url: "https://api.spotify.com/v1/search?q=" + event.artist + "&type=artist",
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      success: function (response) {

        //console.log(response);

        let i = session.EVENT_ARR.indexOf(event);

        //if any of these are true, the response is junk
        if (!('artists' in response)) {
          purgeResponse(i);
          return;
        }
        if (!('items' in response.artists)) {
          purgeResponse(i);
          return;
        }
        if (response.artists.items.length < 1) {
          purgeResponse(i);
          return;
        }

        checkId(response, i);
        checkGenre(response, i);
      }
    })
  });

  setTimeout(function () {
    session.EVENT_ARR.forEach(event => {
      //console.log("session event id ", session.EVENT_ARR[i].spotifyId)
      $.ajax({
        url: "https://api.spotify.com/v1/artists/" + event.spotifyId + "/top-tracks?country=US",
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        success: function (response) {

          let i = session.EVENT_ARR.indexOf(event);

          console.log("from settimeout, response.tracks[0].id: ", response.tracks[0].id);

          if (!('tracks' in response)) {
            console.log("no tracks node");
            purgeResponse(i);
            return;
          }
          if (!('id' in response.tracks[0])) {
            console.log("no id node");
            purgeResponse(i);
            return;
          }
          if (response.tracks.id == "") {
            console.log("null id");
            purgeResponse(i);
            return;
          }

          let spotifyTrackId = response.tracks[0].id;
          session.EVENT_ARR[i].spotifyTrackId = spotifyTrackId;
        }
      });
    })
  }, 3000)
}

function callSeatGeek() {
  event.preventDefault();
  const ZIP = session.zip;
  const DIST = session.radius;
  const DATE = moment().format("YYYY-MM-DD");
  var queryURL = "https://api.seatgeek.com/2/events?type=concert&per_page=1000&postal_code=" + ZIP + "&range=" + DIST + "mi&client_id=MTExMzAwNzR8MTUyMjk4NDcwNS4xNg"
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function (response) {
    console.log("seat geek response ", response)
    //clear session on new search
    session.EVENT_ARR = [];
    //optionally: use forEach?
    for (var i = 0; i < response.events.length; i++) {
      let dttm = response.events[i].datetime_local
      dttm = moment(dttm).format("YYYY-MM-DD")
      if (dttm == DATE) {
        //build event array of artists/venues
        let artistName = response.events[i].performers[0].name
        let venueName = response.events[i].venue.name
        let event = {
          artist: artistName,
          venue: venueName,
          genres: [],
          spotifyId: "",
          spotifyTrackId: "",
        };
        console.log("event ", event);
        session.EVENT_ARR.push(event);
      }
    }
    console.log(session.EVENT_ARR, " EVENT_ARR after callSeatGeek");
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