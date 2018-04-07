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
  spotifyResponse: [],
  playlistURL: '',
}

var ARTIST_ARR = []
var VENUE_ARR = []

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

function callSpotify() {
  var accessToken = "BQDdHv7U5MBvA4HpuTMGmXsJ3Bxxti37fxxOQt2tO9mgpse5Uv7mTMQQ7JNEIsXnqaYtiG1p371lUXRI0_hzyGwTxpv66Y8LVZv_sNJfYfI1vMYE_nhaaVwvnHDnjVJ53usZMlmMJKyox_ednaN2YK2UdzIzVLRsqJH_pyYCzdnKs84"
  for (var i = 0; i < ARTIST_ARR.length; i++) {
  $.ajax({
    url: "https://api.spotify.com/v1/search?q=" + ARTIST_ARR[3] + "&type=artist",
    headers: {
        'Authorization': 'Bearer ' + accessToken
    },
    success: function(responseSpotify) {
        console.log(responseSpotify)
    }
  });
  };
} 
function callSeatGeek() {
  event.preventDefault();
  ZIP = $("#zipcodeInput").val().trim();
  DIST = $("#distInput").val().trim();
  DATE = moment().format("YYYY-MM-DD");
  console.log(DATE)
  var queryURL = "https://api.seatgeek.com/2/events?type=concert&per_page=1000&postal_code=" + ZIP + "&range=" + DIST + "mi&client_id=MTExMzAwNzR8MTUyMjk4NDcwNS4xNg"
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function(response) {
    for (var i = 0; i < response.events.length; i++) {
      var timeChecker = response.events[i].datetime_local
      var timeCheckerTwo = moment(timeChecker).format("YYYY-MM-DD")
      if (timeCheckerTwo == DATE) {
      var artistName = response.events[i].performers[0].name
      var venueName = response.events[i].venue.name
      ARTIST_ARR.push(artistName);
      VENUE_ARR.push(venueName);
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
  callSpotify()

})
  console.log(ARTIST_ARR);
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

function sortGenre(){
  $('.grid').isotope({
    filter: '.country'
  });
};

$('#sort-page').on('click', '#genre-filter', function(){
  console.log('here');
  sortGenre();
});

function loadFakeData() {
  $("#event-container").html("");
  fakeData.forEach(datum => {
    let randomNum = Math.round(Math.random() * colors.length);
    let color = colors[randomNum];
    
    let index = fakeData.indexOf(datum);
    var html =
      `
      <div id="datum-name-${index}">${datum.name}</div>
      <div id="datum-venue-${index}">${datum.venue}</div>
    `;
    let event = $("<div>")
    .attr('id','event-wrapper'+index)
    .addClass('event-wrapper grid-item')
    .addClass(datum.genre)
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
$("#submitBtn").on("click", callSeatGeek);