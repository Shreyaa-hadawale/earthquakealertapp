from flask import Flask, render_template, request
from datetime import datetime

app = Flask(__name__)

# Store history in memory
history = []

# Rule-based alert prediction
def predict_alert(form_data):
    try:
        mag = float(form_data.get('mag', 0))
        depth = float(form_data.get('depth', 0))
        latitude = float(form_data.get('latitude', 0))
        longitude = float(form_data.get('longitude', 0))
    except:
        mag = depth = latitude = longitude = 0

    score = 0

    # Magnitude
    if mag >= 8.0:
        score += 5
    elif mag >= 7.0:
        score += 4
    elif mag >= 6.0:
        score += 3
    elif mag >= 5.0:
        score += 2
    elif mag >= 4.0:
        score += 1

    # Depth
    if depth < 10:
        score += 3
    elif depth < 30:
        score += 2

    # Classification
    if score >= 10:
        alert = 'Red'
    elif score >= 6:
        alert = 'Orange'
    elif score >= 3:
        alert = 'Yellow'
    else:
        alert = 'Green'

    # Probability bars
    prob = {'Green': 0, 'Yellow': 0, 'Orange': 0, 'Red': 0}
    if alert == 'Red':
        prob['Red'] = 0.8
        prob['Orange'] = 0.15
        prob['Yellow'] = 0.05
    elif alert == 'Orange':
        prob['Orange'] = 0.7
        prob['Yellow'] = 0.2
        prob['Red'] = 0.1
    elif alert == 'Yellow':
        prob['Yellow'] = 0.6
        prob['Green'] = 0.4
    else:
        prob['Green'] = 0.9
        prob['Yellow'] = 0.1

    return alert, prob, latitude, longitude

# Routes
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    alert, prob, latitude, longitude = predict_alert(request.form)

    # Save to history
    history.append({
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'alert': alert,
        'latitude': latitude,
        'longitude': longitude
    })

    # Send last 10 alerts for trends
    recent_alerts = history[-10:]

    return render_template(
        'result.html',
        alert=alert,
        prob=prob,
        latitude=latitude,
        longitude=longitude,
        history=recent_alerts
    )

@app.route('/history', methods=['GET'])
def show_history():
    return render_template('history.html', history=history)

@app.route("/offline")
def offline():
    return render_template("offline.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



