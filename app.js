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

// function addFlight(event) {
//     event.preventDefault();

//     const date = document.getElementById('date').value;
//     const departure = departurePortSelect.value;
//     const arrival = arrivalPortSelect.value;
//     const airline = airlineSelect.value;
//     const aircraft = aircraftSelect.value;
//     const flightnumber = document.getElementById('flightnumber').value;
//     const distance = document.getElementById('distance').value;
//     const duration = document.getElementById('duration').value;

//     const flight = { date, departure, arrival, airline, aircraft, flightnumber, distance, duration };
//     flightData.push(flight);
//     localStorage.setItem('flightData', JSON.stringify(flightData));

//     updateFlightTable();
//     updateCharts();
//     updateStatistics();
//     flightForm.reset();
// }

function addFlight(event) {
    event.preventDefault(); // Prevent the default form submit behavior

    // Fetch the form values for a new flight
    const date = document.getElementById('date').value;
    const departure = departurePortSelect.value;
    const arrival = arrivalPortSelect.value;
    const airline = airlineSelect.value;
    const aircraft = aircraftSelect.value;
    const flightnumber = document.getElementById('flightnumber').value;
    const tailnumber = document.getElementById('tailnumber').value;
    const distance = document.getElementById('distance').value;
    const duration = document.getElementById('duration').value;

    // Add the new flight to the flightData array
    flightData.push({ date, departure, arrival, airline, aircraft, flightnumber, tailnumber, distance, duration });
    localStorage.setItem('flightData', JSON.stringify(flightData));

    // Re-render the flight table and update statistics/charts
    updateFlightTable();
    updateCharts();
    updateStatistics();

    // Reset the form to be ready for the next input
    flightForm.reset();
}

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

function removeFlight(index) {
    if (confirm('Are you sure you want to remove this flight?')) {
        flightData.splice(index, 1);
        localStorage.setItem('flightData', JSON.stringify(flightData));
        updateFlightTable();
        updateCharts();
        updateStatistics();
    }
}

// function editFlight(index) {
//     const flight = flightData[index];
//     document.getElementById('date').value = flight.date;
//     departurePortSelect.value = flight.departure;
//     arrivalPortSelect.value = flight.arrival;
//     airlineSelect.value = flight.airline;
//     aircraftSelect.value = flight.aircraft;
//     document.getElementById('flightnumber').value = flight.flightnumber;
//     document.getElementById('distance').value = flight.distance;
//     document.getElementById('duration').value = flight.duration;
    
//     // Update the button to update instead of add
//     flightForm.removeEventListener('submit', addFlight);
//     flightForm.addEventListener('submit', (e) => updateFlight(e, index));
// }


let currentIndex = null; // Keep track of the index of the flight being edited

// When editing a flight
function editFlight(index) {

    document.getElementById("saveBtn").innerHTML="Update Flight";
    document.getElementById("saveBtn").style.backgroundColor="#007bff";

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

    // Change the form submit handler to update the flight
    flightForm.removeEventListener('submit', addFlight); // Remove previous "Add" listener
    flightForm.addEventListener('submit', updateFlight); // Add "Update" listener
}






// function updateFlight(event, index) {
//     event.preventDefault();

//     const date = document.getElementById('date').value;
//     const departure = departurePortSelect.value;
//     const arrival = arrivalPortSelect.value;
//     const airline = airlineSelect.value;
//     const aircraft = aircraftSelect.value;
//     const flightnumber = document.getElementById('flightnumber').value;
//     const distance = document.getElementById('distance').value;
//     const duration = document.getElementById('duration').value;

//     flightData[index] = { date, departure, arrival, airline, aircraft, flightnumber, distance, duration };
//     localStorage.setItem('flightData', JSON.stringify(flightData));

//     updateFlightTable();
//     updateCharts();
//     updateStatistics();
//     flightForm.reset();

//     // Reset the form to add new flights again
//     flightForm.removeEventListener('submit', updateFlight);
//     flightForm.addEventListener('submit', addFlight);
// }

