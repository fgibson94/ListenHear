let colors = ['#1be3c9', '#6abd75', '#b986e0', '#32f57d', '#eccd52', '#f198b2'];

let session = {
  zip: '',
  radius: '',
  EVENT_ARR: [],
  RESTAURANT_ARR: [],
}

//HELPER FUNCTIONS

function zipError(errorMessage) {
  $('#zip').val(errorMessage).css('color', 'red');
  setTimeout(function () {
    $('#zip').val("").css('color', 'black');
  }, 2000);
};

function radiusError(errorMessage) {
  $('#radius').val(errorMessage).css('color', 'red');
  setTimeout(function () {
    $('#radius').val("").css('color', 'black');
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

//check for existence of property before trying to access
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

//get rid of events w/o spotifyIDs
function purgeResponse(index) {
  session.EVENT_ARR.splice(index, 1);
}

//check for existence of property before trying to access
function checkId(response, index) {
  let k = '';
  'id' in response.artists.items["0"] ? k = "yup" : k = "nope";
  if (k == 'nope') {
    purgeResponse(index, 1)
  } else {
    let spotifyId = response.artists.items["0"].id;
    session.EVENT_ARR[index].spotifyId = spotifyId;
  }

}

function callSpotify() {
  let accessToken = "BQDp9b81_3r20JNM60OFtBqtAHcBdH-j3a8D2ZDoMCX3bEqSGDh-VQGMR7o4dTAczd07pcQtdUJfzsQjHk2wGlf6GqKKqOwXIGb4oih_5Cy6pHebumeDNgDHimSOo49xxdV3tw84z5L8ULOB4o-oD98ODpe7Cfk"
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
      // console.log("spotify tracks being called")
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

//replace function that handles all char replacements (not just 1)
String.prototype.replaceAll = function (search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

//populate music dropdown with buttons per genre
function getMusicButtons() {

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

    //TODO: only add first genre as data
    var genreDash = genre.replaceAll(" ", "-");

    let html =
      `
      <a class="dropdown-item" data-genre=".${genreDash}">${genre}</a>
      `
    $('#genres-in-dropdown').append(html);
    $('#genres-in-dropdown-sm').append(html);
  });

  //repeat for cities
  citiesDeduplicated.forEach(city => {

    var cityDash = city.replaceAll(" ", "-");

    let html =
      `
    <a class="dropdown-item" data-city=".${cityDash}">${city}</a>
    `
    $('#cities-in-dropdown').append(html);
    $('#cities-in-dropdown-sm').append(html);
  });
}

//populate restaurant dropdown with buttons per cuisines
function getRestaurantButtons() {

  const cuisinesDeduplicated = session.RESTAURANT_ARR
    .map(value => value.cuisine)
    .filter((value, index, arr) => arr.indexOf(value) === index);

  //repeat for cities
  cuisinesDeduplicated.forEach(cuisine => {

    cuisineDash = cuisine.replaceAll(" ", "-");

    let html =
      `
    <a class="dropdown-item" data-cuisine=".${cuisineDash}">${cuisine}</a>
    `
    $('#cuisines-in-dropdown').append(html);
    $('#cuisines-in-dropdown-sm').append(html);
  });
}

$("#launch-button").on("click", function () {
  let proceed = validateInput();

  if (proceed == true) {
    callSeatGeek();
    bounceOut("#landingPage")

    setTimeout(function () {
      bounceIn("#loadingPage")
    }, 500);

    setTimeout(function () {
      bounceOut("#loadingPage")
      bounceIn('#sort-page');
    }, 6000)
  }
})

//generates event tiles
function loadEvents() {

  setTimeout(function () {
    $("#event-container").html("");
    session.EVENT_ARR.forEach(event => {
      let randomNum = Math.round(Math.random() * colors.length);
      let color = colors[randomNum];
      let index = session.EVENT_ARR.indexOf(event);
      var html =
        `
      <div class="container">
        <div class="row tile">
            <div class="text-center event-name" id="event-name-${index}">${event.artist}</div>
        </div>
        <div class="row tile">
          <div class="text-center event-venue" id"event-venue-${index}">@ ${event.venue}, ${event.city}</div>
        </div>
        <div class="row tile">
          <iframe class="mx-auto" src="https://play.spotify.com/embed/track/${event.spotifyTrackId}"
          width="250" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
        </div>
        <div class="row tile">
          <button id="make-plans-button-${index}" class="btn btn-lg btn-block btn-dark make-plans-button mx-auto">Make My Plans!</button>
        </div>

      <div id="event-city-${index}" class="event-city" style="display: none;">${event.city}</div>
      <div id="event-address-${index}" class="event-address" style="display: none;">${event.address}</div>
      <div id="event-ticket-${index}" class="event-ticket" style="display: none;">${event.tickets}</div>
      <div id="event-lat-${index}" class="event-lat" style="display: none;">${event.lat}</div>
      <div id="event-lon-${index}" class="event-lon" style="display: none;">${event.lon}</div>
      `;

      //replace spaces for class names
      let cityForClass = event.city;
      cityForClass = cityForClass.replaceAll(" ", "-");

      //note: if you hit an error here...
      ///might be because you don't have a spotify token
      ///this is the first place code needs a real reference
      ///to spotify data

      let genreForClass = event.genres[0];

      const genreClasses = event.genres.map(g => g.replaceAll(" ", "-"))

      let eventTile = $("<div>")
        .attr('id', 'event-wrapper-' + index)
        .addClass('event-wrapper grid-item')
        .addClass(genreClasses.join(' '))
        .addClass(cityForClass)
        .css('background-color', color)
        .html(html);

      $("#event-container").append(eventTile);
    });

    //after events loaded, loop through events for genres
    getMusicButtons();
  }, 2000)
}

$(document).on("click", ".make-plans-button", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');

  eventWrapper = $(this).parent().parent().parent();

  //musiv event vars we carry to restaurant tiles
  let venueAddress = $(eventWrapper).find('.event-address').text();
  let venueCity = $(eventWrapper).find('.event-city').text();
  let venueLat = $(eventWrapper).find('.event-lat').text();
  let venueLon = $(eventWrapper).find('.event-lon').text();
  let venueTicketLink = $(eventWrapper).find('.event-ticket').text();

  var queryURLZomato = "https://developers.zomato.com/api/v2.1/search?lat=" + venueLat + "&lon=" + venueLon + "&radius=1&sort=real_distance&order=asc"
  $.ajax({
    url: queryURLZomato,
    headers: {
      'user-key': '8f2702571eb36dcdffc4d7d4d56e12dd'
    },
    method: "GET"
  }).then(function (response) {
    session.RESTAURANT_ARR = [];

    for (var i = 0; i < response.restaurants.length; i++) {

      let cuisines = response.restaurants[i].restaurant.cuisines;
      let cuisinesAry = cuisines.split(", ");

      let restaurant = {
        name: response.restaurants[i].restaurant.name,
        address: response.restaurants[i].restaurant.location.address,
        lat: response.restaurants[i].restaurant.location.latitude,
        lon: response.restaurants[i].restaurant.location.longitude,
        cuisine: cuisinesAry[0],
        cost: (Math.floor(response.restaurants[i].restaurant.average_cost_for_two / 2)),
        rating: response.restaurants[i].restaurant.user_rating.aggregate_rating
      };

      session.RESTAURANT_ARR.push(restaurant);

      let restHtml =
        `
          <div id="restaurant-name" class="datum-restName">Restaurant: ${restaurant.name}</div>
          <div id="restaurant-cuisine" class="datum-restType">Cuisine: ${cuisines}</div>
          <div id="restaurant-cost" class="datum-restCost cost">Avg Cost: ${restaurant.cost}</div>
          <div id="restaurant-rating" class="datum-restRating rating">Rating: ${restaurant.rating}/5</div>
          <button class="btn btn-dark directions-button">Choose This One</button>
          <div class="restaurant-address" style="display:none;">${restaurant.address}</div>
          <div class="restaurant-lat" style="display: none;">${restaurant.lat}</div>
          <div class="restaurant-lon" style="display: none;">${restaurant.lon}</div>
          <div class="venue-address" style="display: none;">${venueAddress}</div>
          <div class="ticket-link" style="display: none;">${venueTicketLink}</div>
          <div class="venue-city" style="display: none;">${venueCity}</div>
          <div class="venue-lat" style="display: none;">${venueLat}</div>
          <div class="venue-lon" style="display: none;">${venueLon}</div>
          `;

      let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
      cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));

      let restEventTile = $("<div>")
        .attr('id', 'event-wrapper')
        .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
        .css('background-color', "#ffdead")
        .html(restHtml);

      $("#restTable").append(restEventTile);

    };
    getRestaurantButtons();
  })
});

