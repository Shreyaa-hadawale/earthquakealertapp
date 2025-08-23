document.addEventListener("DOMContentLoaded", function() {

    var historyData = [
        {% for h in history %}
        {mag: {{h['magnitude']}}, depth: {{h['depth']}}, lat: {{h['latitude']}}, lon: {{h['longitude']}}, alert: "{{h['alert']}}"},
        {% endfor %}
    ];

    // ---------- Scatter Plot ----------
    var scatterCtx = document.getElementById('scatterChart').getContext('2d');
    var scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Magnitude vs Depth',
                data: historyData.map(d => ({x:d.mag, y:d.depth, alert:d.alert})),
                backgroundColor: historyData.map(d=>{
                    if(d.alert=='Red') return '#ff4d4d';      // brighter for dark mode
                    if(d.alert=='Orange') return '#ffa500';
                    if(d.alert=='Yellow') return '#ffff66';
                    return '#66ff66';
                }),
                pointRadius: 5
            }]
        },
        options: { 
            responsive: false, 
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#333',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales:{
                x:{ 
                    title:{display:true,text:'Magnitude', color:'#e0e0e0'},
                    ticks:{ color:'#e0e0e0', stepSize:0.5 },
                    grid:{ color:'#444' }
                }, 
                y:{ 
                    title:{display:true,text:'Depth (km)', color:'#e0e0e0'}, 
                    reverse:true,
                    ticks:{ color:'#e0e0e0' },
                    grid:{ color:'#444' }
                }
            }
        }
    });

    // ---------- Trend Bar Chart ----------
    var alertCounts = {Red:0, Orange:0, Yellow:0, Green:0};
    historyData.forEach(d=>alertCounts[d.alert]++);
    var trendCtx = document.getElementById('trendChart').getContext('2d');
    var trendChart = new Chart(trendCtx,{
        type:'bar',
        data:{
            labels:['Red','Orange','Yellow','Green'],
            datasets:[{
                label:'Alert Count',
                data:[alertCounts.Red, alertCounts.Orange, alertCounts.Yellow, alertCounts.Green],
                backgroundColor:['#ff4d4d','#ffa500','#ffff66','#66ff66']
            }]
        },
        options:{
            responsive:false,
            plugins:{
                legend:{ display:false },
                tooltip:{
                    backgroundColor:'#333',
                    titleColor:'#fff',
                    bodyColor:'#fff'
                }
            },
            scales:{
                x:{ ticks:{ color:'#e0e0e0' }, grid:{ color:'#444' } },
                y:{ ticks:{ color:'#e0e0e0' }, grid:{ color:'#444' } }
            }
        }
    });

    // ---------- Map ----------
    var combinedMap = L.map('combinedMap').setView([0,0],2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(combinedMap);
    var markers = L.markerClusterGroup();

    function renderMap(data){
        markers.clearLayers();
        var heatPoints = [];
        data.forEach(d=>{
            var color = (d.alert=='Red')?'#ff4d4d':
                        (d.alert=='Orange')?'#ffa500':
                        (d.alert=='Yellow')?'#ffff66':'#66ff66';
            var m = L.circleMarker([d.lat, d.lon], {
                radius: 6,
                color: color,
                fillColor: color,
                fillOpacity: 0.8
            }).bindPopup('Magnitude: '+d.mag+'<br>Depth: '+d.depth+' km<br>Alert: '+d.alert);
            markers.addLayer(m);
            heatPoints.push([d.lat,d.lon,d.mag]);
        });
        combinedMap.addLayer(markers);
        var heat = L.heatLayer(heatPoints,{
            radius: 25,
            blur: 15,
            maxZoom: 8,
            gradient:{0.4:'blue',0.65:'lime',1:'red'}
        });
        combinedMap.addLayer(heat);
    }

    renderMap(historyData);

    // ---------- Filter Function ----------
    document.getElementById('applyFilter').addEventListener('click', function(){
        var selectedAlert = document.getElementById('filterAlert').value;
        var minMag = parseFloat(document.getElementById('filterMagMin').value);
        var maxMag = parseFloat(document.getElementById('filterMagMax').value);

        var filtered = historyData.filter(d=>{
            var alertCond = (selectedAlert=='All') ? true : d.alert==selectedAlert;
            var minCond = isNaN(minMag)? true : d.mag >= minMag;
            var maxCond = isNaN(maxMag)? true : d.mag <= maxMag;
            return alertCond && minCond && maxCond;
        });

        // Update Table
        var tbody = document.getElementById('historyBody');
        tbody.innerHTML = '';
        filtered.forEach((d,i)=>{
            var tr = document.createElement('tr');
            tr.innerHTML = `<td>${i+1}</td>
                            <td>${d.mag}</td>
                            <td>${d.depth}</td>
                            <td>${d.lat}</td>
                            <td>${d.lon}</td>
                            <td><span class="badge ${
                                d.alert=='Red'? 'bg-danger' :
                                d.alert=='Orange'? 'bg-warning text-dark' :
                                d.alert=='Yellow'? 'bg-info text-dark' : 'bg-success'
                            }">${d.alert}</span></td>`;
            tbody.appendChild(tr);
        });

        // Update Scatter
        scatterChart.data.datasets[0].data = filtered.map(d=>({x:d.mag,y:d.depth,alert:d.alert}));
        scatterChart.data.datasets[0].backgroundColor = filtered.map(d=>{
            if(d.alert=='Red') return '#ff4d4d';
            if(d.alert=='Orange') return '#ffa500';
            if(d.alert=='Yellow') return '#ffff66';
            return '#66ff66';
        });
        scatterChart.update();

        // Update Trend
        var newCounts = {Red:0, Orange:0, Yellow:0, Green:0};
        filtered.forEach(d=>newCounts[d.alert]++);
        trendChart.data.datasets[0].data = [newCounts.Red,newCounts.Orange,newCounts.Yellow,newCounts.Green];
        trendChart.update();

        // Update Map
        renderMap(filtered);
    });

});
