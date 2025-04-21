let currentEditId = null; // Holds the Firestore doc ID during edit


const modal = document.getElementById("flightModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");

openBtn.onclick = () => modal.style.display = "block";


closeBtn.onclick = () => {
    modal.style.display = "none";
    flightForm.reset();
    document.getElementById("saveBtn").innerHTML = "Add Flight";
    document.getElementById("saveBtn").style.backgroundColor = "#002f6e";
    document.getElementById("modalLabel").innerHTML = "Add New Flight";
    currentEditId = null;
}


window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

const profileToggle = document.getElementById("profileToggle");
const dropdownMenu = document.getElementById("dropdownMenu");

profileToggle.onclick = (e) => {
    dropdownMenu.style.display = dropdownMenu.style.display === "flex" ? "none" : "flex";
};

// Close dropdown when clicking outside
window.addEventListener("click", (e) => {
    if (!profileToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = "none";
    }
});



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
        const profilePic = user.photoURL || "assets/profileicon.png"; // fallback to default profile picture
    
        // Update the navbar with the user's name and profile picture
        document.getElementById("userDisplayName").textContent = displayName;
        document.getElementById("profileicon").src = profilePic;
    
        // Optionally: Call a function to load flights or any other user-specific data
        loadFlights();
    
      } else {
        // User not logged in, you can redirect to the login page or show guest info
        // window.location.href = "index.html";
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
        departure: (departurePortSelect.value).toLowerCase(),
        arrival: (arrivalPortSelect.value).toLowerCase(),
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
            Swal.fire({
                title: 'Success!',
                text: 'Flight added successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            document.querySelector("#flightTable tbody").innerHTML = "";

            loadFlights();

        } catch (error) {
            console.error("Error adding flight:", error);
        }
    }

    modal.style.display = "none";

    currentEditId = null; // Reset
    flightForm.reset();
    document.getElementById("saveBtn").innerHTML = "Add Flight";
    document.getElementById("saveBtn").style.backgroundColor = "#002f6e";
    document.getElementById("modalLabel").innerHTML = "Add New Flight";

    loadFlights();
});

