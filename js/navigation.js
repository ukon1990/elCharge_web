/**
 * Created by jonas on 16.03.16.
 * source: https://developers.google.com/maps/documentation/javascript/examples/directions-draggable
 */

var waypoints = [];//[{location: 'Lillestrøm, Norway'}, {location: 'Moss, Norway'}];
var startDestination = "";
var endDestination ="";
var directionsDisplay;
var directionsService;

var myroute = [];
function navigate(){
    //Cleaning previous directions
    clearRoute();
    if(document.getElementById('right-panel').innerHTML != null){
        document.getElementById('right-panel').innerHTML = ""; //The route description
    }

    //Getting destinations
    startDestination = $('#nav-start-pos').val();
    endDestination = $('#nav-end-pos').val();
    directionsService = new google.maps.DirectionsService;

    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('right-panel')
    });

    //Allows us to do stuff when the route is dragged and/or changed.
    directionsDisplay.addListener('directions_changed', function() {
        computeTotalDistance(directionsDisplay.getDirections());
    });

    displayRoute(startDestination, endDestination, directionsService,directionsDisplay);
    console.log("Dirs: " + directionsService.path);
}

function navigateFromUser(from, toel){
    var to = $(toel).attr('value');
    $('#nav-start-pos').val(from);
    $('#nav-end-pos').val(to);
    //Cleaning previous directions
    if(directionsDisplay != null){
        directionsDisplay.setMap(null);//The route in the map
    }
    if(document.getElementById('right-panel').innerHTML != null){
        $("#right-panel").html(""); //The route description
    }

    //Getting destinations
    startDestination = from[0] + "," + from[1];
    endDestination = to;
    console.log("Start destination: " + startDestination + " end destination: " + endDestination);
    directionsService = new google.maps.DirectionsService;

    directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('right-panel')
    });

    //Allows us to do stuff when the route is dragged and/or changed.
    directionsDisplay.addListener('directions_changed', function() {

        computeTotalDistance(directionsDisplay.getDirections());
        directionsDisplay.setDirections();
    });

    displayRoute(startDestination, endDestination, directionsService,directionsDisplay);
    console.log("Dirs: " + directionsService.path);
}

function clearRoute(){
    if(directionsDisplay != null){
        $("#right-panel").html("");
        directionsDisplay.setMap(null);//The route in the map
    }
}


function displayRoute(origin, destination, service, display) {
    var avoidTolls = !$('#route-option-tolls').prop('checked');
    var avoidHighways = !$('#route-option-highways').prop('checked');
    var provideRouteAlternatives = $('#route-option-alternative-routes').prop('checked');
    service.route({
        origin: origin,
        destination: destination,
        optimizeWaypoints: true,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: avoidTolls,
        avoidHighways: avoidHighways,
        provideRouteAlternatives: provideRouteAlternatives
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            display.setDirections(response);
        } else {
            alert('Could not display directions due to: ' + status);
        }
    });
}


function computeTotalDistance(result) {
    var total = 0;
    myroute = result.routes[0];

    console.log(myroute);
    for (var i = 0; i < myroute.legs.length; i++) {
        total += myroute.legs[i].distance.value;
    }
    total = total / 1000;
    $('#total').html('Total reise distanse '+ total + ' km');
    //Showing the path elevation
    displayPathElevation(myroute, elevationService);
}