/**
 * Created by jonas on 17.04.16.
 */

var chargers_nearby = new Array();

/**
 * A method for calculating the distance in KM between two positions on the map
*/
function compareDistance(userPos, stationPos){
    try{
        return google.maps.geometry.spherical.computeDistanceBetween (strToLtLng(userPos[0] + "," + userPos[1]), strToLtLng(stationPos[0] + "," + stationPos[1]))/1000;
    }catch(e){
        //console.log("Unable to compare distances: " + e);
        return 999;//Unable to get the location so defaulting to unreachable value
    }
}

//For updating just the nearby charger list and not every chargers
function updateNearbyChargers(){
    chargers_nearby.length = 0;
    var sPos;
    for(var station in jsonData){
        sPos = jsonData[station].csmd.Position.replace(/[()]/g,"").split(",");
        if(compareDistance(geopos, sPos) <= 10){
            chargers_nearby[jsonData[station].csmd.id] = jsonData[station];
            chargers_nearby[jsonData[station].csmd.id]["distance"] = compareDistance(geopos, sPos);
        }
    }
    getNearbyChargers();
}

function getNearbyChargers(){
    $('#chargers-nearby').html("");
    chargers_nearby.sort(function (a, b){
        return a.distance - b.distance;
    });
    var thisPos = [];
    var id;
    for(var station in chargers_nearby){
        id = chargers_nearby[station].csmd.International_id;
        //If it is matching our filters and is available to the public
        if(getCarMatch(chargers_nearby[station].csmd.Number_charging_points, id) && chargers_nearby[station].attr.st[2].attrvalid == "1"){
            thisPos = chargers_nearby[station].csmd.Position.replace(/[()]/g,"").split(",");
            $('#chargers-nearby').append(
                '<li class="border img-height-4em">' +
                    '<img class="cover-third float-left img-height-4em" src=\"' + getStationImage(id) + '\"/>' +
                    '<div class="cover-twothird float-left">'+
                        '<strong class="float-left">' + chargers_nearby[station].csmd.name + '</strong><br />'+
                        '<span>' + chargers_nearby[station].distance.toFixed(2)+ 'km</span><br />'+
                        '<button onclick="navigateFromUser(geopos, this)" value="'+ thisPos +'">Ta meg hit</button>' +
                        "<button onclick='readMorev2(this)'>Vis mer</button>"+
                        "<div class='read-more clear-both'>" +
                            generateConnectorString(id,jsonData[id].attr.st[21].attrvalid == "1") +
                        "</div>" +
                    '</div>' +
                '</li>');
        }
    }
}