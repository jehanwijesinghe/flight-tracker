
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

const db = firebase.firestore();

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("login-error");

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "dashboard.html"; // redirect to main dashboard
  } catch (error) {
    console.error("Login failed:", error);
    errorMessage.textContent = error.message;
  }
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