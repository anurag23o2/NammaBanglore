import pickle
import json
import numpy as np
import os
from flask import Flask, request, jsonify, render_template

# ================== Model Utilities ==================

__locations = None
__data_columns = None
__model = None

def get_estimated_price(location, total_sqft, bhk, bath):
    try:
        loc_index = __data_columns.index(location.lower())
    except:
        loc_index = -1

    x = np.zeros(len(__data_columns))
    x[0] = total_sqft
    x[1] = bath
    x[2] = bhk
    if loc_index >= 0:
        x[loc_index] = 1

    return round(__model.predict([x])[0], 2)

def get_location_names():
    return __locations

def load_saved_artifacts():
    print("loading saved artifacts...start")
    global __data_columns
    global __locations
    global __model

    # Relative path (safe for Render deployment)
    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')

    columns_file = os.path.join(artifacts_dir, "columns.json")
    model_file = os.path.join(artifacts_dir, "banglore_home_prices_model.pickle")

    if not os.path.exists(columns_file) or not os.path.exists(model_file):
        print("Required artifact files not found.")
        return

    with open(columns_file, "r") as f:
        __data_columns = json.load(f)['data_columns']
        __locations = __data_columns[3:]  # first 3 columns are sqft, bath, bhk

    with open(model_file, "rb") as f:
        __model = pickle.load(f)

    print("loading saved artifacts...done")

# ================== Flask App ==================

app = Flask(__name__, template_folder='Client', static_folder='Client')

@app.route('/')
def home():
    return render_template('app.html')

@app.route('/get_location_names', methods=['GET'])
def location_names():
    response = jsonify({
        'locations': get_location_names()
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/predict_home_price', methods=['POST'])
def predict_home_price():
    try:
        total_sqft = float(request.form['total_sqft'])
        location = request.form['location']
        bhk = int(request.form['bhk'])
        bath = int(request.form['bath'])
    except (ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400

    estimated_price = get_estimated_price(location, total_sqft, bhk, bath)
    response = jsonify({
        'estimated_price': estimated_price
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# ================== Run Server ==================

if __name__ == "__main__":
    print("Starting Python Flask Server For Home Price Prediction...")
    load_saved_artifacts()
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))

