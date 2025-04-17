let currentEditId = null; // Holds the Firestore doc ID during edit

let flightData = [];
let distanceChart, airlineChart, airportChart, aircraftChart, yearlyFlightsChart;

const firebaseConfig = {
    apiKey: "AIzaSyBwocbbt1evr1w7bTTmg1ng_nzSq58Ym1A",
    authDomain: "flight-logger-a7a62.firebaseapp.com",
    projectId: "flight-logger-a7a62",
    storageBucket: "flight-logger-a7a62.firebasestorage.app",
    messagingSenderId: "407134528805",
    appId: "1:407134528805:web:bdd50fbdaf002e745ba6cc",
    measurementId: "G-0Q0R6BCDD7"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const displayName = user.displayName || user.email.split("@")[0]; // fallback if no name set
      document.getElementById("userDisplayName").textContent = displayName;
    } else {
      // User not logged in, redirect to login
      window.location.href = "login.html";
    }
  });











loadDropdownData();
loadFlights();

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


flightForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const updatedFlight = {
        date: document.getElementById('date').value,
        departure: departurePortSelect.value,
        arrival: arrivalPortSelect.value,
        airline: airlineSelect.value,
        flightnumber: document.getElementById('flightnumber').value,
        aircraft: aircraftSelect.value,
        tailnumber: document.getElementById('tailnumber').value,
        distance: parseFloat(document.getElementById('distance').value) || 0,
        duration: parseFloat(document.getElementById('duration').value) || 0
    };

    if (currentEditId) {
        // Edit mode
        try {
            await db.collection("flights").doc(currentEditId).update(updatedFlight);
            alert("Flight updated successfully!");
        } catch (error) {
            console.error("Error updating flight:", error);
        }
    } else {
        // Add mode
        try {
            await db.collection("flights").add(updatedFlight);
            alert("Flight added to Firebase!");
        } catch (error) {
            console.error("Error adding flight:", error);
        }
    }

    currentEditId = null; // Reset
    flightForm.reset();
    document.getElementById("saveBtn").innerHTML = "Add Flight";
    document.getElementById("saveBtn").style.backgroundColor = "#28a745";
    loadFlights();
});


async function loadFlights() {
    const tableBody = document.querySelector("#flight-table tbody");
    tableBody.innerHTML = ""; // Clear table

    try {
        const snapshot = await db.collection("flights").orderBy("date").get();

        let totalFlights = 0;
        let totalDuration = 0;
        let totalDistance = 0;

        var flightData = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            

            flightData.push({ ...data, id: doc.id });


            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${data.date}</td>
                <td>${data.departure}</td>
                <td>${data.arrival}</td>
                <td>${data.airline}</td>
                <td>${data.flightnumber}</td>
                <td>${data.aircraft}</td>
                <td>${data.tailnumber || "-"}</td>
                <td>${data.distance || 0}</td>
                <td>${data.duration || 0}</td>
                <td>
                <button class="remove-btn" onclick="deleteFlight('${doc.id}')">Delete</button>
                <button class="edit-btn"  onclick="editFlight('${doc.id}')">Edit</button>
                </td>

            `;
            tableBody.appendChild(row);

            totalFlights++;
            totalDuration += data.duration || 0;
            totalDistance += data.distance || 0;
        });

        document.getElementById('total-flights').textContent = totalFlights;
        document.getElementById('total-duration').textContent = totalDuration.toFixed(1);
        document.getElementById('total-distance').textContent = totalDistance.toFixed(1);
        
    } catch (err) {
        console.error("Error loading flights:", err);
    }

    console.log(flightData);
    updateCharts(flightData);
}

async function deleteFlight(docId) {
    if (confirm("Are you sure you want to delete this flight?")) {
        try {
            await db.collection("flights").doc(docId).delete();
            alert("Flight deleted!");
            loadFlights(); // Refresh table
        } catch (err) {
            console.error("Error deleting flight:", err);
        }
    }
}



async function updateFlight(flightId, updatedData) {
    if (confirm("Are you sure you want to edit this flight?")) {
        try {
            const flightRef = doc(db, "flights", flightId);
            await updateDoc(flightRef, updatedData);
            console.log("✈️ Flight updated successfully");
          } catch (error) {
            console.error("❌ Error updating flight:", error);
          }
    }
}



let currentIndex = null; // Keep track of the index of the flight being edited

// When editing a flight
async function editFlight(docId) {

    console.log(docId);

    try {
        // Get a reference to the document
        const flightRef = db.collection("flights").doc(docId);
        
        // Fetch the document
        const docSnap = await flightRef.get();
    
        if (docSnap.exists) {
          console.log("Document data:", docSnap.data());

          const flight= docSnap.data();
          console.log(flight);  

          if (!flight) return alert("Flight data not found!");

          // Populate form with data
          document.getElementById('date').value = flight.date;
          departurePortSelect.value = flight.departure;
          arrivalPortSelect.value = flight.arrival;
          airlineSelect.value = flight.airline;
          aircraftSelect.value = flight.aircraft;
          document.getElementById('flightnumber').value = flight.flightnumber;
          document.getElementById('tailnumber').value = flight.tailnumber || "";
          document.getElementById('distance').value = flight.distance || "";
          document.getElementById('duration').value = flight.duration || "";
      
          currentEditId = docId; // Set the ID we're editing
      
          document.getElementById("saveBtn").innerHTML = "Update Flight";
          document.getElementById("saveBtn").style.backgroundColor = "#007bff";

        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error getting document:", error);
      }   
}

function updateCharts(flightData) {
    console.log("lets try to debug the chart loading");

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

}

function updateStatistics() {
    const totalFlights = flightData.length;
    const totalDuration = flightData.reduce((acc, flight) => acc + parseFloat(flight.duration), 0);
    const totalDistance = flightData.reduce((acc, flight) => acc + parseFloat(flight.distance), 0);

    totalFlightsElement.textContent = totalFlights;
    totalDurationElement.textContent = totalDuration.toFixed(2);
    totalDistanceElement.textContent = totalDistance.toFixed(2);
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        console.log("User signed out.");
        alert("User signed out.");

        window.location.href = "index.html"; // redirect to login
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  });