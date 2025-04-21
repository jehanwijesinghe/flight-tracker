
const firebaseConfig = {
    apiKey: "AIzaSyBwocbbt1evr1w7bTTmg1ng_nzSq58Ym1A",
    authDomain: "flight-logger-a7a62.firebaseapp.com",
    projectId: "flight-logger-a7a62",
    storageBucket: "flight-logger-a7a62.firebasestorage.app",
    messagingSenderId: "407134528805",
    appId: "1:407134528805:web:bdd50fbdaf002e745ba6cc",
    measurementId: "G-0Q0R6BCDD7"
  };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting the usual way
  
    // Get the form values
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    // Validate the inputs (e.g., check if any field is empty)
    if (!firstName || !lastName || !email || !password) {
      document.getElementById('signup-error').textContent = 'Please fill in all fields.';
      return;
    }
  
    // Firebase Authentication: Create user with email and password
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // User registered successfully
        const user = userCredential.user;
  
        // Update the user profile with first name and last name
        return user.updateProfile({
          displayName: `${firstName} ${lastName}`
        });
      })
      .then(() => {
        // Show SweetAlert success notification after registration
        Swal.fire({
          title: 'Success!',
          text: 'Account created successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          window.location.href = 'index.html'; // Redirect to login page after success
        });
      })
      .catch((error) => {
        // Handle errors here
        const errorCode = error.code;
        const errorMessage = error.message;
        document.getElementById('signup-error').textContent = errorMessage;
      });
  });

  
const googleButton = document.getElementById("google-signin");

googleButton.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    // Optional: If this is their first login, save user data to Firestore
    if (result.additionalUserInfo.isNewUser) {
      await db.collection("users").doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        provider: "google",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // Redirect to dashboard
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    document.getElementById("login-error").textContent = error.message;
  }
});