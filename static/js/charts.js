document.addEventListener('DOMContentLoaded', function(){

    // ----- Scatter Chart: Magnitude vs Depth -----
    var scatterCtx = document.getElementById('scatterChart').getContext('2d');
    var scatterData = {
        datasets: [
            {% for h in history %}
            {
                label: '{{ h.alert }}',
                data: [{x: {{ h.magnitude }}, y: {{ h.depth }}}],
                backgroundColor: '{{ "#ff4d4d" if h.alert=="Red" else "#ffa500" if h.alert=="Orange" else "#ffff66" if h.alert=="Yellow" else "#66ff66" }}',
                pointRadius: 5
            },
            {% endfor %}
        ]
    };

    var scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: scatterData,
        options: {
            responsive:true,
            maintainAspectRatio:false,
            plugins:{ legend:{labels:{color:'#fff'}} },
            scales:{
                x:{title:{display:true,text:'Magnitude',color:'#fff'}, ticks:{color:'#fff'}},
                y:{title:{display:true,text:'Depth (km)',color:'#fff'}, ticks:{color:'#fff'}}
            }
        }
    });

    // ----- Trend Chart: Alert Counts -----
    var trendCtx = document.getElementById('trendChart').getContext('2d');
    var trendData = {
        labels: ['Green','Yellow','Orange','Red'],
        datasets:[{
            label:'Alert Counts',
            data: [
                {{ alert_counts.get('Green',0) }},
                {{ alert_counts.get('Yellow',0) }},
                {{ alert_counts.get('Orange',0) }},
                {{ alert_counts.get('Red',0) }}
            ],
            backgroundColor:['#66ff66','#ffff66','#ffa500','#ff4d4d']
        }]
    };

    var trendChart = new Chart(trendCtx,{
        type:'bar',
        data:trendData,
        options:{
            responsive:true,
            maintainAspectRatio:false,
            plugins:{ legend:{display:false} },
            scales:{
                x:{ticks:{color:'#fff'}},
                y:{ticks:{color:'#fff'}}
            }
        }
    });

    // ----- Leaflet Heatmap / Map -----
    var combinedMap = L.map('combinedMap').setView([0,0],2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OSM'}).addTo(combinedMap);

    {% for h in history %}
    L.circleMarker([{{ h.latitude }}, {{ h.longitude }}],{
        radius:5,
        color:'{{ "#ff4d4d" if h.alert=="Red" else "#ffa500" if h.alert=="Orange" else "#ffff66" if h.alert=="Yellow" else "#66ff66" }}',
        fillOpacity:0.7
    }).addTo(combinedMap).bindPopup("Alert: {{ h.alert }}<br>Mag: {{ h.magnitude }}<br>Depth: {{ h.depth }}");
    {% endfor %}

});