function updateFlight(event) {
    event.preventDefault(); // Prevent the default form submit behavior

    // Fetch the new values from the form
    const date = document.getElementById('date').value;
    const departure = departurePortSelect.value;
    const arrival = arrivalPortSelect.value;
    const airline = airlineSelect.value;
    const aircraft = aircraftSelect.value;
    const flightnumber = document.getElementById('flightnumber').value;
    const tailnumber = document.getElementById('tailnumber').value;
    const distance = document.getElementById('distance').value;
    const duration = document.getElementById('duration').value;

    // Update the flight data at the correct index
    flightData[currentIndex] = { date, departure, arrival, airline, aircraft, flightnumber, tailnumber, distance, duration };
    localStorage.setItem('flightData', JSON.stringify(flightData));

    // Re-render the flight table and update statistics/charts
    updateFlightTable();
    updateCharts();
    updateStatistics();

    // Reset the form for next use (but we don't reset it until after the update)
    flightForm.reset();

    // After updating, switch back to "Add Flight" functionality
    flightForm.removeEventListener('submit', updateFlight); // Remove "Update" listener
    flightForm.addEventListener('submit', addFlight); // Re-attach "Add" listener
    currentIndex = null; // Reset the editing index

    document.getElementById("saveBtn").innerHTML="Add Flight";
    document.getElementById("saveBtn").style.backgroundColor="#4CAF50";

}


function updateCharts() {
    const airlines = [...new Set(flightData.map(flight => flight.airline))];
    const airports = [...new Set(flightData.map(flight => flight.departure))];
    const aircraftTypes = [...new Set(flightData.map(flight => flight.aircraft))];
    
    const airlineCounts = airlines.map(airline => flightData.filter(flight => flight.airline === airline).length);
    const airportCounts = airports.map(airport => flightData.filter(flight => flight.departure === airport).length);
    const aircraftCounts = aircraftTypes.map(aircraft => flightData.filter(flight => flight.aircraft === aircraft).length);
    const yearlyCounts = [...new Set(flightData.map(flight => new Date(flight.date).getFullYear()))];
    
    const yearlyFlights = yearlyCounts.map(year => flightData.filter(flight => new Date(flight.date).getFullYear() === year).length);

    if (airlineChart) airlineChart.destroy();
    airlineChart = new Chart(airlineChartCanvas, {
        type: 'pie',
        data: {
            labels: airlines,
            datasets: [{
                label: 'Airline Distribution',
                data: airlineCounts,
                backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F4A261', '#2D3142']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} flights`
                    }
                }
            }
        }
    });

    if (airportChart) airportChart.destroy();
    airportChart = new Chart(airportChartCanvas, {
        type: 'pie',
        data: {
            labels: airports,
            datasets: [{
                label: 'Airport Distribution',
                data: airportCounts,
                backgroundColor: ['#FF8C00', '#FF6347', '#4CAF50', '#8A2BE2', '#20B2AA']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} flights`
                    }
                }
            }
        }
    });

    if (aircraftChart) aircraftChart.destroy();
    aircraftChart = new Chart(aircraftChartCanvas, {
        type: 'pie',
        data: {
            labels: aircraftTypes,
            datasets: [{
                label: 'Aircraft Type Distribution',
                data: aircraftCounts,
                backgroundColor: ['#FFC300', '#FF5733', '#C70039', '#900C3F', '#581845']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw} flights`
                    }
                }
            }
        }
    });

    // if (yearlyFlightsChart) yearlyFlightsChart.destroy();
    // yearlyFlightsChart = new Chart(yearlyFlightsChartCanvas, {
    //     type: 'bar',
    //     data: {
    //         labels: yearlyCounts,
    //         datasets: [{
    //             label: 'Flights per Year',
    //             data: yearlyFlights,
    //             backgroundColor: '#FF5733',
    //             borderColor: '#C70039',
    //             borderWidth: 1
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         aspectRatio: 2, // Adjusted aspect ratio for better width vs height balance
    //         maintainAspectRatio: true,
    //         scales: {
    //             y: {
    //                 beginAtZero: true
    //             },
    //             x: {
    //                 grid: {
    //                     display: false
    //                 }
    //             }
    //         }
    //     }
    // });
}

function updateStatistics() {
    const totalFlights = flightData.length;
    const totalDuration = flightData.reduce((acc, flight) => acc + parseFloat(flight.duration), 0);
    const totalDistance = flightData.reduce((acc, flight) => acc + parseFloat(flight.distance), 0);

    totalFlightsElement.textContent = totalFlights;
    totalDurationElement.textContent = totalDuration.toFixed(2);
    totalDistanceElement.textContent = totalDistance.toFixed(2);
}

// Load data from localStorage on page load
if (localStorage.getItem('flightData')) {
    flightData = JSON.parse(localStorage.getItem('flightData'));
    updateFlightTable();
    updateCharts();
    updateStatistics();
}

flightForm.addEventListener('submit', addFlight);
loadDropdownData();