//proceed to directions page
$(document).on("click", ".directions-button", function () {
  bounceOut("#restaurants")
  bounceIn('#finalPage');

  let rw = $(this).parent(); //restaurant-wrapper

  let mapCity = $(rw).find(".venue-city").text()
  let mapVenueAddress = $(rw).find(".venue-address").text()
  let mapRestAddress = $(rw).find(".restaurant-address").text()
  let mapVenueLat = $(rw).find(".venue-lat").text()
  let mapVenueLon = $(rw).find(".venue-lon").text()
  let mapRestLat = $(rw).find(".restaurant-lat").text()
  let mapRestLon = $(rw).find(".restaurant-lon").text()
  let finalTicketLink = $(rw).find(".ticket-link").text()

  $("#dinnerDirect").attr('href', `https://www.google.com/maps/search/?api=1&query=${mapRestAddress}+${mapCity}`)
    .attr("target", "_blank").text("Directions To Dinner");

  $("#venueDirect").attr('href', `https://www.google.com/maps/search/?api=1&query=${mapVenueAddress}+${mapCity}`)
    .attr("target", "_blank").text('Direction To Venue');

  $("#ticketBuy").attr('href', `${finalTicketLink}`)
    .attr("target", "_blank").text("Buy Tickets");

  $("#googleMap").append(
    `
    <img src="https://maps.googleapis.com/maps/api/staticmap?size=400x300&maptype=roadmap
    &markers=color:blue%7Clabel:V%7C${mapVenueLat},${mapVenueLon}&markers=color:green%7Clabel:R%7C${mapRestLat},${mapRestLon}&key=AIzaSyAKk2jla3sb4BQY1kO1w3UgQOlut_1guwc" id="resultsMap" alt="Results Map">
    `
  )

});

