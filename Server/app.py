import pickle
import json
import numpy as np
import os
from flask import Flask, request, jsonify, render_template
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ================== Model Utilities ==================

__locations = None
__data_columns = None
__model = None

def get_estimated_price(location, total_sqft, bhk, bath):
    logger.debug(f"Estimating price for location={location}, total_sqft={total_sqft}, bhk={bhk}, bath={bath}")
    try:
        loc_index = __data_columns.index(location.lower())
    except ValueError:
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
    logger.info("Loading saved artifacts...start")
    global __data_columns, __locations, __model

    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    columns_file = os.path.join(artifacts_dir, "columns.json")
    model_file = os.path.join(artifacts_dir, "banglore_home_prices_model.pickle")

    if not os.path.exists(columns_file):
        logger.error(f"Columns file not found: {columns_file}")
        raise FileNotFoundError(f"Columns file not found: {columns_file}")
    if not os.path.exists(model_file):
        logger.error(f"Model file not found: {model_file}")
        raise FileNotFoundError(f"Model file not found: {model_file}")

    with open(columns_file, "r") as f:
        __data_columns = json.load(f)['data_columns']
        __locations = __data_columns[3:]  # First 3 columns are sqft, bath, bhk

    with open(model_file, "rb") as f:
        __model = pickle.load(f)

    logger.info("Loading saved artifacts...done")

# ================== Flask App ==================

# Updated paths to simpler structure
app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def home():
    logger.debug("Serving home page")
    return render_template('app.html')

@app.route('/get_location_names', methods=['GET'])
def location_names():
    logger.debug("Received request for /get_location_names")
    if __locations is None:
        logger.error("Locations not loaded")
        return jsonify({"error": "Locations not loaded. Check server configuration."}), 500
    response = jsonify({'locations': get_location_names()})
    response.headers.add('Access-Control-Allow-Origin', '*')
    logger.debug("Sending locations response")
    return response

@app.route('/predict_home_price', methods=['POST'])
def predict_home_price():
    logger.debug(f"Received request for /predict_home_price with data: {request.form}")
    try:
        total_sqft = float(request.form['total_sqft'])
        location = request.form['location']
        bhk = int(request.form['bhk'])
        bath = int(request.form['bath'])

        # Input validation
        if total_sqft < 500 or total_sqft > 10000:
            logger.warning(f"Invalid total_sqft: {total_sqft}")
            return jsonify({"error": "Square footage must be between 500 and 10,000"}), 400
        if bhk < 1 or bhk > 5:
            logger.warning(f"Invalid BHK: {bhk}")
            return jsonify({"error": "BHK must be between 1 and 5"}), 400
        if bath < 1 or bath > 5:
            logger.warning(f"Invalid bathrooms: {bath}")
            return jsonify({"error": "Bathrooms must be between 1 and 5"}), 400
        if location.lower() not in [loc.lower() for loc in __locations]:
            logger.warning(f"Invalid location: {location}")
            return jsonify({"error": f"Invalid location. Choose from: {', '.join(__locations)}"}), 400
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Invalid input: {str(e)}")
        return jsonify({"error": "Invalid input. Please check all fields."}), 400

    estimated_price = get_estimated_price(location, total_sqft, bhk, bath)
    response = jsonify({'estimated_price': estimated_price})
    response.headers.add('Access-Control-Allow-Origin', '*')
    logger.debug(f"Sending estimated price: {estimated_price}")
    return response

# Optional: Add a route to debug static file serving
@app.route('/debug_static')
def debug_static():
    static_files = os.listdir(app.static_folder)
    return jsonify({"static_files": static_files, "static_folder": app.static_folder})

# ================== Run Server ==================

if __name__ == "__main__":
    logger.info("Starting Python Flask Server For Home Price Prediction...")
    try:
        load_saved_artifacts()
    except Exception as e:
        logger.error(f"Failed to load artifacts: {str(e)}")
        raise
    if __model is None:
        logger.error("Model failed to load. Check artifact files.")
        raise RuntimeError("Model failed to load")
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)), debug=True)