// Test if JS is loading
console.log("JS LOADED");

// Connect to Supabase
const SUPABASE_URL = "https://jvjognshdiyidvhhzlbd.supabase.co";
const SUPABASE_KEY = "sb_publishable_GLP0p0tvCCAnG-aNru4RPw_Ng5_4Qnd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SIGN UP (GLOBAL)
window.signUp = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  const { error: insertError } = await supabaseClient.from("users").insert([
    {
      id: user.id,
      email: email,
      role: role
    }
  ]);

  if (insertError) {
    console.log(insertError);
    alert(insertError.message);
    return;
  }

  alert("Signup successful!");
};

// LOGIN (GLOBAL)
window.login = async function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  const { data: userData, error: roleError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (roleError) {
    alert("Error fetching role");
    return;
  }

  const role = userData.role;
  // ✅ ADD THIS BLOCK
if (userData.active === false) {
  alert("Your account has been deactivated");
  return;
}
  //store session locally for page protection
  localStorage.setItem("currentUser", JSON.stringify({
  id: user.id,
  email: user.email,
  role: role,
  can_update_fuel: userData.can_update_fuel
   }));

  //redirect based on role
  if (role === "admin") {
    window.location.href = "admin.html";
  } else if (role === "seller") {
    window.location.href = "seller.html";
  } else {
    window.location.href = "dashboard.html";
  }
  };

  // =====GET CURRENT USER==========
window.getCurrentUser =  function() {
  return JSON.parse(localStorage.getItem("currentUser"));
  };
  
  // CHECK USER (PAGE PROTECTION)
window.checkUser = function (requiredRole) {
  const user = window.getCurrentUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert("Access denied!");
    window.location.href = "login.html";
    return;
  }
};

// ================= LOGOUT FUNCTION =================
window.logout = async function () {
  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.log("Supabase logout error ignored:", e);
  }

  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
};

// ================= BUTTON BINDING =================
document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("logoutBtn");

  if (btn) {
    btn.addEventListener("click", function () {
      window.logout(); // ✅ FIXED HERE
    });
  }

});

// =============== AUTO REDIRECT IF LOGGED IN =================
window.redirectIfLoggedIn = function () {

  const user = window.getCurrentUser();

  if (!user) return;

  // ONLY redirect if user is NOT already on login page
  if (!window.location.href.includes("login.html")) {
    window.location.href = "dashboard.html";
  }
};

// ================= LOAD USERS =================
window.loadUsers = async function () {

  const { data, error } = await supabaseClient
    .from("users")
    .select("*");

  if (error) {
    console.log(error);
    return;
  }

  const container = document.getElementById("userList");
  if (!container) return;

  container.innerHTML = "";

  // ✅ ADD THIS
data.sort((a, b) => {
  const order = { admin: 1, seller: 2, customer: 3 };
  return order[a.role] - order[b.role];
});

// THEN LOOP
 data.forEach(user => {

  const currentUser = getCurrentUser();
  const isCurrentUser = currentUser && user.id === currentUser.id;

  container.innerHTML += `
    <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
      
      <p><b>${user.email}</b></p>
      <p>Role: ${user.role}</p>
      <p>Status: ${user.active ? "Active" : "Deactivated"}</p>

      ${
        isCurrentUser 
        ? `<p><i>You (Admin)</i></p>` 
        : `
          <button onclick="toggleUserStatus('${user.id}', ${user.active})">
            ${user.active ? "Deactivate" : "Activate"}
          </button>

          <button onclick="toggleFuelPermission('${user.id}', ${user.can_update_fuel})">
            ${user.can_update_fuel ? "Revoke Fuel Access" : "Approve Fuel Access"}
          </button>

          <button onclick="deleteUser('${user.id}')">Delete</button>
        `
      }

    </div>
  `;
});
};

// ================= TOGGLE USER STATUS =================
window.toggleUserStatus = async function (id, currentStatus) {

  const { error } = await supabaseClient
    .from("users")
    .update({ active: !currentStatus })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("User status updated!");

  loadUsers();
};

