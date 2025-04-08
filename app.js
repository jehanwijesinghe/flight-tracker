let flightData = [];
let distanceChart, airlineChart, airportChart, aircraftChart, yearlyFlightsChart;

const flightForm = document.getElementById('flight-form');
const flightTable = document.getElementById('flight-table').getElementsByTagName('tbody')[0];
const totalFlightsElement = document.getElementById('total-flights');
const totalDurationElement = document.getElementById('total-duration');
const totalDistanceElement = document.getElementById('total-distance');

const airlineChartCanvas = document.getElementById('airlineChart').getContext('2d');
const airportChartCanvas = document.getElementById('airportChart').getContext('2d');
const aircraftChartCanvas = document.getElementById('aircraftChart').getContext('2d');
const yearlyFlightsChartCanvas = document.getElementById('yearlyFlightsChart').getContext('2d');

const departurePortSelect = document.getElementById('departure');
const arrivalPortSelect = document.getElementById('arrival');
const airlineSelect = document.getElementById('airline');
const aircraftSelect = document.getElementById('aircraft');

// Fetching dropdown data
async function loadDropdownData() {
    try {
        const response = await fetch('airport_data.json');
        if (!response.ok) throw new Error("Failed to load airport_data.json");
        const data = await response.json();

        const airports = data.results.map(airport => airport.name).sort();
        airports.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport;
            option.textContent = airport;
            departurePortSelect.appendChild(option);
            arrivalPortSelect.appendChild(option.cloneNode(true)); // For arrival port
        });
    } catch (error) {
        console.error('Error loading dropdown data:', error);
    }

    try {
        const response2 = await fetch('airline_data.json');
        if (!response2.ok) throw new Error("Failed to load airline_data.json");
        const data2 = await response2.json();

        const airlines = data2.airlines.map(airline => airline.name).sort();
        airlines.forEach(airline => {
            const option2 = document.createElement('option');
            option2.value = airline;
            option2.textContent = airline;
            airlineSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Error loading dropdown data:', error);
    }

    try {
        const response3 = await fetch('aircraft_data.json');
        if (!response3.ok) throw new Error("Failed to load aircraft_data.json");
        const data3 = await response3.json();

        const aircrafts = data3.aircrafts.map(aircraft => aircraft.model).sort();
        aircrafts.forEach(aircraft => {
            const option3 = document.createElement('option');
            option3.value = aircraft;
            option3.textContent = aircraft;
            aircraftSelect.appendChild(option3);
        });
    } catch (error) {
        console.error('Error loading dropdown data:', error);
    }
}

// API URL
const sheetdbUrl = 'https://sheetdb.io/api/v1/4bsetj03kxwnx';

// Fetch data from SheetDB
async function fetchFlightData() {
    try {
        const response = await fetch(sheetdbUrl);
        if (!response.ok) throw new Error("Failed to fetch flight data");
        const data = await response.json();
        flightData = data;
        updateFlightTable();
        updateCharts();
        updateStatistics();
    } catch (error) {
        console.error('Error fetching flight data:', error);
    }
}

// Add a new flight to SheetDB
async function addFlight(event) {
    event.preventDefault(); // Prevent default form submission

    const date = document.getElementById('date').value;
    const departure = departurePortSelect.value;
    const arrival = arrivalPortSelect.value;
    const airline = airlineSelect.value;
    const aircraft = aircraftSelect.value;
    const flightnumber = document.getElementById('flightnumber').value;
    const tailnumber = document.getElementById('tailnumber').value;
    const distance = document.getElementById('distance').value;
    const duration = document.getElementById('duration').value;

    const flight = { date, departure, arrival, airline, aircraft, flightnumber, tailnumber, distance, duration };

    try {
        const response = await fetch(sheetdbUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([flight]),
        });

        if (!response.ok) throw new Error('Failed to add flight');
        fetchFlightData(); // Refresh the flight data after adding
        flightForm.reset(); // Reset the form after submission
    } catch (error) {
        console.error('Error adding flight:', error);
    }
}

