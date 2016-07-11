/**
 * Created by jonas on 13.06.16.
 */

var station = {
  /*
   * List of stations
   */
  list : [],
  attr : {
    st :{//Translated values (Source === English)
      2 : {
        1 : 'Offentlig',
        2 : 'Besøkende',
        3 : 'Ansatte',
        4 : 'Ved avtale',
        5 : 'Beboere'
      },
      3 : {
        1 : 'Gate',
        2 : 'Parkeringsplass',
        3 : 'Flyplass',
        4 : 'Kjøpesenter',
        5 : 'Transport hub',
        6 : 'Hotell og restaurant',
        7 : 'Bensinstasjon'
      }
    },
    conn : {

    }
  },
  user : {
    carConns : []
  },
  hasFastCharge : false,
  hasDownloaded : false,
  markers : [],
  infoWindows : [],
  markerListeners : [],
  selectedCapacity : 0,
  occupiedLimit : 0.4,
  semiFastCharge : 12,
  fastCharge : 43,
  markerClusterer : null,
  bindStationNames : function(){
    $('a.station').unbind();
    $('a.station').bind('click', function(){
      google.maps.event.trigger(station.markers[station.list[$(this).attr('value')].markerID], 'click');
    });
  },
  /*
   * Connectors
   */
  conns : {
    list : [],
    numFaulty : 0,//Overwritten
    carModels : {},
    typesIDs : {
      '0' : 'Unspecified',
      '14' : 'Schuko',
      '22' : 'Danish (Section 107-2-D1)',
      '29' : 'Tesla Connector Roadster',
      '30' : 'CHAdeMO',
      '31' : 'Type 1',
      '32' : 'Type 2',
      '60' : 'Type1/Type2',
      '34' : 'Blue industrial 3-pin',
      '35' : 'Blue industrial 4-pin',
      '36' : 'Red industrial 5-pin',
      '38' : 'Marechal',
      '39' : 'CCS/Combo',
      '40' : 'Tesla Connector Model',
      '41' : 'Combo + CHAdeMO',
      '42' : 'CHAdeMO + Type 2',
      '43' : 'CHAdeMO + Combo + AC-Type2',
      '50' : 'Type 2 + Schuko',
      '52' : 'Type 2 + Danish (Section 107-2-D1)'
    },
    types : {
      schuko : ['14', '50'],
      type1 : ['31', '60'],
      type2 : ['32', '60', '42', '50', '52'],
      type2ac : ['43'],
      chademo : ['30', '41', '42', '43'],
      combo : ['39', '41'],
      ind3pin : ['34'],
      ind4pin : ['35'],
      ind5pin : ['36'],
      teslaModelS : ['40'],
      teslaRoadster : ['29']
    },
    capacity : {
      0 : {'id':0,'name':'Unspecified','current':'ukjent', 'kW':0, 'volt':0, 'ampere':0},
      1 : {'id':1,'name':'Battery exchange','current':'ukjent', 'kW':0, 'volt':0, 'ampere':0},
      7 : {'id':7, 'name':'3,6 kW - 230V 1-phase max 16A','current':'AC', 'kW':3.6, 'volt':230, 'ampere':16},
      8 : {'id':8, 'name':'7,4 kW - 230V 1-phase max 32A','current':'AC', 'kW':7.4, 'volt':230, 'ampere':32},
      10 : {'id':10, 'name':'11 kW - 400V 3-phase max 16A','current':'AC', 'kW':11, 'volt':400, 'ampere':16},
      11 : {'id':11, 'name':'22 kW - 400V 3-phase max 32A','current':'AC', 'kW':22, 'volt':400, 'ampere':22},
      12 : {'id':12, 'name':'43 kW - 400V 3-phase max 63A','current':'AC', 'kW':43, 'volt':400, 'ampere':63},
      13 : {'id':13, 'name':'50 kW - 500VDC max 100A','current':'DC', 'kW':50, 'volt':500, 'ampere':100},
      23 : {'id':23, 'name':'100 kW - 500VDC max 200A','current':'DC', 'kW':100, 'volt':500, 'ampere':200},
      16 : {'id':16, 'name':'230V 3-phase max 16A','current':'AC', 'kW':3.7, 'volt':230, 'ampere':16},
      17 : {'id':17, 'name':'230V 3-phase max 32A','current':'AC', 'kW':7.3, 'volt':230, 'ampere':32},
      18 : {'id':18, 'name':'230V 3-phase max 63A','current':'AC', 'kW':14.7, 'volt':230, 'ampere':64},
      19 : {'id':19, 'name':'20 kW - 500VDC max 50A','current':'DC', 'kW':20, 'volt':500, 'ampere':50},
      20 : {'id':20, 'name':'Less then 100 kW + 43 kW - 500VDC max 200A + 400V 3-phase max 63A','current':'DC', 'kW':43, 'volt':400, 'ampere':63},
      21 : {'id':21, 'name':'Less then 100 kW + 22 kW - 500VDC max 50A + 400V 3-phase max 32A','current':'DC', 'kW':22, 'volt':400, 'ampere':32},
      22 : {'id':22, 'name':'135 kW - 480VDC max 270A','current':'DC', 'kW':135, 'volt':480, 'ampere':270}
    },
    connCapacityString : function(id, connectorID){
      var capacity = station.conns.capacity[station.list[id].attr.conn[connectorID][5].attrvalid].kW;
      return capacity >= station.fastCharge ? capacity + "kW " + 'hurtiglader' : (capacity >= station.semiFastCharge ? capacity + "kW " +"semihurtig": capacity + "kW "+ "vanlig");
    },
    getString : function(id, isLive){
      var isInService = true,
        connStatus = "9";
      station.conns.numFaulty = 0;

      var result = '<div style="margin:0.1em 0 0.1em 0;">';
      for(var c in station.list[id].attr.conn){
        try{
          if(isLive
            && station.list[id].attr.conn[c][9] !== undefined
            && station.list[id].attr.conn[c][8] !== undefined
          ){
            try {
              isInService = station.list[id].attr.conn[c][9].attrvalid === "0";
              connStatus = station.list[id].attr.conn[c][8].attrvalid;
              if(!isInService){//Is a faulty connector
                station.conns.numFaulty++;
              }
            } catch(e) {console.log(c +' ERROR: ' + e);}
          }
          result +=
            '<div class="cpelements">'+
              '<span style="color:black; max-width:80%; float:left;">'+
                '<strong>Uttak: </strong>' + station.list[id].attr.conn[c][4].trans +
                '</br><strong>KW: </strong>' + station.conns.connCapacityString(id, c) +
                (isLive && station.list[id].attr.conn[c][16] !== undefined ?
                    '</br><strong>Siste status: </strong>' +
                      app.time.utcToNOR(station.list[id].attr.conn[c][16].attrval)
                    : '') +
              '</span>'+
              '<div class="chargePointColor" style="background-color:' +
                (isLive ? (isInService ? (connStatus === '0' ? 'lightgreen' : (connStatus === '9' ? 'blue' : 'yellow')) : 'red') : 'blue') +';"></div>'+
              station.conns.getImg(station.list[id].attr.conn[c][4].attrvalid) +
            '</div>';
        }catch(e){
          console.log('Failed to build connectorsString for ' + station.list[id].csmd.name + '(' + id + ' c: ' + c + ')' +" Error: " + e);
        }
      }
      return result += "</div>";
    },
    // TODO: connectorImg
    getImg : function(connType) {
      var imgStart = '<img class="float-right" src="icons/conn/',
        imgEnd = '" style="max-height:2em; max-width:2em;"/>',
        result = '';
      if(app.inArrayVal(connType, station.conns.types.schuko)){
        result += imgStart + 'schuko.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.type1)){
        result += imgStart + 'type1.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.type2)){
        result += imgStart + 'type2_tesla.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.chademo)){
        result += imgStart + 'chademo.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.combo)){
        result += imgStart + 'combo1.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.ind3pin)){
        result += imgStart + 'industrial3pin.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.ind4pin)){
        result += imgStart + 'industrial4pin.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.ind5pin)){
        result += imgStart + 'industrial5pin.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.teslaModelS)){
        result += imgStart + 'type2_tesla.svg' + imgEnd;}
      if(app.inArrayVal(connType, station.conns.types.teslaRoadster)){
        result += imgStart + 'tesla_r.svg' + imgEnd;}
      return result;
    }
  },
  favorite : {
    stationList : [],
    routeList : [],
    distance : 0,
    routeNames : [],
    searchRoute : function(){
      //TODO: Fix!!
      var list = [];
      for(var i in station.favorite.routeList){
        list.push(station.favorite.routeList[i].name);
      }
      console.log(list);
      station.favorite.routeNames = list;
    },
    saveRoute : function(id){
      $('#save-route').show();
    },
    addRoute : function(element){
      var path ="";
      if(app.device.phonegap){
        path += app.path;
      }
      path +="api/alterUserRoute.php";

      //Generating object
      for(var i in navigation.route.legs){
        if(i === 0){
          //Getting starting pos
          navigation.jsonRoute["start"] = navigation.route.legs[i].start_address;
        }

        if (i === navigation.route.legs.length -1){
          //Getting end destination
          navigation.jsonRoute["end"] =  navigation.route.legs[i].end_address;
        }
      }
      navigation.jsonRoute['waypoints'] = navigation.waypoints;
      navigation.jsonRoute['waypointsData'] = navigation.waypointsData;

      //Posting route
      $.post( path,{
        action : 'add',
        name : $(element).find(':input[name="route-name"]').val(),
        route : JSON.stringify(navigation.jsonRoute),
        distance : station.favorite.distance,
        comment : $(element).find(':input[name="route-comment"]').val()
      }, function(result){
        console.log(result);
        station.favorite.routeList[station.favorite.routeList.length] = {
          route_id : station.favorite.routeList.length,
          name : $(element).find(':input[name="route-name"]').val(),
          route : navigation.jsonRoute,
          distance : station.favorite.distance,
          comment : $(element).find(':input[name="route-comment"]').val()
        };
        station.favorite.updateRoutes();
      });
      //Closing the window
      $(this).parent().parent().hide();
      return false;
    },
    addStation : function(id){
      var path ="";
      if(app.device.phonegap){
        path += app.path;
      }
      path +="api/addUserStation.php";
      station.favorite.stationList.push({station_id:id});
      $.post( path,{
        stationId: id
      }, function(response){
        console.log(response);
        station.favorite.updateStations();
      });
      return false;
    },
    deleteStation : function(element){
      var path ="",
        id = $(element).parent().parent().attr('value');
      if(app.device.phonegap){
        path += app.path;
      }
      path +="api/deleteUserStation.php";
      //Deleting from array
      for(var i in station.favorite.stationList){
        if(id === station.favorite.stationList[i].station_id){
          station.favorite.stationList.splice(i, 1);
          break;
        }
      }
      $.post( path,{
        stationId: id
      }, function(response){
        console.log(response);
        station.favorite.updateStations();
      });
      return false;
    },
    deleteRoute : function(element){
      var path ="";
      if(app.device.phonegap){
        path += app.path;
      }
      path +="api/alterUserRoute.php";
      var id = $(element).parent().parent().attr('value');
      console.log(id);
      //Deleting from array
      station.favorite.routeList.splice(id, 1);
      $.post( path,{
        action : 'delete',
        route_id: id
      }, function(response){
        console.log(response);
        station.favorite.updateRoutes();
      });
      return false;
    },
    editRoute : function(element){
      var path ="",
        id = $(element).parent().parent().attr('value');
      if(app.device.phonegap){
        path += app.path;
      }
      path +="api/alterUserRoute.php";

      //Deleting from array
      station.favorite.routeList.splice(id, 1);
      $.post( path,{
        action : 'edit',
        route_id: id
      }, function(response){
        station.favorite.updateRoutes();
      });
      return false;
    },
    updateRoutes : function(){
      $("#favorite-routes").html("");
      var id;
      for(var i in station.favorite.routeList){
        id = station.favorite.routeList[i].route_id;
        $('#favorite-routes').append(
          '<li class="border clear-both" value="' + i + '" style="height:4em; width:auto; padding: 0.5em 0 0.5em 0;">' +
            '<div class="float-left clear-both" >'+
              '<strong class="float-left oneliner">' + station.favorite.routeList[i].name.substring(0,40) + (station.favorite.routeList[i].name.length > 40 ? '...' : '') + '</strong>' +
              '<button class="float-right" style="border:none; background:transparent; padding: 0.4em; color:black;" onclick="station.favorite.deleteRoute(this)">X</button>' +
              '<br />'+
              '<span>' + station.favorite.routeList[i].distance + 'km </span>'+
              '<span>' + station.favorite.routeList[i].route.waypoints.length + ' rutepunkter</span>'+
              '<button class="float-right nav-here" onclick="station.favorite.restoreRoute(this)" value="">Ta meg hit</button>' +
              '<div class="clear-both">' +//read-more
              '</div>' +
            '</div>' +
        '</li>');
      }
      station.favorite.searchRoute();
    },
    updateStations : function(){
      $("#favorite-stations").html("");
      var id;
      for(var i = 0, x = station.favorite.stationList.length; i < x; i++){
        id = station.favorite.stationList[i].station_id;
        $('#favorite-stations').append(
          '<li class="border" value="' + id + '" style="height:6em; width:auto; padding: 0.5em 0 0.5em 0;">' +
            '<img class="cover-third float-left img-height-4em" src=\"' + station.getImage(id) + '\"/>' +
            '<div class="chargePointColor" style="height:6em;background-color:' +
            //TODO: Num of faulty gjelder kun for den siste som var lagt til av markers!
              (station.conns.numFaulty / station.list[id].csmd.Number_charging_points === 1 ? "red" : (station.list[id].attr.st[21].attrvalid === "1" ? (station.occupiedStatus(id) < station.occupiedLimit ? "yellow":"lightgreen") : "blue")) + ';">' +
              "<button style='border:none; background:transparent; padding: 0.4em; color:white;' onclick=\"station.favorite.deleteStation(this)\">X</button>" +
            '</div>'+
            '<div class="float-left" style="padding-left:1em; width:calc(50% - 1em);">'+
              '<strong class="float-left"><a class="station oneliner" style="padding-left:0;" href="#" value="' + id + '">' + station.list[id].csmd.name.substring(0,28) + (station.list[id].csmd.name.length > 28 ? '...' : '') + '</a></strong><br />'+
              '<span class="float-left"><strong>Adresse: </strong> '+ station.list[id].csmd.Street +" " + station.list[id].csmd.House_number + ", " /*TODO: fix+ station.list[id].csmd.Zipcode + ' '*/ + station.list[id].csmd.City.substring(0,1) + station.list[id].csmd.City.toLowerCase().substring(1) +'</span>' +
              '<span class="float-left"><strong>Distanse: </strong>' + nearby.compareDistance(app.gps.geopos, station.list[id].csmd.Position.replace(/[()]/g,"").split(",")).toFixed(2)+ 'km </span>' +
              '<button class="float-right nav-here" onclick="navigation.fromUser(this)" value="'+ station.list[id].csmd.Position.replace(/[()]/g,"").split(",") +'">Ta meg hit</button>' +
              '<div class="clear-both">' +//read-more
              '</div>' +
            '</div>' +
          '</li>');
      }
      station.bindStationNames();
    },
    restoreRoute : function(element){
      var r_id = $(element).parent().parent().attr('value'),
        content = '',
        id,
        isLive;
      $('#nav-start-pos').val(station.favorite.routeList[r_id].route.start);
      navigation.waypoints = station.favorite.routeList[r_id].route.waypoints;
      navigation.waypointsData = station.favorite.routeList[r_id].route.waypointsData;
      $('#nav-end-pos').val(station.favorite.routeList[r_id].route.end);

      for(var i = 0, x = navigation.waypoints.length; i < x; i++){
        if(navigation.waypointsData[i].isStation){
          id = navigation.waypointsData[i].station_id;
          isLive = navigation.waypointsData[i].isLive;
          content +=
            "<div class='route-element station-"+ id +"'>" +
              "<img class='cover-third float-left' src=\"" + station.getImage(id) + "\"/>" +
              "<div class='float-left' style='width:calc( 66% - 1.1em );'>"+
                "<a value='" + id + "' class='station'>" + station.list[id].csmd.name + "</a>" +
              "</div>"+
              "<div class='markerColor' style='background-color:"+ (station.conns.numFaulty / station.list[id].csmd.Number_charging_points === 1 ? "red" : (isLive ? (station.occupiedStatus(id) < station.occupiedLimit ? "yellow":"lightgreen") : "blue")) + ";'>" +
                "<button style='border:none; background:transparent; padding: 0.4em; color:white;' onclick=\"station.removeWaypoint(this)\">X</button>" +
              "</div>"+
              "<button onclick='app.menu.readMore(this)'>Vis mer</button>"+
              "<div class='read-more clear-both'>" +
                station.conns.getString(id,station.list[id].attr.st[21].attrvalid === "1") +
              "</div>" +
            "</div>";
        }else{
          content += "<div class='route-element'>" +
            "<div class='float-left' style='width:calc( 66% - 1.1em );'>"+
              navigation.waypointsData[i].address +
            "</div>"+
            "<div><button onclick=\"station.removeWaypoint(this)\">X</button></div>" +
          "</div>";
        }
      }
      $('#waypoint-list').html(content);
      navigation.build();
    }
  },
  updateCarList : function(){
    //Adding elements to the car list dropdown
    var txt = '<option value="0">Vis alle ladere</option>';
    for(var car in station.conns.carModels){
      txt += '<option value="'+car+'">' + car + '</option>';
    }
    $('#select-car').html(txt);
  },
  generateMarker : function(id){
    try{
      if($('#select-car').val() !=0){
        station.conns.list.length = 0;
        if(station.getCarMatch(id)){
          station.addMarker(station.list[id].csmd.Number_charging_points, id);
        }
      }else{
        station.addMarker(station.list[id].csmd.Number_charging_points, id);
      }
    }catch(err){console.log(err);}
  },
  generateMarkers : function(){
    $('#download-progression').show();
    if($('#select-car').val() !=0){
      station.user.carConns = station.conns.carModels[$('#select-car').val()];
    }
    station.deleteMarkers();
    for(var id in station.list){
      station.generateMarker(id);
    }
    $('#download-progression').hide();
    station.hasDownloaded = true;

    if(station.markerClusterer === null){
      station.markerClusterer = new MarkerClusterer(app.map, station.markers, app.options.markerCluster);
    }else{
      station.markerClusterer.clearMarkers();
      station.markerClusterer.addMarkers(station.markers);
    }
    $('#download-progression').hide();
    app.download.hasDownloaded = true;
    if(!app.device.isMobile){
      nearby.update();
    }
    station.favorite.updateStations();
  },
  deleteMarkers : function(){
    //Memory managenent
    app.setMapOnAll(null);
    station.markerListeners.length = 0;
    station.infoWindows.length = 0;
    nearby.chargers.length = 0;
    station.markers = [];
  },
  getCarMatch : function(id){
    var match = false,
      connType,
      hasFastCharge_temp = false,
      isFaulty = false;
    station.hasFastCharge = false;
    station.conns.numFaulty = 0;
    for(var c in station.list[id].attr.conn){
      //Checking if any connection ports match the user prefs
      try{
        if($('#select-car').val() !== '0' && !match && app.inArray(station.list[id].attr.conn[c][4].attrvalid, station.user.carConns) && (station.selectedCapacity <= station.conns.capacity[station.list[id].attr.conn[c][5].attrvalid].kW)){
          match = true;
          break;
        }else if($('#select-car').val() === '0' && !match && (station.selectedCapacity <= station.conns.capacity[station.list[id].attr.conn[c][5].attrvalid].kW)){
        //If no car or type is selected
          match = true;
          break;
        }if(station.list[id].attr.conn[c][9] !== undefined && station.list[id].attr.conn[c][9].attrvalid === '1'){//Is a faulty connector
          station.conns.numFaulty++;
        //For the markers, to indicate if a id has a fast charger or not!
        }if(!hasFastCharge_temp && (station.fastCharge <= station.conns.capacity[station.list[id].attr.conn[c][5].attrvalid].kW)){
          station.hasFastCharge = true;
        }
        station.conns.list.push(station.list[id].attr.conn[c]);
      }catch(e){console.log(e);}
    }
    return match;
  },
  //TODO: station.getImage
  getImage : function(id){
    try{
      return (/kommer/i.test(station.list[id].csmd.Image.toLowerCase()) || /no.image.svg/i.test(station.list[id].csmd.Image.toLowerCase())? 'icons/logo.svg' : 'http://www.nobil.no/img/ladestasjonbilder/'+ station.list[id].csmd.Image);
    }catch(e){
      console.log("Failed for: " + id + " MSG: " + e);
    }
  },
  getMarkerIcon : function(numOfPorts, id, isLive){
    //Changing the color of the marker based on if it has live status or not.
    return 'icons/' + (
      isLive ? (station.hasFastCharge ?
        (station.conns.numFaulty/numOfPorts === 1 ? 'marker_red_v2' :(
            station.occupiedStatus(id) > station.occupiedLimit ? 'marker_green_v2' : 'marker_yellow_v2')
        ): (
          station.conns.numFaulty/numOfPorts === 1 ? 'marker_red_v3' :(
            station.occupiedStatus(id) > station.occupiedLimit ? 'marker_green_v3' : 'marker_yellow_v3')
          )
        )
        :(
          station.hasFastCharge ? (station.conns.numFaulty/numOfPorts === 1 ? 'marker_red_v2' :'marker_blue_v2'):(
            station.conns.numFaulty/numOfPorts === 1 ? 'marker_red_v3' :'marker_blue_v3'
          )
        )
      ) + '.svg';
  },
  addMarker : function(numOfPorts, id){
    //Adding markers
    var pos = station.list[id].csmd.Position.replace(/[()]/g,"").split(","),
      isLive = station.list[id].attr.st[21].attrvalid === "1",
      maxWidth = (app.device.isMobile?500:500),
      maxHeight = (app.device.isMobile?300:500),
      infowindow = new google.maps.InfoWindow({
        content: '',
        maxWidth: maxWidth,
        maxHeight: maxHeight
      }),
      markerIcon = {
        url: station.getMarkerIcon(numOfPorts, id, isLive),
        anchor : new google.maps.Point(16, 51),
        origin : new google.maps.Point(0, 0),
        scaledSize: new google.maps.Size(32, 51),
        size : new google.maps.Size(64, 64)
      },
      marker = new google.maps.Marker({
        position:{lat: parseFloat(pos[0]), lng: parseFloat(pos[1])},
        icon: markerIcon,
        optimized : false,
        map: app.map,
        title: station.list[id].csmd.name
      });

    station.infoWindows.push(infowindow);
    station.markerListeners.push(google.maps.event.addListener(infowindow, 'domready', function() {
      var iwOuter = $('.gm-style-iw'),
        iwCloseBtn,
        iwBackground = iwOuter.prev();
      // Remove the background shadow DIV
      iwBackground.children(':nth-child(2)').css({'display' : 'none'});
      // Remove the white background DIV
      iwBackground.children(':nth-child(4)').css({'display' : 'none'});

      iwCloseBtn = iwOuter.next();
      iwCloseBtn.css({
        opacity: '1',
        right: '52px',
        top: '16px'
      });
      iwCloseBtn.addClass('iw-close-btn');
      iwCloseBtn.mouseout(function(){
        $(this).css({opacity: '1'});
      });
    }));

    //Making it so that the popups disappear upon click outside box
    station.markerListeners.push(google.maps.event.addListener(app.map, 'click', function() {
      if (infowindow) {
        infowindow.close();
      }
    }));
    station.markerListeners.push(marker.addListener('click', function() {
      station.visibleInfoWindowID = id;
      for(iw in station.infoWindows){
        station.infoWindows[iw].setContent(null);
        station.infoWindows[iw].close();
      }
      infowindow.open(app.map, marker);

      infowindow.setContent(station.getInfoWindowContent(id, isLive));
    }));
    station.markers[id] = marker;
    station.list[id].markerID = id;//station.markers.length-1;

    //Building closest charging stations list
    try{
      if(nearby.compareDistance(app.gps.geopos, pos) <= 10){
        nearby.chargers[station.list[id].csmd.id] = station.list[id];
        nearby.chargers[station.list[id].csmd.id]["distance"] = nearby.compareDistance(app.gps.geopos, pos);
      }
    }catch(e){console.log(e);}
  },
  /*
   *  along a given route
   */
  addWaypoint : function(id){
    try{
      var disPos = station.list[id].csmd.Position.replace(/[()]/g,"").split(","),
        isLive = station.list[id].attr.st[21].attrvalid === "1";
      navigation.waypointsData.push(
        {
          isStation : true,
          station_id : id,
          isLive : isLive
        });
      navigation.waypoints.push(
        {location: new google.maps.LatLng(disPos[0],disPos[1])}
      );

        $('#waypoint-list').append(
          "<div class='route-element station-"+ id +"'>" +
            "<img class='cover-third float-left' src=\"" + station.getImage(id) + "\"/>" +
            "<div class='float-left' style='width:calc( 66% - 1.1em );'>"+
              "<a value='" + id + "' class='station'>" + station.list[id].csmd.name + "</a>" +
            "</div>"+
            "<div class='markerColor' style='background-color:"+ (station.conns.numFaulty / station.list[id].csmd.Number_charging_points === 1 ? "red" : (isLive ? (station.occupiedStatus(id) < station.occupiedLimit ? "yellow":"lightgreen") : "blue")) + ";'>" +
              "<button style='border:none; background:transparent; padding: 0.4em; color:white;' onclick=\"station.removeWaypoint(this)\">X</button>" +
            "</div>"+
            "<button onclick='app.menu.readMore(this)'>Vis mer</button>"+
            "<div class='read-more clear-both'>" +
              station.conns.getString(id,station.list[id].attr.st[21].attrvalid === "1") +
            "</div>" +
          "</div>"
        );

      //Refreshing the route if it's active
      if($('#nav-start-pos').val() !== "" && $('#nav-end-pos').val() !== ""){
        navigation.build();
      }
    }catch(e){console.log(e);}
    station.bindStationNames();
  },
  removeWaypoint : function(element){
    var parent = $(element).parent().parent(),
      index = $(parent).index();

    //Removing the waypoint from the html
    $(parent).remove();
    //Removing elements from waypoints and moving the other elements down in the array.
    if(index > -1){
      navigation.waypoints.splice(index, 1);
      navigation.waypointsData.splice(index, 1);
    }

    //Refreshing the route if it's active
    if($('#nav-start-pos').val() !== "" && $('#nav-end-pos').val() !== ""){
      navigation.build();
    }
  },
  occupiedStatus : function(id){
    return parseFloat(station.list[id].csmd.Available_charging_points) / parseFloat(station.list[id].csmd.Number_charging_points);
  },
  /*
   * A method for generating the content of a infowindow
   */
  getInfoWindowContent : function(id, isLive) {
    if($('#select-car').val() !=0){
      station.user.carConns = station.conns.carModels[$('#select-car').val()];
    }
    //Showing a info windows when you click on the marker
    return '<div id="station-tooltip">'+
      '<div id="topBox">'+
      '</div>'+
      '<div id="secondRow">' +
        '<span class="tooltip"><img class="img-to-load" alt="' + station.list[id].csmd.name + '" src="'+ station.getImage(id) + '"/><img class="tooltiptext" src="' + station.getImage(id) + '"/></span>' +
        '<div id="placeNameIcons" style="color:blue;">'+
          '<h3 class="padding-1eml">'+ station.list[id].csmd.name +'</h3>' +
        '</div>'+
        '<div class="markerColor" style="background-color:'+ (station.conns.numFaulty / station.list[id].csmd.Number_charging_points === 1 ? 'red' : (isLive ? (station.occupiedStatus(id) < station.occupiedLimit ? 'yellow':'lightgreen') : 'blue')) + ';">'+
        '</div>'+
      '</div>'+

      '<div id="secondContainer">'+
        '<div id="infoLeft" class="padding-1eml">' +
          (isLive ? '<p><strong>Sist oppdatert</strong> ' + station.list[id].csmd.Updated + '</p>' : '') +
          (isLive ? '<p><strong>Tilgjengelighet</strong> '+ station.attr.st[2][station.list[id].attr.st[2].attrvalid] + '</p>' : '') +
          '<p><strong>Parkerings avgift:</strong> ' + (station.list[id].attr.st[7].attrvalid === '1' ? 'Ja' : 'Nei') + '</p>' +
          (isLive ? '<p><strong>Lokasjon:</strong> ' + station.attr.st[3][station.list[id].attr.st[3].attrvalid] + '</p>' : '') +
          '<p><strong>Adresse:</strong> '+ station.list[id].csmd.Street.replace('\r\n','<br />') +' ' + station.list[id].csmd.House_number.replace('\r\n','<br />') + ', ' + station.list[id].csmd.Zipcode.replace('\r\n','<br />') + ' ' + station.list[id].csmd.City.replace('\r\n','<br />') +'</p>'+
          '<p><strong>Lokasjonsbeskrivelse:</strong> '+ station.list[id].csmd.Description_of_location +'</p>' +
          '<p><strong>Eier:</strong> ' + station.list[id].csmd.Owned_by.replace('\r\n','<br />') +'</p>' +
          '<p><strong>Kommentarer:</strong> '+ station.list[id].csmd.User_comment.replace('\r\n','<br />')+'</p>' +
          (station.list[id].csmd.Contact_info !== null ? '<p><strong>Kontakt info:</strong> '+ station.list[id].csmd.Contact_info.replace('\r\n','<br />')+'</p>' : '') +
        '</div>'+
        '<div id="chargingPoints">'+
          '<p style="border-bottom:1px solid gray;margin-bottom:0;"><strong>Ladepunkter:</strong> '+ station.list[id].csmd.Number_charging_points + ' </p>' +
          '<div> '+
            station.conns.getString(id, isLive) +
          '</div>' +
        '</div>'+
      '</div>'+

      '<div id="lowerContainer" class="clear-both">'+
        '<button class="nav-add tooltip" onclick="station.addWaypoint(\'' + id + '\')" ><p class="tooltiptext">Legg til stasjon i rute</p>Legg til i rute</button>' +
        '<button class="nav-here tooltip" onclick="navigation.fromUser(this)" value="'+ station.list[id].csmd.Position.replace(/[()]/g,"") +'"><p class="tooltiptext">Naviger hit</p>Naviger hit</button>'+
        (app.loggedIn ? '<button class="float-left tooltip" onclick="station.favorite.addStation("' + id + '")" ><p class="tooltiptext">Lagre stasjon</p>Lagre stasjon</button>' : '') +
      "</div>"+
    "</div>";
  },
  showHideMarkers : function(ele){
    var visible = true;
    for(var marker in station.markers)
      station.markers[marker].setVisible(!station.markers[marker].getVisible());
    $(ele).html(!visible ? 'Skjul markører' : 'Vis markører');
  },
  init : function() {
    station.conns.carModels = {
      'Nissan Leaf' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'BMW i3' : station.conns.types.schuko.concat(station.conns.types.type2, station.conns.types.combo),
      'Buddy' : station.conns.types.schuko,
      'Citroën Berlingo' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Citroën C-ZERO' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Ford Focus Electric' : station.conns.types.schuko.concat(station.conns.types.schuko,station.conns.types.type1, station.conns.types.type2),
      'Kia Soul Electric' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Mercedes B-klasse ED' : station.conns.types.schuko.concat(station.conns.types.type2),
      'Mitsubishi i-MIEV' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Nissan e-NV200/Evalia' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Peugeot iOn' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Peugeot Partner' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2, station.conns.types.chademo),
      'Renault Kangoo ZE' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2),
      'Renault Twizy' : station.conns.types.schuko,
      'Renault Zoe' : station.conns.types.schuko.concat(station.conns.types.type2),
      'Reva' : station.conns.types.schuko,
      'Tesla Model S' : station.conns.types.schuko.concat(station.conns.types.type2, station.conns.types.ind3pin, station.conns.types.ind5pin, station.conns.types.teslaModelS),
      'Tesla Roadster' : station.conns.types.schuko.concat(station.conns.types.teslaRoadster),
      'Think' : station.conns.types.schuko,
      'VW e-Golf' : station.conns.types.schuko.concat(station.conns.types.type2, station.conns.types.combo),
      'VW e-up!' : station.conns.types.schuko.concat(station.conns.types.type1, station.conns.types.type2),
    }
  }
};
