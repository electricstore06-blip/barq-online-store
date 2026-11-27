
import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

function showMessage(message, isError = true) {
  loginMessage.textContent = message;
  loginMessage.style.color = isError ? "#ff7777" : "#7ee787";
}

async function identifyUser(user) {

  // 1. Check whether this account is an Admin.
  const adminRef = doc(db, "admins", user.uid);
  const adminSnapshot = await getDoc(adminRef);

  if (adminSnapshot.exists()) {
    const adminData = adminSnapshot.data();

    if (adminData.role === "admin") {
      return "admin";
    }

    throw new Error("This Admin account does not have a valid role.");
  }

  // 2. Check Supervisor and Driver accounts.
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();
    const role = String(userData.role || "").toLowerCase();

    if (userData.active !== true) {
      throw new Error("Your account is inactive. Please contact Admin.");
    }

    if (role === "supervisor") {
      return "supervisor";
    }

    if (role === "driver") {
      return "driver";
    }

    if (role === "staff") {
      throw new Error("This staff account does not have a dashboard yet.");
    }

    throw new Error("Your account has an unsupported role.");
  }

  // 3. Existing customer accounts are authenticated
  // through Firebase Authentication without a staff profile.
  return "customer";
}

function redirectToDashboard(role) {

  const destinations = {
    admin: "admin-dashboard.html",
    supervisor: "supervisor-dashboard.html",
    driver: "driver-dashboard.html",
    customer: "index.html"
  };

  const destination = destinations[role];

  if (!destination) {
    throw new Error("Unable to identify your BARQ dashboard.");
  }

  window.location.replace(destination);
}

loginForm.addEventListener("submit", async function (event) {

  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("Please enter your email and password.");
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  showMessage("");

  let signedInUser = null;

  try {

    // Sign in using the existing BARQ Firebase project.
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    signedInUser = credential.user;

    // Identify the account's role.
    const role = await identifyUser(signedInUser);

    showMessage("Login successful. Opening your dashboard...", false);

    redirectToDashboard(role);

  } catch (error) {

    console.error("BARQ login error:", error);

    // Sign out accounts that authenticated but were not authorized.
    if (signedInUser) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Sign-out error:", signOutError);
      }
    }

    if (error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password") {

      showMessage("Incorrect email or password.");

    } else if (error.code === "auth/too-many-requests") {

      showMessage("Too many attempts. Please try again later.");

    } else if (error.code === "auth/network-request-failed") {

      showMessage("Network error. Please check your internet connection.");

    } else {

      showMessage(error.message || "Login failed. Please try again.");
    }

    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }

});
