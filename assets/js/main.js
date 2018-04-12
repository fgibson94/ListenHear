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
  //handle zip
  if (zip.length != 5) {
    zipError("enter 5 digit zip");
    return false;
  }
  for (let i = 0; i < zip.length; i++) {
    if (isNaN(zip.charAt(i))) {
      zipError("invalid zip");
      return false;
    }
  }
  //handle radius
  if (radius == "") {
    radiusError("enter a number");
    return false;
  }
  for (let j = 0; j < radius.length; j++) {
    if (isNaN(radius.charAt(j))) {
      radiusError("enter a number");
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
  let accessToken = "BQBdGvtygcqL93FvCii6F-pst2Fn_flvwTQw-gmxZKib706kVYViEDudjB5aM94rMvI77UGdzx8YYCTwUkLAYgcCyNjIy614qgzCFxvU_vAt8L6IhZJfUti6DanFZYUOC8ksHqP1fsCCm9BrFjPi15z-8D85Exo"
  session.EVENT_ARR.forEach(event => {
    $.ajax({
      url: "https://api.spotify.com/v1/search?q=" + event.artist + "&type=artist",
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      success: function (response) {

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
      console.log("spotify tracks being called")
      $.ajax({
        url: "https://api.spotify.com/v1/artists/" + event.spotifyId + "/top-tracks?country=US",
        headers: {
          'Authorization': 'Bearer ' + accessToken
        },
        success: function (response) {

          let i = session.EVENT_ARR.indexOf(event);

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
    loadEvents()
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

    //clear session on new search
    session.EVENT_ARR = [];
    //optionally: use forEach?
    for (var i = 0; i < response.events.length; i++) {
      let dttm = response.events[i].datetime_local
      dttm = moment(dttm).format("YYYY-MM-DD")
      if (dttm == DATE) {

        //build event array of artists/venues
        let event = {
          artist: response.events[i].performers[0].name,
          venue: response.events[i].venue.name,
          address: response.events[i].venue.address,
          city: response.events[i].venue.city,
          lat: response.events[i].venue.location.lat,
          lon: response.events[i].venue.location.lon,
          tickets: response.events[i].url,
          genres: [],
          spotifyId: "",
          spotifyTrackId: "",
        };
        session.EVENT_ARR.push(event);
      }
    }

    callSpotify();
  })
}


//WORKFLOW

//populate dropdown with buttons per genre
function getButtons() {

  //for genres and cities
  //map session.EVENT_ARR to a new array
  //filter by adding genres if index = first occurrence of value
  const genresDeduplicated = session.EVENT_ARR
    .map(value => value.genres[0])
    .filter((value, index, arr) => arr.indexOf(value) === index);
  const citiesDeduplicated = session.EVENT_ARR
    .map(value => value.city)
    .filter((value, index, arr) => arr.indexOf(value) === index);

  //add button   for each element in de-duplicated array
  genresDeduplicated.forEach(genre => {
    let html =
      `
      <a class="dropdown-item">${genre}</a>
      `
    $('#genres-in-dropdown').append(html);
    $('#genres-in-dropdown-sm').append(html);
  });

  //repeat for cities
  citiesDeduplicated.forEach(city => {
    let html =
      `
    <a class="dropdown-item">${city}</a>
    `
    $('#cities-in-dropdown').append(html);
    $('#cities-in-dropdown-sm').append(html);
  });
}

$("#launch-button").on("click", function () {
  let proceed = validateInput();
  if (proceed) {
    callSeatGeek();
    bounceOut("#landingPage")

    setTimeout(function () {
      bounceIn("#loadingPage")
    }, 500);

    setTimeout(function () {
      bounceOut("#loadingPage")
      bounceIn('#sort-page');
    }, 5000)
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

  setTimeout(function () {
    console.log("event load started")
    $("#event-container").html("");
    session.EVENT_ARR.forEach(event => {
      let randomNum = Math.round(Math.random() * colors.length);
      let color = colors[randomNum];
      let index = session.EVENT_ARR.indexOf(event);
      var html =
        `
      <div class="container">
        <div class="row tile">
            <div class="text-center" id="datum-name-${index}">${event.artist}</div>
        </div>
        <div class="row tile">
          <div class="text-center" id="datum-venue-${index}">@ ${event.venue}, ${event.city}</div>
        </div>
        <div class="row tile">
          <iframe class="mx-auto" src="https://play.spotify.com/embed/track/${event.spotifyTrackId}"
          width="250" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
        </div>
        <div class="row tile">
          <button class="btn btn-lg btn-block btn-dark restBtn mx-auto">Make My Plans!</button>
        </div>
      <div id="datum-address" style="display: none;">${event.address}</div>
      <div id="datum-ticket" style="display: none;">${event.tickets}</div>
      <div id="datum-lat" style="display: none;">${event.lat}</div>
      <div id="datum-lon" style="display: none;">${event.lon}</div>
    `;

      //replace spaces for class names
      let cityForClass = event.city;
      for (let i = 0; i < cityForClass.length; i++) {
        cityForClass = cityForClass.replace(" ", "-");
      }

      //note: if you hit an error here...
      ///might be because you don't have a spotify token
      ///this is the first place code needs a real reference
      ///to spotify data

      let genreForClass = event.genres[0];
      for (let i = 0; i < genreForClass.length; i++) {
        genreForClass = genreForClass.replace(" ", "-");
      }

      let eventTile = $("<div>")
        .attr('id', 'event-wrapper-' + index)
        .addClass('event-wrapper grid-item')
        .addClass(genreForClass)
        .addClass(cityForClass)
        .css('background-color', color)
        .html(html);

      $("#event-container").append(eventTile);
    });
    //after events loaded, loop through events for genres
    getButtons();
  }, 2000)
};

$(document).on("click", ".restBtn", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat").text()
  let plansLon = $("#datum-lon").text()
  let plansTicketLink = $("#datum-ticket").text()
  $("#ticketLink").text(plansTicketLink)
  console.log(plansAddress, " ", plansCity, " ", plansLat, " ", plansLon, " ", plansTicketLink)
  var queryURLZomato = "https://developers.zomato.com/api/v2.1/search?lat=" + plansLat + "&lon=" + plansLon + "&radius=1&sort=real_distance&order=asc"
  $.ajax({
    url: queryURLZomato,
    headers: {
      'user-key': '8f2702571eb36dcdffc4d7d4d56e12dd'
    },
    method: "GET"
  }).then(function (response) {
    console.log("zomato ", response)
    for (var i = 0; i < response.restaurants.length; i++) {
      let restName = response.restaurants[i].restaurant.name
      let restAdd = response.restaurants[i].restaurant.location.address
      let restLat = response.restaurants[i].restaurant.location.latitude
      let restLon = response.restaurants[i].restaurant.location.longitude
      let restType = response.restaurants[i].restaurant.cuisines
      let restCostForTwo = response.restaurants[i].restaurant.average_cost_for_two
      let restRating = response.restaurants[i].restaurant.user_rating.aggregate_rating
      console.log(restName, " ", restAdd, " ", restType, " ", restCostForTwo, " ", restRating)
      let restCost = Math.floor(restCostForTwo / 2);
      let restHtml =
        `
          <div id="datum-restName">Restaurant: ${restName}</div>
          <div id="datum-restType">Cuisine: ${restType}</div>
          <div id="datum-restCost" class="cost">Avg Cost: ${restCost}</div>
          <div id="datum-restRating" class="rating">Rating: ${restRating}/5</div>
          <button class="btn btn-dark finalPageBtn">Choose This One</button>
          <div id="datum-restAddress" style="display:none;">${restAdd}</div>
          <div id="datum-venueAddress" style="display: none;">${plansAddress}</div>
          <div id="datum-ticket" style="display: none;">${plansTicketLink}</div>
          <div id="datum-plansCity" style="display: none;">${plansCity}</div>
          <div id="datum-plansLat" style="display: none;">${plansLat}</div>
          <div id="datum-plansLon" style="display: none;">${plansLon}</div>
          <div id="datum-restLat" style="display: none;">${restLat}</div>
          <div id="datum-restLon" style="display: none;">${restLon}</div>
          `;
      let restEventTile = $("<div>")
        .attr('id', 'event-wrapper')
        .addClass('event-wrapper grid-item')
        .css('background-color', "#ffdead")
        .html(restHtml);

      $("#restTable").append(restEventTile);
    }
  })
})

$(document).on("click", ".finalPageBtn", function () {
  bounceOut("#restaurants")
  bounceIn('#finalPage');
  let mapCity = $("#datum-plansCity").text()
  let mapVenueAddress = $("#datum-venueAddress").text()
  let mapRestAddress = $("#datum-restAddress").text()
  let mapVenueLat = $("#datum-plansLat").text()
  let mapVenueLon = $("#datum-plansLon").text()
  let mapRestLat = $("#datum-restLat").text()
  let mapRestLon = $("#datum-restLon").text()
  let finalTicketLink = $("#datum-ticket").text()

  $("#dinnerDirect").attr('href', `https://www.google.com/maps/search/?api=1&query=${mapRestAddress}+${mapCity}`)
    .text("Directions To Dinner");

  $("#venueDirect").attr('href', `https://www.google.com/maps/search/?api=1&query=${mapVenueAddress}+${mapCity}`)
    .text('Direction To Venue');

  $("#ticketBuy").attr('href', `${finalTicketLink}`)
    .text("Buy Tickets");

  $("#googleMap").append(
    `
    <img src="https://maps.googleapis.com/maps/api/staticmap?size=400x300&maptype=roadmap
    &markers=color:blue%7Clabel:V%7C${mapVenueLat},${mapVenueLon}&markers=color:green%7Clabel:R%7C${mapRestLat},${mapRestLon}&key=AIzaSyAKk2jla3sb4BQY1kO1w3UgQOlut_1guwc" id="resultsMap" alt="Results Map">
    `
  )

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
  },600);
}

$(document.body).on('click', '.sort-page-back', function () {
  bounceOut('#sort-page');
  setTimeout(function () {
    bounceIn('#landingPage');
  }, 500);
});

$(document.body).on('click', '#restaurants-page-back', function () {
  bounceOut('#restaurants');
  setTimeout(function () {
    bounceIn('#sort-page');
  }, 500);
});

$(document.body).on('click', '#last-page-back', function () {
  bounceOut('#finalPage');
  setTimeout(function () {
    bounceIn('#restaurants');
  }, 500);
});

$(document).ready(function () {
  bounceIn("#landingPage");
})