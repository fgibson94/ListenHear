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
  let accessToken = "BQArmuIn4fDvWE11Nna14L5fd44b8Hj9I29zOJ7dgQAa-KQlvopmP5M4oIqBq-EP0DZzLjRTsIbktYm8ZANBkWmfOyXSz0s0WpHtmH-doiaKQY9giE0uB8uBf48jwVWTszZYtminqNMkvekBmYgTLqhq0K1OkDIZ7zU6hNnDj01-ANNhSw"
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
    .map(value => value.cuisine[0])
    .filter((value, index, arr) => arr.indexOf(value) === index);

  //console.log(cuisinesDeduplicated);

  //repeat for cities
  cuisinesDeduplicated.forEach(cuisine => {
    cuisineDash = cuisine.replaceAll(" ", "-");
    //console.log("cuisineDash ", cuisineDash)

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
            <div class="text-center" class="datum-name-${index}">${event.artist}</div>
        </div>
        <div class="row tile">
          <div class="text-center" class="datum-venue-${index}">@ ${event.venue}, ${event.city}</div>
        </div>
        <div class="row tile">
          <iframe class="mx-auto" src="https://play.spotify.com/embed/track/${event.spotifyTrackId}"
          width="250" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
        </div>
        <div class="row tile">
          <button class="btn btn-lg btn-block btn-dark restBtn-${index} mx-auto">Make My Plans!</button>
        </div>

      <div id="datum-address-${index}" class="datum-address" style="display: none;">${event.address}</div>
      <div id="datum-ticket-${index}" class="datum-ticket" style="display: none;">${event.tickets}</div>
      <div id="datum-lat-${index}" class="datum-lat" style="display: none;">${event.lat}</div>
      <div id="datum-lon-${index}" class="datum-lon" style="display: none;">${event.lon}</div>
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

$(document).on("click", ".restBtn-0", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-0").text()
  let plansCity = $("#datum-city-0").text()
  let plansLat = $("#datum-lat-0").text()
  let plansLon = $("#datum-lon-0").text()
  let plansTicketLink = $("#datum-ticket").text()
  $("#ticketLink").text(plansTicketLink)
  //console.log(plansAddress, " ", plansCity, " ", plansLat, " ", plansLon, " ", plansTicketLink)
  var queryURLZomato = "https://developers.zomato.com/api/v2.1/search?lat=" + plansLat + "&lon=" + plansLon + "&radius=1&sort=real_distance&order=asc"
  $.ajax({
    url: queryURLZomato,
    headers: {
      'user-key': '8f2702571eb36dcdffc4d7d4d56e12dd'
    },
    method: "GET"
  }).then(function (response) {
    session.RESTAURANT_ARR = [];
    //console.log("zomato ", response)
    for (var i = 0; i < response.restaurants.length; i++) {
      let restName = response.restaurants[i].restaurant.name
      let restAdd = response.restaurants[i].restaurant.location.address
      let restLat = response.restaurants[i].restaurant.location.latitude
      let restLon = response.restaurants[i].restaurant.location.longitude
      let restType = response.restaurants[i].restaurant.cuisines
      let restCostForTwo = response.restaurants[i].restaurant.average_cost_for_two
      let restRating = response.restaurants[i].restaurant.user_rating.aggregate_rating
      //console.log(restName, " ", restAdd, " ", restType, " ", restCostForTwo, " ", restRating)
      let restCost = Math.floor(restCostForTwo / 2);
      let restHtml =
        `
          <div id="datum-restName" class="datum-restName">Restaurant: ${restName}</div>
          <div id="datum-restType" class="datum-restType">Cuisine: ${restType}</div>
          <div id="datum-restCost" class="datum-restCost cost">Avg Cost: ${restCost}</div>
          <div id="datum-restRating" class="datum-restRating rating">Rating: ${restRating}/5</div>
          <button class="btn btn-dark finalPageBtn">Choose This One</button>
          <div class="datum-restAddress" style="display:none;">${restAdd}</div>
          <div class="datum-venueAddress" style="display: none;">${plansAddress}</div>
          <div class="datum-ticket" style="display: none;">${plansTicketLink}</div>
          <div class="datum-plansCity" style="display: none;">${plansCity}</div>
          <div class="datum-plansLat" style="display: none;">${plansLat}</div>
          <div class="datum-plansLon" style="display: none;">${plansLon}</div>
          <div class="datum-restLat" style="display: none;">${restLat}</div>
          <div class="datum-restLon" style="display: none;">${restLon}</div>
          `;

      let cuisinesAry = restType.split(", ");

      let restaurant = {
        name: restName,
        address: restAdd,
        cuisine: cuisinesAry,
        cost: restCostForTwo
      };

      session.RESTAURANT_ARR.push(restaurant);

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

$(document).on("click", ".restBtn-1", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-1").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-1").text()
  let plansLon = $("#datum-lon-1").text()
  let plansTicketLink = $("#datum-ticket-1").text()
  $("#ticketLink").text(plansTicketLink)
  //console.log(plansAddress, " ", plansCity, " ", plansLat, " ", plansLon, " ", plansTicketLink)
  var queryURLZomato = "https://developers.zomato.com/api/v2.1/search?lat=" + plansLat + "&lon=" + plansLon + "&radius=1&sort=real_distance&order=asc"
  $.ajax({
    url: queryURLZomato,
    headers: {
      'user-key': '8f2702571eb36dcdffc4d7d4d56e12dd'
    },
    method: "GET"
  }).then(function (response) {
    //console.log("zomato ", response)
    for (var i = 0; i < response.restaurants.length; i++) {
      let restName = response.restaurants[i].restaurant.name
      let restAdd = response.restaurants[i].restaurant.location.address
      let restLat = response.restaurants[i].restaurant.location.latitude
      let restLon = response.restaurants[i].restaurant.location.longitude
      let restType = response.restaurants[i].restaurant.cuisines
      let restCostForTwo = response.restaurants[i].restaurant.average_cost_for_two
      let restRating = response.restaurants[i].restaurant.user_rating.aggregate_rating
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-2", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-2").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-2").text()
  let plansLon = $("#datum-lon-2").text()
  let plansTicketLink = $("#datum-ticket-2").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-3", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-3").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-3").text()
  let plansLon = $("#datum-lon-3").text()
  let plansTicketLink = $("#datum-ticket-3").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-4", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-4").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-4").text()
  let plansLon = $("#datum-lon-4").text()
  let plansTicketLink = $("#datum-ticket-4").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-5", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-5").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-5").text()
  let plansLon = $("#datum-lon-5").text()
  let plansTicketLink = $("#datum-ticket-5").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-6", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-6").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-6").text()
  let plansLon = $("#datum-lon-6").text()
  let plansTicketLink = $("#datum-ticket-6").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-7", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-7").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-7").text()
  let plansLon = $("#datum-lon-7").text()
  let plansTicketLink = $("#datum-ticket-7").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-8", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-8").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-8").text()
  let plansLon = $("#datum-lon-8").text()
  let plansTicketLink = $("#datum-ticket-8").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-9", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-9").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-9").text()
  let plansLon = $("#datum-lon-9").text()
  let plansTicketLink = $("#datum-ticket-9").text()
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
          let cuisinesAry = restType.split(", ");

      let restaurant = {
        name: restName,
        address: restAdd,
        cuisine: cuisinesAry,
        cost: restCostForTwo
      };

      session.RESTAURANT_ARR.push(restaurant);

      let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
      cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));

      let restEventTile = $("<div>")
        .attr('id', 'event-wrapper')
        .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
        .css('background-color', "#ffdead")
        .html(restHtml);

      $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-10", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-10").text()
  let plansCity = $("#datum-city-10").text()
  let plansLat = $("#datum-lat-10").text()
  let plansLon = $("#datum-lon-10").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-11", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-11").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-11").text()
  let plansLon = $("#datum-lon-11").text()
  let plansTicketLink = $("#datum-ticket-11").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-12", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-12").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-12").text()
  let plansLon = $("#datum-lon-12").text()
  let plansTicketLink = $("#datum-ticket-12").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
  })
})

