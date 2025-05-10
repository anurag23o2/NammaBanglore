// Bangalore Property Price Predictor JavaScript
// Advanced implementation with visual feedback and form validation

function getBathValue() {
  const uiBathrooms = document.getElementsByName("uiBathrooms");
  for(let i in uiBathrooms) {
    if(uiBathrooms[i].checked) {
        return parseInt(i)+1;
    }
  }
  return -1; // Invalid Value
}

function getBHKValue() {
  const uiBHK = document.getElementsByName("uiBHK");
  for(let i in uiBHK) {
    if(uiBHK[i].checked) {
        return parseInt(i)+1;
    }
  }
  return -1; // Invalid Value
}

function validateForm() {
  const sqft = document.getElementById("uiSqft").value;
  const location = document.getElementById("uiLocations").value;
  
  let isValid = true;
  let errorMessage = "";
  
  // Validate square feet
  if (!sqft || isNaN(sqft) || sqft <= 0) {
    errorMessage = "Please enter a valid area in square feet";
    isValid = false;
  }
  
  // Validate location
  if (!location || location === "") {
    if (errorMessage) errorMessage += "<br>";
    errorMessage += "Please select a location";
    isValid = false;
  }
  
  return {
    isValid,
    errorMessage
  };
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
  console.log("Estimate price button clicked");
  
  // Validate the form
  const validation = validateForm();
  if (!validation.isValid) {
    document.getElementById("uiEstimatedPrice").innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        ${validation.errorMessage}
      </div>
    `;
    return;
  }
  
  // Get form values
  const sqft = document.getElementById("uiSqft");
  const bhk = getBHKValue();
  const bathrooms = getBathValue();
  const location = document.getElementById("uiLocations");
  
  // Show loading indicator
  showLoading();

  // API URL
  const url = "http://127.0.0.1:5000/predict_home_price";

  // Make API call
  $.post(url, {
      total_sqft: parseFloat(sqft.value),
      bhk: bhk,
      bath: bathrooms,
      location: location.value
  },function(data, status) {
      console.log(data.estimated_price);
      
      // Format and display the price with animation
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
      
      // Add animation class
      estPrice.classList.add('price-updated');
      setTimeout(() => {
        estPrice.classList.remove('price-updated');
      }, 1000);
      
      console.log(status);
  }).fail(function(xhr, status, error) {
      document.getElementById("uiEstimatedPrice").innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          Unable to get price estimate. Please try again.
        </div>
      `;
      console.error("Error:", error);
  });
}

function onPageLoad() {
  console.log("document loaded");
  
  // Set up event listeners
  const sqftInput = document.getElementById("uiSqft");
  if (sqftInput) {
    sqftInput.addEventListener('input', function() {
      // Remove non-numeric characters
      this.value = this.value.replace(/[^0-9]/g, '');
    });
  }
  
  // Get locations from API
  const url = "http://127.0.0.1:5000/get_location_names";
  
  $.get(url, function(data, status) {
    console.log("got response for get_location_names request");
    if(data) {
      const locations = data.locations;
      const uiLocations = document.getElementById("uiLocations");
      $('#uiLocations').empty();
      
      // Add placeholder option
      const placeholderOpt = new Option("Choose a Location", "");
      placeholderOpt.disabled = true;
      placeholderOpt.selected = true;
      $('#uiLocations').append(placeholderOpt);
      
      // Sort locations alphabetically
      locations.sort();
      
      // Add location options
      for(let i in locations) {
        const opt = new Option(locations[i]);
        $('#uiLocations').append(opt);
      }
      
      // Add special highlight for popular locations
      const popularLocations = ["Electronic City", "Whitefield", "Indiranagar", "Koramangala", "HSR Layout"];
      $("#uiLocations option").each(function() {
        if (popularLocations.includes($(this).text())) {
          $(this).attr("class", "popular-location");
        }
      });
    }
  }).fail(function() {
    // Handle failed API call
    const uiLocations = document.getElementById("uiLocations");
    $('#uiLocations').empty();
    
    // Add placeholder option
    const placeholderOpt = new Option("Error loading locations", "");
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    $('#uiLocations').append(placeholderOpt);
    
    // Add some default locations
    const defaultLocations = ["Electronic City", "Whitefield", "Indiranagar", "Koramangala", "HSR Layout"];
    for(let i in defaultLocations) {
      const opt = new Option(defaultLocations[i]);
      $('#uiLocations').append(opt);
    }
  });
  
  // Add animation classes for initial load
  setTimeout(() => {
    document.querySelectorAll('.info-card').forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animated');
      }, index * 200);
    });
  }, 300);
}

window.onload = onPageLoad;