// Update a flight in SheetDB
async function updateFlight(event) {
    event.preventDefault();

    const date = document.getElementById('date').value;
    const departure = departurePortSelect.value;
    const arrival = arrivalPortSelect.value;
    const airline = airlineSelect.value;
    const aircraft = aircraftSelect.value;
    const flightnumber = document.getElementById('flightnumber').value;
    const tailnumber = document.getElementById('tailnumber').value;
    const distance = document.getElementById('distance').value;
    const duration = document.getElementById('duration').value;

    const updatedFlight = { date, departure, arrival, airline, aircraft, flightnumber, tailnumber, distance, duration };
    const flightId = flightData[currentIndex]._id; // Use the unique ID of the flight to update

    try {
        const response = await fetch(`${sheetdbUrl}/id/${flightId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([updatedFlight]),
        });

        if (!response.ok) throw new Error('Failed to update flight');
        fetchFlightData(); // Refresh data after update
    } catch (error) {
        console.error('Error updating flight:', error);
    }
}

// Remove a flight from SheetDB
async function removeFlight(index) {
    const flightId = flightData[index]._id; // Use unique ID to remove the flight

    if (confirm('Are you sure you want to remove this flight?')) {
        try {
            const response = await fetch(`${sheetdbUrl}/id/${flightId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete flight');
            fetchFlightData(); // Refresh data after deletion
        } catch (error) {
            console.error('Error removing flight:', error);
        }
    }
}

// Update the flight table
function updateFlightTable() {
    flightTable.innerHTML = '';
    flightData.forEach((flight, index) => {
        const row = flightTable.insertRow();
        row.innerHTML = `
            <td>${flight.date}</td>
            <td>${flight.departure}</td>
            <td>${flight.arrival}</td>
            <td>${flight.airline}</td>
            <td>${flight.flightnumber}</td>
            <td>${flight.aircraft}</td>
            <td>${flight.tailnumber}</td>
            <td>${flight.distance}</td>
            <td>${flight.duration}</td>
            <td>
                <button class="edit-btn" onclick="editFlight(${index})">Edit</button>
                <button class="remove-btn" onclick="removeFlight(${index})">Remove</button>
            </td>
        `;
    });
}

// Edit a flight
let currentIndex = null;
function editFlight(index) {
    document.getElementById("saveBtn").innerHTML = "Update Flight";
    document.getElementById("saveBtn").style.backgroundColor = "#007bff";

    const flight = flightData[index];
    document.getElementById('date').value = flight.date;
    departurePortSelect.value = flight.departure;
    arrivalPortSelect.value = flight.arrival;
    airlineSelect.value = flight.airline;
    aircraftSelect.value = flight.aircraft;
    document.getElementById('flightnumber').value = flight.flightnumber;
    document.getElementById('tailnumber').value = flight.tailnumber;
    document.getElementById('distance').value = flight.distance;
    document.getElementById('duration').value = flight.duration;

    currentIndex = index; // Store the index of the flight being edited

    flightForm.removeEventListener('submit', addFlight);
    flightForm.addEventListener('submit', updateFlight);
}

// Update statistics
function updateStatistics() {
    const totalFlights = flightData.length;
    const totalDuration = flightData.reduce((sum, flight) => sum + parseFloat(flight.duration), 0);
    const totalDistance = flightData.reduce((sum, flight) => sum + parseFloat(flight.distance), 0);

    totalFlightsElement.textContent = totalFlights;
    totalDurationElement.textContent = totalDuration;
    totalDistanceElement.textContent = totalDistance;
}

// Update charts (you can modify this to use real chart data as per your needs)
function updateCharts() {
    // Code to update your charts (use Chart.js or any chart library here)
}

window.onload = function () {
    loadDropdownData();
    fetchFlightData(); // Load flight data on page load
};

flightForm.addEventListener('submit', addFlight);