$(document).on("click", ".restBtn-13", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-13").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-13").text()
  let plansLon = $("#datum-lon-13").text()
  let plansTicketLink = $("#datum-ticket-13").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();

  })
})

$(document).on("click", ".restBtn-14", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-14").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-14").text()
  let plansLon = $("#datum-lon-14").text()
  let plansTicketLink = $("#datum-ticket-14").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();

  })
})

$(document).on("click", ".restBtn-15", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-15").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-15").text()
  let plansLon = $("#datum-lon-15").text()
  let plansTicketLink = $("#datum-ticket-15").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();

  })
})

$(document).on("click", ".restBtn-16", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-16").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-16").text()
  let plansLon = $("#datum-lon-16").text()
  let plansTicketLink = $("#datum-ticket-16").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();

  })
})

$(document).on("click", ".restBtn-17", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-17").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-17").text()
  let plansLon = $("#datum-lon-17").text()
  let plansTicketLink = $("#datum-ticket-17").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();

  })
})

$(document).on("click", ".restBtn-18", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-18").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-18").text()
  let plansLon = $("#datum-lon-18").text()
  let plansTicketLink = $("#datum-ticket-18").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();

  })
})

$(document).on("click", ".restBtn-19", function () {
  bounceOut("#sort-page")
  bounceIn('#restaurants');
  let plansAddress = $("#datum-address-19").text()
  let plansCity = $("#datum-city").text()
  let plansLat = $("#datum-lat-19").text()
  let plansLon = $("#datum-lon-19").text()
  let plansTicketLink = $("#datum-ticket-19").text()
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
          let cuisinesAry = restType.split(", ");

          let restaurant = {
            name: restName,
            address: restAdd,
            cuisine: cuisinesAry,
            cost: restCostForTwo
          };
    
          session.RESTAURANT_ARR.push(restaurant);
    
          let cuisineClasses = cuisinesAry.map(cuisine => cuisine.replaceAll(" ", "-"))
          cuisineClasses = cuisineClasses.map(cuisine => cuisine.replaceAll(",", ""));
    
          let restEventTile = $("<div>")
            .attr('id', 'event-wrapper')
            .addClass('event-wrapper grid-item ' + cuisineClasses.join(" "))
            .css('background-color', "#ffdead")
            .html(restHtml);
    
          $("#restTable").append(restEventTile);
    }
    getRestaurantButtons();
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


//DISPLAY

//ISOTOPE FEATURES
//isotope filter for cuisines
$("#cuisines-in-dropdown").on("click", ".dropdown-item", function () {
  //console.log(this);

  var $grid = $('.grid').isotope({
    // options
    itemSelector: '.grid-item',
    layoutMode: "fitRows",
    fitRows: {
      columnWidth: 300
    }
  });

  var value = $(this).attr('data-cuisine');
  //console.log(value);

  $grid.isotope({
    filter: value,
  });

});

//isotope filter for genre
$("#genres-in-dropdown").on("click", ".dropdown-item", function () {
  //console.log(this);

  var $grid = $('.grid').isotope({
    // options
    itemSelector: '.grid-item',
    layoutMode: "fitRows",
    fitRows: {
      columnWidth: 300
    }
  });

  var value = $(this).attr('data-genre');
  //console.log(value);

  $grid.isotope({
    filter: value,
  });

});

//isotope cities for genre
$("#cities-in-dropdown").on("click", ".dropdown-item", function () {
  //console.log(this);

  var $grid = $('.grid').isotope({
    // options
    itemSelector: '.grid-item',
    layoutMode: "fitRows",
    fitRows: {
      columnWidth: 300
    }
  });

  var value = $(this).attr('data-city');
  //console.log(value);

  $grid.isotope({
    filter: value,
  });

});

//TRANSITIONS
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