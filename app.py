import os
from waitress import serve # type: ignore
from flask import Flask, render_template, request
from datetime import datetime

app = Flask(__name__)

# Locations (can replace with real encoding)
locations = ['Region A','Region B','Region C','Region D']

# History storage
history = []

# Rule-based alert classifier
def classify_alert_with_probabilities(features):
    mag, depth, latitude, longitude, nst, gap, dmin, rms, magError, depthError, magNst, loc_enc = features
    score = 0
    if mag >= 8.0: score += 5
    elif mag >= 7.0: score += 4
    elif mag >= 6.0: score += 3
    elif mag >= 5.0: score += 2
    elif mag >= 4.0: score += 1

    if depth < 10: score += 3
    elif depth < 30: score += 2

    if nst < 10: score += 2
    elif nst < 20: score += 1

    if gap > 180: score += 2
    elif gap > 120: score += 1

    if dmin < 0.1: score += 1
    if rms > 1.5: score += 1
    if magError > 0.3: score += 1
    if depthError > 20: score += 1
    if magNst < 5: score += 1

    if score >= 10: alert = 'Red'
    elif score >= 6: alert = 'Orange'
    elif score >= 3: alert = 'Yellow'
    else: alert = 'Green'

    prob = {'Green':0,'Yellow':0,'Orange':0,'Red':0}
    if alert=='Red':
        prob['Red']=min(1.0,0.7+0.03*(score-10))
        prob['Orange']=0.15; prob['Yellow']=0.1; prob['Green']=0.05
    elif alert=='Orange':
        prob['Orange']=min(1.0,0.6+0.05*(score-6))
        prob['Yellow']=0.25; prob['Red']=0.1; prob['Green']=0.05
    elif alert=='Yellow':
        prob['Yellow']=min(1.0,0.6+0.05*(score-3))
        prob['Green']=0.3; prob['Orange']=0.1; prob['Red']=0.0
    else:
        prob['Green']=min(1.0,0.7+0.05*score)
        prob['Yellow']=0.3; prob['Orange']=0.0; prob['Red']=0.0

    confidence = prob[alert]
    return alert, confidence, prob

# Home route handles GET and POST
@app.route('/', methods=['GET','POST'])
def index():
    if request.method == 'POST':
        # Get form inputs
        magnitude = float(request.form.get('magnitude',0))
        depth = float(request.form.get('depth',0))
        latitude = float(request.form.get('latitude',0))
        longitude = float(request.form.get('longitude',0))
        loc_enc = request.form.get('loc_enc','Region A')
        nst = int(request.form.get('nst',10))
        gap = float(request.form.get('gap',120))
        dmin = float(request.form.get('dmin',0.1))
        rms = float(request.form.get('rms',1.0))
        magError = float(request.form.get('magError',0.2))
        depthError = float(request.form.get('depthError',5))
        magNst = int(request.form.get('magNst',5))

        features = [magnitude, depth, latitude, longitude, nst, gap, dmin, rms, magError, depthError, magNst, loc_enc]
        alert, confidence, prob = classify_alert_with_probabilities(features)

        # Save prediction in history
        history.append({
            'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'magnitude': magnitude,
            'depth': depth,
            'latitude': latitude,
            'longitude': longitude,
            'loc_enc': loc_enc,
            'nst': nst,
            'gap': gap,
            'dmin': dmin,
            'rms': rms,
            'magError': magError,
            'depthError': depthError,
            'magNst': magNst,
            'alert': alert,
            'confidence': confidence,
            'prob': prob
        })

        # Summary for alert counts
        summary = {'Green':0,'Yellow':0,'Orange':0,'Red':0}
        for h in history:
            summary[h['alert']] += 1

        return render_template('result.html',
            alert=alert, confidence=confidence, prob=prob,
            magnitude=magnitude, depth=depth, latitude=latitude, longitude=longitude,
            loc_enc=loc_enc, nst=nst, gap=gap, dmin=dmin, rms=rms,
            magError=magError, depthError=depthError, magNst=magNst,
            summary=summary
        )
    else:
        # Show index page
        summary = {'Green':0,'Yellow':0,'Orange':0,'Red':0}
        return render_template('index.html', history=history, summary=summary, locations=locations)



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    serve(app, host="0.0.0.0", port=port)
