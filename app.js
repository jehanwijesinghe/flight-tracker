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

        loadFlights();

    } else {
        // User not logged in, redirect to login
        //   window.location.href = "index.html";
    }
});

loadDropdownData();

const flightForm = document.getElementById('flight-form');
const flightTable = document.getElementById('flight-table').getElementsByTagName('tbody')[0];
const totalFlightsElement = document.getElementById('total-flights');
const totalAirportsElement = document.getElementById('total-airlines');
const totalAirlinesElement = document.getElementById('total-airports');
const totalCountriesElement = document.getElementById('total-countries');
const totalAircraftTypesElement = document.getElementById('total-aircraft-types');
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
        const snapshot = await db.collection("airports").orderBy("country").get();

        var airportData = [];

        snapshot.forEach(doc2 => {
            const data2 = doc2.data();
            airportData.push({ ...data2 });
        });

        const airportList = airportData.map(airport => airport.name);
        airportList.sort();

        airportList.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport;
            option.textContent = airport;
            departurePortSelect.appendChild(option);
            arrivalPortSelect.appendChild(option.cloneNode(true)); // For arrival port
        });

    } catch (err) {
        console.error("Error loading flights:", err);
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

    const user = firebase.auth().currentUser;  // Get the current authenticated user

    if (!user) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please sign in to add or update a flight.",
        });
        return;
    }

    const updatedFlight = {
        date: document.getElementById('date').value,
        departure: departurePortSelect.value,
        arrival: arrivalPortSelect.value,
        airline: airlineSelect.value,
        flightnumber: document.getElementById('flightnumber').value,
        aircraft: aircraftSelect.value,
        tailnumber: document.getElementById('tailnumber').value,
        distance: parseFloat(document.getElementById('distance').value) || 0,
        duration: parseFloat(document.getElementById('duration').value) || 0,
        userId: user.uid  // Add the userId to associate the flight with the current user
    };

    if (currentEditId) {
        // Edit mode
        try {
            await db.collection("flights").doc(currentEditId).update(updatedFlight);
            Swal.fire({
                title: 'Success!',
                text: 'Flight updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error("Error updating flight:", error);
        }
    } else {
        // Add mode
        try {
            await db.collection("flights").add(updatedFlight);
            document.querySelector("#flightTable tbody").innerHTML = "";

            loadFlights();
            Swal.fire({
                title: 'Success!',
                text: 'Flight added successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
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
    document.getElementById("loader").style.display = "flex"; // Show loader


    const tableBody = document.querySelector("#flight-table tbody");
    tableBody.innerHTML = ""; // Clear table

    const user = firebase.auth().currentUser;
    //  console.log(user);

    try {
        // const snapshot = await db.collection("flights").orderBy("date").get();
        const snapshot = await db.collection("flights")
            .where("userId", "==", user.uid)  // Fetch only flights that belong to the current user
            .orderBy("date")
            .get();

        let totalFlights = 0;
        let totalDuration = 0;
        let totalDistance = 0;
        let totalAirlines = 0;
        let totalAirports = 0;
        let totalCountries = 0;
        let totalAircraftTypes = 0;

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

        const airlinesList = [...new Set(flightData.map(flight => flight.airline.trim().toLowerCase()))];
        airlinesList.sort(); // Optional: sort after filtering uniques
        totalAirlines = airlinesList.length;

        const aircraftTypesList = [...new Set(flightData.map(flight => flight.aircraft.trim().toLowerCase()))];
        aircraftTypesList.sort(); // Optional: sort after filtering uniques
        totalAircraftTypes = aircraftTypesList.length;

        const deptAirportLists = [...new Set(flightData.map(flight => flight.departure.trim().toLowerCase()))];
        deptAirportLists.sort(); // Optional: sort after filtering uniques
        const arrAirportLists = [...new Set(flightData.map(flight => flight.arrival.trim().toLowerCase()))];
        arrAirportLists.sort(); // Optional: sort after filtering uniques
        const allAirports = deptAirportLists.concat(arrAirportLists);

        const uniqueAllAirports = [...new Set(allAirports)];
        totalAirports = uniqueAllAirports.length;

        // console.log(uniqueAllAirports);

        var countryList= [];

        countryList = await getCountryByAirportName(uniqueAllAirports);
        totalCountries=countryList.length;

        console.log(countryList);

        document.getElementById('total-flights').textContent = totalFlights;
        document.getElementById('total-airlines').textContent = totalAirlines;
        document.getElementById('total-aircraft-types').textContent = totalAircraftTypes;
        document.getElementById('total-airports').textContent = totalAirports;
        document.getElementById('total-countries').textContent = totalCountries;
        document.getElementById('total-duration').textContent = totalDuration.toFixed(1);
        document.getElementById('total-distance').textContent = totalDistance.toFixed(1);

    } catch (err) {
        console.error("Error loading flights:", err);
    } finally {
        document.getElementById("loader").style.display = "none"; // Hide loader
    }

    //  console.log(flightData);
    updateCharts(flightData);
}


async function getCountryByAirportName(uniqueAllAirports) {
    const countries = [];
  
    for (const name of uniqueAllAirports) {
      const snapshot = await db.collection("airports")
        .where("name", "==", name)
        .get();
  
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        countries.push(data.country);
      } else {
        console.warn(`No match found for airport: ${name}`);
      }
    }
  
    return countries;
  }


async function deleteFlight(docId) {
    const user = firebase.auth().currentUser;  // Get the current authenticated user

    if (!user) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "You must be signed in to delete a flight.",
        });
        return;
    }

    try {
        const flightDoc = await db.collection("flights").doc(docId).get();

        if (!flightDoc.exists) {
            Swal.fire({
                icon: "error",
                title: "Internal Server Error...",
                text: "Flight not found.",
            });
            return;
        }

        // Check if the user is the owner of the flight
        const flightData = flightDoc.data();
        if (flightData.userId !== user.uid) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "You can only delete your own flights.",
            });
            return;
        }

        // Proceed with deletion

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {

                await db.collection("flights").doc(docId).delete();
                loadFlights(); // Refresh table

                Swal.fire({
                    title: "Deleted!",
                    text: "Your flight has been deleted.",
                    icon: "success"
                });
            }
        });

        // if (confirm("Are you sure you want to delete this flight?")) {
        //     await db.collection("flights").doc(docId).delete();
        //     alert("Flight deleted!");
        //     loadFlights(); // Refresh table
        // }

    } catch (err) {
        console.error("Error deleting flight:", err);
        Swal.fire({
            icon: "error",
            title: "Internal Server Error...",
            text: "There was an error while deleting the flight.",
        });
    }
}





let currentIndex = null; // Keep track of the index of the flight being edited

// When editing a flight
async function editFlight(docId) {


    try {
        // Get a reference to the document
        const flightRef = db.collection("flights").doc(docId);

        // Fetch the document
        const docSnap = await flightRef.get();

        if (docSnap.exists) {
            console.log("Document data:", docSnap.data());

            const flight = docSnap.data();
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
            return Swal.fire({
                title: 'Signed Out!',
                text: 'You have been signed out successfully',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        })
        .then(() => {
            // Only redirect after the user clicks OK on the alert
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
});

window.addEventListener("load", () => {
    // Hide loader only after everything is loaded
    document.getElementById("loader").style.display = "none";
  });