// ================= ADD STATION =================
window.addStation = async function () {

  const name = document.getElementById("stationName").value;
  const location = document.getElementById("stationLocation").value;
  const imageFile = document.getElementById("stationImage").files[0];

  // ✅ NEW: GET LAT & LNG
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);

  const user = window.getCurrentUser();

  if (!user) {
    alert("You must be logged in");
    return;
  }

  // ✅ OPTIONAL VALIDATION (RECOMMENDED)
  if (isNaN(lat) || isNaN(lng)) {
    alert("Please enter valid latitude and longitude");
    return;
  }

  let imageUrl = "";

  // upload image to supabase storage
  if (imageFile) {
    const fileName = Date.now() + "_" + imageFile.name;

    const { error: uploadError } = await supabaseClient.storage
      .from("station-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data } = supabaseClient.storage
      .from("station-images")
      .getPublicUrl(fileName);

    imageUrl = data.publicUrl;
  }

  // ✅ INSERT WITH LAT & LNG
  const { error } = await supabaseClient.from("stations").insert([
    {
      name,
      location,
      owner_id: user.id,
      image_url: imageUrl,
      status: "pending",
      lat: lat,
      lng: lng
    }
  ]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Station submitted!");
};

// ================= LOAD PENDING STATIONS =================
window.loadPendingStations = async function () {

  const { data, error } = await supabaseClient
    .from("stations")
    .select("*")
    .eq("status", "pending");

  if (error) {
    console.log(error);
    return;
  }

  const container = document.getElementById("stationList");

  if (!container) return;

  container.innerHTML = "";

  data.forEach(station => {
    container.innerHTML += `
      <div>
        <p><b>${station.name}</b> - ${station.location}</p>
         <button onclick="approveStation('${station.id}')">Approve</button>
         <button onclick="rejectStation('${station.id}')">Reject</button>
        </div>
      <hr>
    `;
  });
  };

// ================= APPROVE STATION =================
window.approveStation = async function (id) {

  const { data, error } = await supabaseClient
    .from("stations")
    .update({ status: "approved" })
    .eq("id", id)
    .select(); // 👈 VERY IMPORTANT

  if (error) {
    console.log("Approve error:", error);
    alert(error.message);
    return;
  }

  console.log("Updated row:", data);

  alert("Station approved!");

  loadPendingStations(); // refresh list
};


// ================= REJECT STATION =================
window.rejectStation = async function (id) {

  const { error } = await supabaseClient
    .from("stations")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Station rejected!");

  loadPendingStations();
};

// ================= LOAD APPROVED STATIONS =================
window.loadApprovedStations = async function (search = "", fuel = "", maxPrice = "") {

  const { data, error } = await supabaseClient
    .from("stations")
    .select("*")
    .eq("status", "approved");

  if (error) {
    console.log("Error loading stations:", error);
    return;
  }

  // ✅ STEP 3: SEARCH FILTER
  let filteredData = data;

  if (search) {
    filteredData = filteredData.filter(station =>
      station.name.toLowerCase().includes(search.toLowerCase()) ||
      station.location.toLowerCase().includes(search.toLowerCase())
    );
  }

  // ✅ STEP 3 (PHASE 2): FUEL FILTER  ← ADD THIS HERE
  if (fuel) {
    filteredData = filteredData.filter(station => station[fuel] === true);
  }

  // ✅ STEP 3 (PHASE 3): PRICE FILTER ← ADD THIS HERE
  if (maxPrice && fuel) {
    const priceField = fuel + "_price";

    filteredData = filteredData.filter(station =>
      station[priceField] && station[priceField] <= maxPrice
    );
  }

  const container = document.getElementById("approvedStations");
  if (!container) return;

  container.innerHTML = "";

  // ✅ STEP 4: USE FILTERED DATA
  if (!filteredData || filteredData.length === 0) {
    container.innerHTML = "<p>No stations found</p>";
    return;
  }

  // ✅ STEP 4: LOOP FILTERED DATA
  filteredData.forEach(station => {
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:15px; margin-bottom:15px; border-radius:8px;">
        
        <h2>${station.name}</h2>
        <p><b>Location:</b> ${station.location}</p>

        ${station.image_url ? `<img src="${station.image_url}" width="200">` : ""}

        <hr>

        <p>
          <b>Petrol:</b> 
          ${station.petrol ? "Available ✅" : "Not Available ❌"}
          ${station.petrol ? ` — ₦${station.petrol_price}` : ""}
        </p>

        <p>
          <b>Diesel:</b> 
          ${station.diesel ? "Available ✅" : "Not Available ❌"}
          ${station.diesel ? ` — ₦${station.diesel_price}` : ""}
        </p>

        <p>
          <b>Kerosene:</b> 
          ${station.kerosene ? "Available ✅" : "Not Available ❌"}
          ${station.kerosene ? ` — ₦${station.kerosene_price}` : ""}
        </p>

      </div>
    `;
  });
};

// ================= LOAD ALL STATIONS =================
window.loadAllStations = async function () {

  const { data, error } = await supabaseClient
    .from("stations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error loading stations:", error);
    return;
  }

  const container = document.getElementById("allStations");
  if (!container) return;

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No stations found</p>";
    return;
  }

  data.forEach(station => {
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
        <h3>${station.name}</h3>
        <p><b>Location:</b> ${station.location}</p>
        <p><b>Status:</b> ${station.status}</p>

        ${station.image_url 
          ? `<img src="${station.image_url}" width="150">`
          : `<p>No image</p>`
        }

        <br><br>

        <button onclick="editStation('${station.id}', '${station.name}', '${station.location}')">Edit</button>
        <button onclick="deleteStation('${station.id}')">Delete</button>
      </div>
    `;
  });
};

// ================= EDIT STATION =================
window.editStation = async function (id, oldName, oldLocation) {

  const newName = prompt("Enter new station name:", oldName);
  const newLocation = prompt("Enter new location:", oldLocation);

  if (!newName || !newLocation) {
    alert("Update cancelled");
    return;
  }

  const { error } = await supabaseClient
    .from("stations")
    .update({
      name: newName,
      location: newLocation
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Station updated!");

  loadAllStations(); // refresh
};

// ================= DELETE STATION =================
window.deleteStation = async function (id) {

  const confirmDelete = confirm("Are you sure you want to delete this station?");
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("stations")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Station deleted!");

  loadAllStations(); // refresh
};

// ================= LOAD SELLER STATIONS (DISPLAY) =================
window.loadMyStations = async function () {

  const user = window.getCurrentUser();
  if (!user) return;

  const { data, error } = await supabaseClient
    .from("stations")
    .select("*")
    .eq("owner_id", user.id);

  if (error) {
    console.log(error);
    return;
  }

  const container = document.getElementById("myStations");
  if (!container) return;

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No stations added yet</p>";
    return;
  }

  data.forEach(station => {
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
        <h3>${station.name}</h3>
        <p><b>Location:</b> ${station.location}</p>
        <p><b>Status:</b> ${station.status}</p>

        ${station.image_url 
          ? `<img src="${station.image_url}" width="150">`
          : ""
        }
      </div>
    `;
  });
};

// ================= TOGGLE FUEL PERMISSION =================
window.toggleFuelPermission = async function (id, currentStatus) {

  const { error } = await supabaseClient
    .from("users")
    .update({ can_update_fuel: !currentStatus })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Fuel permission updated!");

  loadUsers(); // refresh UI
};

// ================= LOAD SELLER STATIONS (DROPDOWN) =================
window.loadSellerStations = async function () {

  const user = getCurrentUser();
  if (!user) return;

  const { data, error } = await supabaseClient
    .from("stations")
    .select("*")
    .eq("owner_id", user.id);

  if (error) {
    console.log(error);
    return;
  }

  const select = document.getElementById("stationSelect");
  if (!select) return;

  select.innerHTML = "<option value=''>Select Station</option>";

  if (!data || data.length === 0) return;

  data.forEach(station => {
    select.innerHTML += `
      <option value="${station.id}">${station.name}</option>
    `;
  });
};
// ================= UPDATE FUEL =================
window.updateFuel = async function () {

  const user = getCurrentUser();

  // ✅ 1. Ensure user exists
  if (!user) {
    alert("You must be logged in");
    window.location.href = "login.html";
    return;
  }

  // ✅ 2. FIXED PERMISSION CHECK
  if (!user.can_update_fuel) {
    alert("You are not approved to update fuel");
    return;
  }

  // ✅ 3. Get selected station
  const stationId = document.getElementById("stationSelect").value;

  if (!stationId) {
    alert("Please select a station");
    return;
  }

  // ✅ 4. Get fuel values
  const petrol = document.getElementById("petrol").value === "true";
  const diesel = document.getElementById("diesel").value === "true";
  const kerosene = document.getElementById("kerosene").value === "true";
  const petrol_price = document.getElementById("petrolPrice").value;
  const diesel_price = document.getElementById("dieselPrice").value;
  const kerosene_price = document.getElementById("kerosenePrice").value;

  console.log("Updating:", { stationId, petrol, diesel, kerosene });

  // ✅ 5. Update database
  const { error } = await supabaseClient
    .from("stations")
    .update({
  petrol,
  diesel,
  kerosene,
  petrol_price,
  diesel_price,
  kerosene_price
})
    .eq("id", stationId);

  if (error) {
    console.log("Update error:", error);
    alert(error.message);
    return;
  }

  alert("Fuel updated successfully!");
};