//ISOTOPE FEATURES
//isotope filter for cuisines
$("#cuisines-in-dropdown").on("click", ".dropdown-item", function () {

  var $grid = $('.grid').isotope({
    // options
    itemSelector: '.grid-item',
    layoutMode: "fitRows",
    fitRows: {
      columnWidth: 300
    }
  });

  var value = $(this).attr('data-cuisine');

  $grid.isotope({
    filter: value,
  });

});

//isotope filter for genre
$("#genres-in-dropdown").on("click", ".dropdown-item", function () {

  var $grid = $('.grid').isotope({
    // options
    itemSelector: '.grid-item',
    layoutMode: "fitRows",
    fitRows: {
      columnWidth: 300
    }
  });

  var value = $(this).attr('data-genre');

  $grid.isotope({
    filter: value,
  });

});

//isotope cities for genre
$("#cities-in-dropdown").on("click", ".dropdown-item", function () {

  var $grid = $('.grid').isotope({
    // options
    itemSelector: '.grid-item',
    layoutMode: "fitRows",
    fitRows: {
      columnWidth: 300
    }
  });

  var value = $(this).attr('data-city');

  $grid.isotope({
    filter: value,
  });

});

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
  }, 600);
}

//CLICK FEATURES
$(document.body).on('click', '#sort-page-back', function () {
  bounceOut('#sort-page');
  setTimeout(function () {
    bounceIn('#landingPage');
  }, 500);
});

//FOR UNIMPLEMENTED BACK BUTTONS
// $(document.body).on('click', '#sort-page-back-sm', function () {
//   bounceOut('#sort-page');
//   setTimeout(function () {
//     bounceIn('#landingPage');
//   }, 500);
// });

// $(document.body).on('click', '#restaurants-page-back', function () {
//   bounceOut('#restaurants');
//   setTimeout(function () {
//     bounceIn('#sort-page');
//   }, 500);
// });

// $(document.body).on('click', '#last-page-back', function () {
//   bounceOut('#finalPage');
//   setTimeout(function () {
//     bounceIn('#restaurants');
//   }, 500);
// });

$(document).ready(function () {
  bounceIn("#landingPage");
});