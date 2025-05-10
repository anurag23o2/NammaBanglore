function getBathValue() {
    const uiBathrooms = document.getElementsByName("uiBathrooms");
    const checked = Array.from(uiBathrooms).find(radio => radio.checked);
    return checked ? parseInt(checked.value) : -1;
}

function getBHKValue() {
    const uiBHK = document.getElementsByName("uiBHK");
    const checked = Array.from(uiBHK).find(radio => radio.checked);
    return checked ? parseInt(checked.value) : -1;
}

function validateForm() {
    const sqft = document.getElementById("uiSqft").value;
    const location = document.getElementById("uiLocations").value;
    const bhk = getBHKValue();
    const bath = getBathValue();
    
    let isValid = true;
    let errorMessage = "";
    
    if (!sqft || isNaN(sqft) || sqft <= 0) {
        errorMessage = "Please enter a valid area in square feet";
        isValid = false;
    }
    if (sqft < 500 || sqft > 10000) {
        if (errorMessage) errorMessage += "<br>";
        errorMessage += "Area must be between 500 and 10,000 sq ft";
        isValid = false;
    }
    if (bhk === -1) {
        if (errorMessage) errorMessage += "<br>";
        errorMessage += "Please select number of bedrooms (BHK)";
        isValid = false;
    }
    if (bath === -1) {
        if (errorMessage) errorMessage += "<br>";
        errorMessage += "Please select number of bathrooms";
        isValid = false;
    }
    if (!location || location === "") {
        if (errorMessage) errorMessage += "<br>";
        errorMessage += "Please select a location";
        isValid = false;
    }
    
    return { isValid, errorMessage };
}

function showLoading() {
    const resultElement = document.getElementById("uiEstimatedPrice");
    resultElement.innerHTML = `
        <div class="loading">
            <i class="fas fa-sync fa-spin"></i>
            <span>Processing with AI...</span>
        </div>
    `;
}

function formatPrice(price) {
    if (price >= 100) {
        return (price/100).toFixed(2) + " Crore";
    } else {
        return price.toFixed(2) + " Lakh";
    }
}

function onClickedEstimatePrice() {
    console.log("Calculate Price clicked, validating form...");
    const validation = validateForm();
    if (!validation.isValid) {
        console.log("Validation failed:", validation.errorMessage);
        document.getElementById("uiEstimatedPrice").innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                ${validation.errorMessage}
            </div>
        `;
        return;
    }
    
    const sqft = document.getElementById("uiSqft");
    const bhk = getBHKValue();
    const bathrooms = getBathValue();
    const location = document.getElementById("uiLocations");
    
    showLoading();
    const url = "/predict_home_price";
    
    $.post(url, {
        total_sqft: parseFloat(sqft.value),
        bhk: bhk,
        bath: bathrooms,
        location: location.value
    }, function(data, status) {
        console.log("Success: predict_home_price", data);
        const estPrice = document.getElementById("uiEstimatedPrice");
        const formattedPrice = formatPrice(data.estimated_price);
        
        estPrice.innerHTML = `
            <div class="price-value">₹ ${formattedPrice}</div>
            <div class="price-details">
                <div class="detail">
                    <span class="detail-label">Area:</span>
                    <span class="detail-value">${sqft.value} sq ft</span>
                </div>
                <div class="detail">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${location.value}</span>
                </div>
            </div>
        `;
        
        estPrice.classList.add('price-updated');
        setTimeout(() => {
            estPrice.classList.remove('price-updated');
        }, 1000);
    }).fail(function(xhr, status, error) {
        console.error("Failed to predict price:", status, error);
        let errorMsg = "Unable to get price estimate. Please try again.";
        if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMsg = xhr.responseJSON.error;
        }
        document.getElementById("uiEstimatedPrice").innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                ${errorMsg}
            </div>
        `;
    });
}

function onPageLoad() {
    console.log("Starting onPageLoad...");
    const sqftInput = document.getElementById("uiSqft");
    if (sqftInput) {
        sqftInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    const url = "/get_location_names";
    $.get(url, function(data, status) {
        console.log("Success: get_location_names", data);
        if (data) {
            const locations = data.locations;
            const uiLocations = document.getElementById("uiLocations");
            $('#uiLocations').empty();
            
            const placeholderOpt = new Option("Choose a Location", "");
            placeholderOpt.disabled = true;
            placeholderOpt.selected = true;
            $('#uiLocations').append(placeholderOpt);
            
            locations.sort();
            for (let location of locations) {
                const opt = new Option(location);
                $('#uiLocations').append(opt);
            }
            
            const popularLocations = ["Electronic City", "Whitefield", "Indiranagar", "Koramangala", "HSR Layout"];
            $("#uiLocations option").each(function() {
                if (popularLocations.includes($(this).text())) {
                    $(this).attr("class", "popular-location");
                }
            });
        }
    }).fail(function(xhr, status, error) {
        console.error("Failed to load locations:", status, error);
        const uiLocations = document.getElementById("uiLocations");
        $('#uiLocations').empty();
        const placeholderOpt = new Option("Error loading locations", "");
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        $('#uiLocations').append(placeholderOpt);
        document.getElementById("uiEstimatedPrice").innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                Unable to load locations. Please try again later.
            </div>
        `;
        document.querySelector(".submit-btn").disabled = true;
    });
    
    setTimeout(() => {
        document.querySelectorAll('.info-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animated');
            }, index * 200);
        });
    }, 300);
}

window.onload = onPageLoad;