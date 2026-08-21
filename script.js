// Get elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const fareDisplay = document.getElementById('fare');
const timerDisplay = document.getElementById('timer');
const mapContainer = document.getElementById('map');
const pickupInput = document.getElementById('pickupLocation');
const dropoffInput = document.getElementById('dropoffLocation');
const estimatedFareDisplay = document.getElementById('estimatedFare');
const distanceDisplay = document.getElementById('distance');

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let currentFare = 0;
const RATE_PER_MINUTE = 0.5;
const BASE_FARE = 5;

let map;
let pickupMarker;
let dropoffMarker;
let routeLine;
let taxiMarker;
let taxiLocation = { lat: 0, lng: 0 };

// Initialize map
function initMap() {
    map = new google.maps.Map(mapContainer, {
        zoom: 13,
        center: { lat: 40.7128, lng: -74.006 }
    });

    // Add click listener for pickup location
    pickupInput.addEventListener('change', () => {
        geocodeAndMarkLocation(pickupInput.value, 'pickup');
    });

    // Add click listener for dropoff location
    dropoffInput.addEventListener('change', () => {
        geocodeAndMarkLocation(dropoffInput.value, 'dropoff');
    });
}

// Geocode and mark location on map
function geocodeAndMarkLocation(address, type) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK) {
            const location = results[0].geometry.location;
            if (type === 'pickup') {
                if (pickupMarker) pickupMarker.setMap(null);
                pickupMarker = new google.maps.Marker({
                    position: location,
                    map: map,
                    title: 'Pickup',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                });
                taxiLocation = { lat: location.lat(), lng: location.lng() };
            } else if (type === 'dropoff') {
                if (dropoffMarker) dropoffMarker.setMap(null);
                dropoffMarker = new google.maps.Marker({
                    position: location,
                    map: map,
                    title: 'Dropoff',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                });
            }
            if (pickupMarker && dropoffMarker) {
                drawRoute();
            }
        }
    });
}

// Draw route on map
function drawRoute() {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    directionsService.route(
        {
            origin: new google.maps.LatLng(pickupMarker.getPosition().lat(), pickupMarker.getPosition().lng()),
            destination: new google.maps.LatLng(dropoffMarker.getPosition().lat(), dropoffMarker.getPosition().lng()),
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(response);
                const route = response.routes[0];
                let totalDistance = 0;
                route.legs.forEach(leg => {
                    totalDistance += leg.distance.value;
                });
                distanceDisplay.textContent = (totalDistance / 1000).toFixed(2) + ' km';
                updateEstimatedFare(totalDistance);
            }
        }
    );
}

// Update estimated fare based on distance
function updateEstimatedFare(distance) {
    const distanceInKm = distance / 1000;
    const farePerKm = 2;
    const estimatedFare = BASE_FARE + (distanceInKm * farePerKm);
    estimatedFareDisplay.textContent = '$' + estimatedFare.toFixed(2);
}

// Start timer
function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTimer, 100);
}

// Update timer
function updateTimer() {
    elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const milliseconds = Math.floor((elapsedTime % 1000) / 100);
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
    updateFare();
}

// Update fare based on time
function updateFare() {
    const minutes = elapsedTime / 60000;
    currentFare = BASE_FARE + (minutes * RATE_PER_MINUTE);
    fareDisplay.textContent = '$' + currentFare.toFixed(2);
}

// Start button click
startBtn.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resetBtn.disabled = true;
        startTimer();

        // Add taxi marker
        if (!taxiMarker) {
            taxiMarker = new google.maps.Marker({
                position: { lat: taxiLocation.lat, lng: taxiLocation.lng },
                map: map,
                title: 'Taxi',
                icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
            });
        }
    }
});

// Stop button click
stopBtn.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        resetBtn.disabled = false;
    }
});

// Reset button click
resetBtn.addEventListener('click', () => {
    elapsedTime = 0;
    currentFare = 0;
    timerDisplay.textContent = '00:00.0';
    fareDisplay.textContent = '$0.00';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resetBtn.disabled = true;
    pickupInput.value = '';
    dropoffInput.value = '';
    estimatedFareDisplay.textContent = '$0.00';
    distanceDisplay.textContent = '0 km';
    if (pickupMarker) pickupMarker.setMap(null);
    if (dropoffMarker) dropoffMarker.setMap(null);
    if (taxiMarker) taxiMarker.setMap(null);
    if (routeLine) routeLine.setMap(null);
    pickupMarker = null;
    dropoffMarker = null;
    taxiMarker = null;
    routeLine = null;
});

// Initialize map when page loads
window.addEventListener('load', initMap);
