/**
 * Created by jonas on 19.03.16.
 */
// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

var elevation = {
    service: null,
    path: [],
    displayElevation: function (path, elevator) {
        elevationPath.length = 0;
        for (var i = 0; i < path.legs.length; i++) {
            //The start position
            if (i == 0)
                elevationPath.push(path.legs[i].start_location);

            //Looping through points
            for (var s in path.legs[i].steps) {
                //Grabbing the first element, so that we don't overload the elevtion API with points
                elevationPath.push(path.legs[i].steps[s].lat_lngs[0]);
            }
            //The final destination
            if (i == path.legs.length - 1)
                elevationPath.push(path.legs[i].end_location);
        }
        elevator.getElevationAlongPath({
            'path': elevationPath,
            'samples': 256
        }, plotElevation);
    },
    plotElevation: function (elevations, status) {
        var chartDiv = document.getElementById('elevation-chart');
        if (status !== google.maps.ElevationStatus.OK) {
            chartDiv.innerHTML = "Request failed because" + status;
            return;
        }
        var chart = new google.visualization.ColumnChart(chartDiv);
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Sample');
        data.addColumn('number', 'Elevation');
        for (var i = 0; i < elevations.length; i++) {
            data.addRow(['', elevations[i].elevation]);
        }

        chart.draw(data, {
            height: 150,
            legend: 'none',
            titleY: 'Elevation (m)'
        });
    }
};