async function loadFlights() {
    document.getElementById("loader").style.display = "flex"; // Show loader

    const tableBody = document.querySelector("#flight-table tbody");
    tableBody.innerHTML = ""; // Clear table

    const user = firebase.auth().currentUser;

    try {
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
                <td>${toTitleCase(data.departure)}</td>
                <td>${toTitleCase(data.arrival)}</td>
                <td>${data.airline}</td>
                <td>${data.flightnumber}</td>
                <td>${data.aircraft}</td>
                <td>${data.tailnumber || "-"}</td>
                <td>${data.distance || 0}</td>
                <td>${data.duration || 0}</td>
                <td>
                    <button class="remove-btn" onclick="deleteFlight('${doc.id}')">Delete</button>
                    <button class="edit-btn" onclick="editFlight('${doc.id}')">Edit</button>
                </td>
            `;
            tableBody.appendChild(row);

            totalFlights++;
            totalDuration += data.duration || 0;
            totalDistance += data.distance || 0;
        });

        // Other unique stats calculation logic
        var airlinesList = [...new Set(flightData.map(flight => flight.airline.trim().toLowerCase()))];
        totalAirlines = airlinesList.length;

        var aircraftTypesList = [...new Set(flightData.map(flight => flight.aircraft.trim().toLowerCase()))];
        totalAircraftTypes = aircraftTypesList.length;

        const deptAirportLists = [...new Set(flightData.map(flight => flight.departure.trim().toLowerCase()))];
        const arrAirportLists = [...new Set(flightData.map(flight => flight.arrival.trim().toLowerCase()))];
        var uniqueAllAirports = [...new Set([...deptAirportLists, ...arrAirportLists])];
        totalAirports = uniqueAllAirports.length;

        var countryList = await getCountryByAirportName(uniqueAllAirports);
        countryList = [...new Set(countryList)];
        totalCountries = countryList.length;

        // Update the stats display
        document.getElementById('total-flights').textContent = totalFlights;
        document.getElementById('total-airlines').textContent = totalAirlines;
        document.getElementById('total-aircraft-types').textContent = totalAircraftTypes;
        document.getElementById('total-airports').textContent = totalAirports;
        document.getElementById('total-countries').textContent = totalCountries;
        document.getElementById('total-duration').textContent = Math.ceil(totalDuration.toFixed(1) / 60);
        document.getElementById('total-distance').textContent = Math.ceil(totalDistance.toFixed(1));


        countryList = countryList.map(country =>
            country
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        ).sort();


        airlinesList = airlinesList.map(iteminarray =>
            iteminarray
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        ).sort();


        uniqueAllAirports = uniqueAllAirports.map(iteminarray =>
            iteminarray
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        ).sort();


        aircraftTypesList = aircraftTypesList.map(iteminarray =>
            iteminarray
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        ).sort();


        // Add click listeners to show the detailed stats in the modal
        document.getElementById('total-flights-tile').addEventListener('click', function () {
            showStatDetails("Total Flights", `Total Flights: ${totalFlights}`);
        });

        document.getElementById('total-airlines-tile').addEventListener('click', function () {
            showStatDetails("Total Airlines", `Total Airlines: ${totalAirlines}`, airlinesList);
        });

        document.getElementById('total-countries-tile').addEventListener('click', function () {
            showStatDetails("Total Countries", `Total Countries: ${totalCountries}`, countryList);
        });

        document.getElementById('total-airports-tile').addEventListener('click', function () {
            showStatDetails("Total Airports", `Total Airports: ${totalAirports}`, uniqueAllAirports);
        });

        document.getElementById('total-aircraft-types-tile').addEventListener('click', function () {
            showStatDetails("Total Aircraft Types", `Total Aircraft Types: ${totalAircraftTypes}`, aircraftTypesList);
        });

        document.getElementById('total-duration-tile').addEventListener('click', function () {
            showStatDetails("Total Duration", `Total Duration: ${Math.ceil(totalDuration.toFixed(1) / 60)} hours`);
        });

        document.getElementById('total-distance-tile').addEventListener('click', function () {
            showStatDetails("Total Distance", `Total Distance: ${Math.ceil(totalDistance.toFixed(1))} km`);
        });

    } catch (err) {
        console.error("Error loading flights:", err);
    } finally {
        document.getElementById("loader").style.display = "none"; // Hide loader
    }

    updateCharts(flightData);
    initializeDataTable();
}




function showStatDetails(title, description, countryList = null) {
    document.getElementById('modal-stat-title').textContent = title;
    document.getElementById('modal-stat-description').textContent = description;

    if (countryList) {
        // Show the country list if available
        const countryListHtml = countryList.map(country => `<li>${country}</li>`).join('');
        document.getElementById('modal-stat-description').innerHTML += `
            <ul>${countryListHtml}</ul>
        `;
    }

    document.getElementById('stat-modal').style.display = 'block';
}

// Close the modal when the close button is clicked
document.getElementById('close-modal').addEventListener('click', function () {
    document.getElementById('stat-modal').style.display = 'none';
});


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

    modal.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Optional: adds smooth scrolling animation
    });

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
            document.getElementById("saveBtn").style.backgroundColor = "#4075a2";

            document.getElementById("modalLabel").innerHTML = "Edit Flight";

        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }
}

function updateCharts(flightData) {
    Chart.defaults.font.family = 'Segoe UI, sans-serif';

    const airlines = [...new Set(flightData.map(f => f.airline))];
    const airports = [...new Set(flightData.map(f => f.departure))];
    const aircraftTypes = [...new Set(flightData.map(f => f.aircraft))];
    const years = [...new Set(flightData.map(f => new Date(f.date).getFullYear()))].sort();

    const airlineCounts = airlines.map(a => flightData.filter(f => f.airline === a).length);
    const airportCounts = airports.map(a => flightData.filter(f => f.departure === a).length);
    const aircraftCounts = aircraftTypes.map(a => flightData.filter(f => f.aircraft === a).length);
    const yearlyFlights = years.map(y => flightData.filter(f => new Date(f.date).getFullYear() === y).length);

    const destroyChart = (chart) => { if (chart) chart.destroy(); };

    // Bar Chart for Airlines
    destroyChart(airlineChart);
    airlineChart = new Chart(airlineChartCanvas, {
        type: 'bar',
        data: {
            labels: airlines,
            datasets: [{
                label: 'Flights per Airline',
                data: airlineCounts,
                backgroundColor: '#002f6e' // Primary dark blue color
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Flights' }
                },
                x: {
                    title: { display: true, text: 'Airlines' }
                }
            }
        }
    });

    // Horizontal Bar for Airports
    destroyChart(airportChart);
    airportChart = new Chart(airportChartCanvas, {
        type: 'bar',
        data: {
            labels: airports,
            datasets: [{
                label: 'Flights per Airport',
                data: airportCounts,
                backgroundColor: '#040439' // Secondary dark purple color
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Flights' }
                },
                y: {
                    title: { display: true, text: 'Airports' }
                }
            }
        }
    });

    // Horizontal Bar for Aircraft Types
    destroyChart(aircraftChart);
    aircraftChart = new Chart(aircraftChartCanvas, {
        type: 'bar',
        data: {
            labels: aircraftTypes,
            datasets: [{
                label: 'Flights per Aircraft',
                data: aircraftCounts,
                backgroundColor: '#849cbc' // Accent light blue color
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Flights' }
                },
                y: {
                    title: { display: true, text: 'Aircrafts' }
                }
            }
        }
    });

    // Line Chart for Yearly Flights
    destroyChart(yearlyFlightsChart);
    yearlyFlightsChart = new Chart(yearlyFlightsChartCanvas, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Flights per Year',
                data: yearlyFlights,
                fill: false,
                borderColor: '#002f6e', // Primary dark blue color for the line
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Flights' }
                },
                x: {
                    title: { display: true, text: 'Year' }
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

function initializeDataTable() {
    // Destroy if already initialized
    if ($.fn.dataTable.isDataTable('#flight-table')) {
        $('#flight-table').DataTable().destroy();
    }

    // Initialize with options
    $('#flight-table').DataTable({
        paging: true,
        pageLength: 10,
        ordering: true,
        order: [[0, 'desc']], // default sort by date descending
    });
}

function toTitleCase(str) {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// // === Popup Controls ===
// const openPopupBtn = document.getElementById("openAircraftPopup");
// const closePopupBtn = document.getElementById("closeAircraftPopup");
// const popup = document.getElementById("aircraftPopup");

// openPopupBtn.addEventListener("click", () => popup.style.display = "flex");
// closePopupBtn.addEventListener("click", () => popup.style.display = "none");
// window.addEventListener("click", (e) => {
//     if (e.target === popup) popup.style.display = "none";
// });

// // === Fetch Aircraft Info ===
// const lookupBtn = document.getElementById("lookupAircraftBtn");
// const tailInput = document.getElementById("tailNumberInput");
// const resultBox = document.getElementById("aircraftResult");

// lookupBtn.addEventListener("click", async () => {
//   const tailNumber = tailInput.value.trim().toUpperCase();
//   if (!tailNumber) {
//     resultBox.innerHTML = "<p>Please enter a valid tail number.</p>";
//     return;
//   }

//   resultBox.innerHTML = "<p>Fetching aircraft data...</p>";

//   try {
//     const response = await fetch(`https://aerodatabox.p.rapidapi.com/aircrafts/reg/${tailNumber}`, {
//       method: 'GET',
//       headers: {
//         'X-RapidAPI-Key': '27cab1653emsh0744570b575fc80p110c9cjsn8d2ba5c68db3',
//         'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
//       }
//     });

//     if (!response.ok) throw new Error("Failed to fetch data");
//     const data = await response.json();

//     if (!data || Object.keys(data).length === 0) {
//       resultBox.innerHTML = "<p>No aircraft found for this tail number.</p>";
//       return;
//     }

//     resultBox.innerHTML = `
//       <strong>Model:</strong> ${data.model || 'N/A'}<br>
//       <strong>Manufacturer:</strong> ${data.manufacturer || 'N/A'}<br>
//       <strong>First Flight:</strong> ${data.firstFlightDate || 'N/A'}<br>
//       <strong>Age:</strong> ${data.ageYears ? data.ageYears + " years" : 'N/A'}<br>
//       <strong>Owner:</strong> ${data.owner || 'N/A'}
//     `;
//   } catch (error) {
//     console.error(error);
//     resultBox.innerHTML = "<p>Error retrieving data. Try again later.</p>";
//   }
// });




document.getElementById("openAircraftModal").addEventListener("click", () => {
    document.getElementById("aircraftModal").style.display = "block";
  });
  
  document.getElementById("closeAircraftModal").addEventListener("click", () => {
    document.getElementById("aircraftModal").style.display = "none";
    clearAircraftLookup();
  });
  
  document.getElementById("clearTailBtn").addEventListener("click", () => {
    clearAircraftLookup();
  });
  
  function clearAircraftLookup() {
    document.getElementById("tailInput").value = "";
    document.getElementById("aircraftResult").innerHTML = "";
  }
  
//   document.getElementById("searchTailBtn").addEventListener("click", async () => {
//     const tail = document.getElementById("tailInput").value.trim().toUpperCase();
//     const resultBox = document.getElementById("aircraftResult");
//     resultBox.innerHTML = "🔄 Searching...";
  
//     if (!tail) {
//       resultBox.innerHTML = "❗ Please enter a tail number.";
//       return;
//     }
  
//     try {
//         const response = await fetch(`https://aerodatabox.p.rapidapi.com/aircrafts/reg/${tail}`, {
//             method: 'GET',
//         headers: {
//           'X-RapidAPI-Key': '27cab1653emsh0744570b575fc80p110c9cjsn8d2ba5c68db3',
//           'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
//         }
//       });
  
//       if (!response.ok) throw new Error("Aircraft not found.");
  
//       const data = await response.json();
//       resultBox.innerHTML = `
//         <strong>Registration:</strong> ${data.registration}<br>
//         <strong>Model:</strong> ${data.model}<br>
//         <strong>Manufacturer:</strong> ${data.manufacturer}<br>
//         <strong>ICAO Type:</strong> ${data.icaoTypeCode}<br>
//         <strong>MSN:</strong> ${data.serialNumber}<br>
//         <strong>Line Number:</strong> ${data.lineNumber || 'N/A'}<br>
//         <strong>Age:</strong> ${data.ageYears} years
//       `;
//     } catch (error) {
//       resultBox.innerHTML = `❌ Error: ${error.message}`;
//     }
//   });


document.getElementById("searchTailBtn").addEventListener("click", async () => {
    const tailNumber = tailInput.value.trim().toUpperCase();
   const resultBox = document.getElementById("aircraftResult");

    if (!tailNumber) {
      resultBox.innerHTML = "<p>Please enter a valid tail number.</p>";
      return;
    }
  
    resultBox.innerHTML = "<p>Fetching aircraft data...</p>";
  
    try {
      const response = await fetch(`https://aerodatabox.p.rapidapi.com/aircrafts/reg/${tailNumber}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': '27cab1653emsh0744570b575fc80p110c9cjsn8d2ba5c68db3',
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
        }
      });
  
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
  
      // Try fetching the aircraft image
      let imageHTML = '';
      try {
        const imageResponse = await fetch(`https://aerodatabox.p.rapidapi.com/aircrafts/reg/${tailNumber}/image/beta`, {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': '27cab1653emsh0744570b575fc80p110c9cjsn8d2ba5c68db3',
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
          }
        });
  
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData && imageData.url) {
            imageHTML = `<div><img src="${imageData.url}" alt="Aircraft Image" style="max-width:100%; margin-top: 10px; border-radius: 8px;" /></div>`;
          }
        }
      } catch (imgErr) {
        console.warn("Could not fetch aircraft image", imgErr);
      }
  
      resultBox.innerHTML = `
        <strong>Model:</strong> ${data.model || 'N/A'}<br>
        <strong>Manufacturer:</strong> ${data.manufacturer || 'N/A'}<br>
        <strong>First Flight:</strong> ${data.firstFlightDate || 'N/A'}<br>
        <strong>Age:</strong> ${data.ageYears ? data.ageYears + " years" : 'N/A'}<br>
        <strong>Owner:</strong> ${data.owner || 'N/A'}
        ${imageHTML}
      `;
    } catch (error) {
      console.error(error);
      resultBox.innerHTML = "<p>Error retrieving data. Try again later.</p>";
    }
  });
  