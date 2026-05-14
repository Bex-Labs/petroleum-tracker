// ============================================================
// PETROTRACK — app.js  (clean unified version)
// ============================================================
console.log("PetroTrack JS loaded");

// ── Supabase init ──────────────────────────────────────────
const SUPABASE_URL = "https://jvjognshdiyidvhhzlbd.supabase.co";
const SUPABASE_KEY = "sb_publishable_GLP0p0tvCCAnG-aNru4RPw_Ng5_4Qnd";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// AUTH — Sign Up
// ============================================================
window.signUp = async function () {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role     = document.getElementById("role").value;

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) { alert(error.message); return; }

  const { error: insertError } = await supabaseClient.from("users").insert([{
    id: data.user.id, email, role
  }]);
  if (insertError) { alert(insertError.message); return; }
  alert("Signup successful! Please check your email to confirm.");
};

// ── Styled Sign Up (index.html role-card version) ──────────
window.styledSignUp = async function () {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role     = document.getElementById("role").value;
  const errEl    = document.getElementById("signupError");
  const okEl     = document.getElementById("signupSuccess");
  const btn      = document.getElementById("signupBtn");

  if (errEl) errEl.classList.remove("show");
  if (okEl)  okEl.classList.remove("show");

  if (!email || !password) {
    if (errEl) { errEl.textContent = "Please fill in all fields."; errEl.classList.add("show"); }
    return;
  }
  if (password.length < 6) {
    if (errEl) { errEl.textContent = "Password must be at least 6 characters."; errEl.classList.add("show"); }
    return;
  }

  if (btn) { btn.textContent = "Creating account…"; btn.disabled = true; }

  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;

    const { error: insertError } = await supabaseClient.from("users").insert([{
      id: data.user.id, email, role
    }]);
    if (insertError) throw insertError;

    if (okEl) { okEl.textContent = "Account created! Check your email to confirm, then sign in."; okEl.classList.add("show"); }
    if (btn)  { btn.textContent = "Account Created ✓"; btn.disabled = true; }
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.add("show"); }
    if (btn)   { btn.textContent = "Create Account →"; btn.disabled = false; }
  }
};

// ============================================================
// AUTH — Login (original plain version)
// ============================================================
window.login = async function () {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); return; }

  const { data: userData, error: roleError } = await supabaseClient
    .from("users").select("*").eq("id", data.user.id).single();
  if (roleError) { alert("Error fetching role"); return; }

  if (userData.active === false) { alert("Your account has been deactivated"); return; }

  localStorage.setItem("currentUser", JSON.stringify({
    id: data.user.id, email: data.user.email,
    role: userData.role, can_update_fuel: userData.can_update_fuel
  }));

  if (userData.role === "admin")       window.location.href = "admin.html";
  else if (userData.role === "seller") window.location.href = "seller.html";
  else                                  window.location.href = "dashboard.html";
};

// ── Styled Login (login.html role-card version) ────────────
window.styledLogin = async function () {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const role     = document.querySelector('input[name="loginRole"]:checked')?.value;
  const errEl    = document.getElementById("loginError");
  const btn      = document.querySelector('.btn-primary');

  if (errEl) errEl.classList.remove("show");

  if (!email || !password) {
    if (errEl) { errEl.textContent = "Please enter your email and password."; errEl.classList.add("show"); }
    return;
  }

  if (btn) { btn.textContent = "Signing in…"; btn.disabled = true; }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: userData, error: roleError } = await supabaseClient
      .from("users").select("*").eq("id", data.user.id).single();
    if (roleError) throw roleError;

    if (userData.active === false) throw new Error("Your account has been deactivated. Contact admin.");
    if (userData.role === "admin") throw new Error("Admin accounts must use the Admin Portal.");
    if (userData.role !== role)    throw new Error(`This account is registered as a ${userData.role}, not a ${role}. Please select the correct role.`);

    localStorage.setItem("currentUser", JSON.stringify({
      id: data.user.id, email: data.user.email,
      role: userData.role, can_update_fuel: userData.can_update_fuel
    }));

    window.location.href = userData.role === "seller" ? "seller.html" : "dashboard.html";
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.add("show"); }
    if (btn)   { btn.textContent = "Sign In →"; btn.disabled = false; }
  }
};

// ── Admin Login ────────────────────────────────────────────
window.adminLogin = async function () {
  const email    = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  const errEl    = document.getElementById("adminError");
  const btn      = document.getElementById("adminLoginBtn");

  if (errEl) errEl.classList.remove("show");

  if (!email || !password) {
    if (errEl) { errEl.textContent = "Please enter your email and password."; errEl.classList.add("show"); }
    return;
  }

  if (btn) { btn.textContent = "Verifying credentials…"; btn.disabled = true; }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: userData, error: roleError } = await supabaseClient
      .from("users").select("*").eq("id", data.user.id).single();
    if (roleError) throw roleError;

    if (userData.role !== "admin") {
      await supabaseClient.auth.signOut();
      throw new Error("Access denied. This portal is for administrators only.");
    }
    if (userData.active === false) throw new Error("This admin account has been deactivated.");

    localStorage.setItem("currentUser", JSON.stringify({
      id: data.user.id, email: data.user.email,
      role: "admin", can_update_fuel: userData.can_update_fuel
    }));

    window.location.href = "admin.html";
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.classList.add("show"); }
    if (btn)   { btn.textContent = "Access Command Center →"; btn.disabled = false; }
  }
};

// ============================================================
// AUTH — Session helpers
// ============================================================
window.getCurrentUser = function () {
  return JSON.parse(localStorage.getItem("currentUser"));
};

window.getUserDetails = async function () {
  const stored = window.getCurrentUser();
  if (!stored) return null;
  const { data, error } = await supabaseClient.from("users").select("*").eq("id", stored.id).single();
  return error ? stored : data;
};

window.checkUser = function (requiredRole) {
  const user = window.getCurrentUser();
  if (!user) { window.location.href = "login.html"; return; }
  if (requiredRole && user.role !== requiredRole) {
    alert("Access denied!");
    window.location.href = requiredRole === "admin" ? "admin-login.html" : "login.html";
  }
};

window.logout = async function () {
  try { await supabaseClient.auth.signOut(); } catch (e) {}
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
};

// ── Bind logout button on every page ──────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logoutBtn");
  if (btn) btn.addEventListener("click", window.logout);

  // Sync role radio → hidden select on signup page
  document.querySelectorAll('input[name="signupRole"]').forEach(r => {
    r.addEventListener("change", () => {
      const sel = document.getElementById("role");
      if (sel) sel.value = r.value;
    });
  });
});

// ============================================================
// ADMIN — Load Users (styled table rows)
// ============================================================
window.loadUsers = async function () {
  const { data, error } = await supabaseClient.from("users").select("*");
  if (error) { console.error(error); return; }

  const tbody = document.getElementById("userList");
  if (!tbody) return;

  const statEl = document.getElementById("statUsers");
  if (statEl) statEl.textContent = data.length;

  data.sort((a, b) => ({ admin:1, seller:2, customer:3 }[a.role] - { admin:1, seller:2, customer:3 }[b.role]));

  const currentUser = getCurrentUser();

  tbody.innerHTML = data.map(user => {
    const isMe      = currentUser && user.id === currentUser.id;
    const initials  = user.email.slice(0, 2).toUpperCase();
    const roleBadge = `<span class="badge badge-${user.role}">${user.role}</span>`;
    const statusBadge = user.active !== false
      ? `<span class="badge badge-active"><span class="badge-dot"></span> Active</span>`
      : `<span class="badge badge-inactive">Deactivated</span>`;
    const flagBadge = user.flagged
      ? `<span class="badge badge-limited" style="margin-left:4px;">🚩 Flagged</span>` : "";

    const actions = isMe
      ? `<span class="badge" style="color:var(--text-3);">You (Admin)</span>`
      : `<div class="action-btns">
          <button class="btn btn-ghost btn-sm"
            onclick="toggleUserStatus('${user.id}', ${user.active !== false})">
            ${user.active !== false ? "Deactivate" : "Activate"}
          </button>
          <button class="btn btn-${user.can_update_fuel ? 'danger' : 'success'} btn-sm"
            onclick="toggleFuelPermission('${user.id}', ${!!user.can_update_fuel})">
            ${user.can_update_fuel ? "Revoke Fuel" : "Approve Fuel"}
          </button>
          <button class="btn btn-amber btn-sm"
            onclick="flagUser('${user.id}', '${user.email.replace(/'/g,"\\'")}', ${!!user.flagged})">
            ${user.flagged ? "Unflag" : "🚩 Flag"}
          </button>
          <button class="btn btn-danger btn-sm"
            onclick="deleteUser('${user.id}')">Delete</button>
        </div>`;

    return `<tr>
      <td>
        <div class="user-cell">
          <div class="user-avatar">${initials}</div>
          <div>
            <div class="user-email">${user.email}</div>
            ${flagBadge}
          </div>
        </div>
      </td>
      <td>${roleBadge}</td>
      <td>${statusBadge}</td>
      <td>${actions}</td>
    </tr>`;
  }).join("");
};

// ============================================================
// ADMIN — User Actions
// ============================================================
window.toggleUserStatus = async function (id, currentlyActive) {
  const { error } = await supabaseClient.from("users")
    .update({ active: !currentlyActive }).eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  showToast(`User ${currentlyActive ? "deactivated" : "activated"}.`, "success");
  loadUsers();
};

window.toggleFuelPermission = async function (id, currentStatus) {
  const { error } = await supabaseClient.from("users")
    .update({ can_update_fuel: !currentStatus }).eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  showToast(`Fuel permission ${currentStatus ? "revoked" : "granted"}.`, "success");
  loadUsers();
};

window.deleteUser = async function (id) {
  if (!confirm("Permanently delete this user? This cannot be undone.")) return;
  const { error } = await supabaseClient.from("users").delete().eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  showToast("User deleted.", "success");
  loadUsers();
};

window.flagUser = async function (userId, userEmail, currentFlagged) {
  const action = currentFlagged ? "unflag" : "flag";
  if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user ${userEmail}?`)) return;
  const { error } = await supabaseClient.from("users")
    .update({ flagged: !currentFlagged }).eq("id", userId);
  if (error) { showToast(error.message, "error"); return; }
  showToast(`User ${action}ged.`, currentFlagged ? "success" : "warning");
  loadUsers();
};

// ============================================================
// ADMIN — Stations: Pending Queue
// ============================================================
window.loadPendingStations = async function () {
  const { data, error } = await supabaseClient.from("stations").select("*").eq("status", "pending");
  if (error) { console.error(error); return; }

  const container = document.getElementById("stationList");
  if (!container) return;

  const badge = document.getElementById("pendingCount");
  if (badge) badge.textContent = `${data.length} NEW`;

  if (!data.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">No pending stations</div></div>`;
    return;
  }

  container.innerHTML = data.map(s => `
    <div class="queue-card">
      ${s.image_url
        ? `<img src="${s.image_url}" class="queue-card-img" alt="${s.name}">`
        : `<div class="queue-card-img-placeholder">⛽</div>`}
      <div class="queue-card-body">
        <div class="queue-card-name">${s.name}</div>
        <div class="queue-card-meta">📍 ${s.location.toUpperCase()}</div>
        <div class="queue-card-actions">
          <button class="btn btn-success btn-sm" style="flex:1;justify-content:center;"
            onclick="approveStation('${s.id}')">✓ VERIFY</button>
          <button class="btn btn-danger btn-sm" style="flex:1;justify-content:center;"
            onclick="rejectStation('${s.id}')">✕ DECLINE</button>
        </div>
      </div>
    </div>`).join("");
};

window.approveStation = async function (id) {
  const { error } = await supabaseClient.from("stations")
    .update({ status: "approved" }).eq("id", id).select();
  if (error) { showToast(error.message, "error"); return; }
  showToast("Station approved!", "success");
  loadPendingStations();
  loadAllStations();
};

window.rejectStation = async function (id) {
  const { error } = await supabaseClient.from("stations")
    .update({ status: "rejected" }).eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  showToast("Station rejected.", "warning");
  loadPendingStations();
  loadAllStations();
};

// ============================================================
// ADMIN — Stations: Manage All
// ============================================================
window.loadAllStations = async function () {
  const { data, error } = await supabaseClient.from("stations")
    .select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return; }

  const container = document.getElementById("allStations");
  if (!container) return;

  const statEl = document.getElementById("statStations");
  if (statEl) statEl.textContent = data.length;

  if (!data.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">⛽</div><div class="empty-text">No stations found</div></div>`;
    return;
  }

  const statusBadge = s => ({
    approved: `<span class="badge badge-approved"><span class="badge-dot"></span> OPERATIONAL</span>`,
    pending:  `<span class="badge badge-pending">PENDING</span>`,
    rejected: `<span class="badge badge-rejected">REJECTED</span>`
  }[s.status] || `<span class="badge">${s.status}</span>`);

  container.innerHTML = data.map(s => `
    <div class="station-row">
      <div class="station-thumb">
        ${s.image_url ? `<img src="${s.image_url}" alt="${s.name}">` : "⛽"}
      </div>
      <div class="station-row-info">
        <div class="station-row-name">${s.name}</div>
        <div class="station-row-loc">📍 ${s.location}</div>
      </div>
      <div class="station-row-meta">
        ${statusBadge(s)}
        <div class="action-btns" style="margin-top:6px;">
          <button class="btn btn-ghost btn-sm"
            onclick="editStation('${s.id}','${s.name.replace(/'/g,"\\'")}','${s.location.replace(/'/g,"\\'")}')">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteStation('${s.id}')">Delete</button>
        </div>
      </div>
    </div>`).join('<div style="height:1px;background:rgba(37,44,61,0.5);"></div>');
};

window.editStation = async function (id, oldName, oldLocation) {
  // If called from reports panel, location may be empty — fetch current values from DB
  let currentName     = oldName;
  let currentLocation = oldLocation;

  if (!currentLocation) {
    const { data, error: fetchErr } = await supabaseClient
      .from("stations").select("name, location").eq("id", id).single();
    if (!fetchErr && data) {
      currentName     = data.name;
      currentLocation = data.location;
    }
  }

  const newName = prompt("Edit station name:", currentName);
  if (newName === null) { showToast("Edit cancelled.", "info"); return; }
  const newLocation = prompt("Edit location:", currentLocation);
  if (newLocation === null) { showToast("Edit cancelled.", "info"); return; }

  if (!newName.trim() || !newLocation.trim()) {
    showToast("Name and location cannot be empty.", "error"); return;
  }

  const { error } = await supabaseClient.from("stations")
    .update({ name: newName.trim(), location: newLocation.trim() }).eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  showToast("Station updated successfully!", "success");

  // Refresh the correct panel depending on who is logged in
  const user = window.getCurrentUser();
  if (user && user.role === "admin") {
    loadAllStations();
  } else if (user && user.role === "seller") {
    loadMyStations();
    loadSellerStations();
  }
  // Refresh reports panel so station name updates reflect
  if (typeof loadReports === "function") loadReports();
};

window.deleteStation = async function (id) {
  if (!confirm("Delete this station? This cannot be undone.")) return;
  const { error } = await supabaseClient.from("stations").delete().eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  showToast("Station deleted.", "success");
  loadAllStations();
  loadPendingStations();
};

// ============================================================
// REPORTS — Role-aware loader
// Admin  → sees ALL reports
// Seller → sees ONLY reports whose station.owner_id = currentUser.id
// ============================================================
window.loadReports = async function () {
  const container = document.getElementById("reportsList");
  if (!container) return;

  const user = window.getCurrentUser();
  if (!user) {
    console.warn("[loadReports] No current user found.");
    return;
  }

  console.log("[loadReports] Current user:", user.id, "| role:", user.role);

  let reports = [];

  if (user.role === "admin") {
    // ── Admin: fetch every report ───────────────────────────
    console.log("[loadReports] Admin path → fetching all reports");

    const { data, error } = await supabaseClient
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { console.error("[loadReports] Admin fetch error:", error); return; }

    reports = data || [];
    console.log("[loadReports] Admin → total reports fetched:", reports.length);

  } else if (user.role === "seller") {
    // ── Seller: Step 1 — get all station IDs owned by this seller ──
    console.log("[loadReports] Seller path → fetching stations for owner_id:", user.id);

    const { data: stations, error: stErr } = await supabaseClient
      .from("stations")
      .select("id, name")
      .eq("owner_id", user.id);

    if (stErr) { console.error("[loadReports] Stations fetch error:", stErr); return; }

    console.log("[loadReports] Seller stations found:", stations?.length ?? 0, stations?.map(s => s.name));

    if (!stations || stations.length === 0) {
      console.log("[loadReports] Seller has no stations — no reports to show.");
      container.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">No reports yet — you have no stations.</div></div>`;
      return;
    }

    // ── Seller: Step 2 — fetch reports WHERE station_id IN [seller's station IDs] ──
    const stationIds = stations.map(s => s.id);
    console.log("[loadReports] Seller station IDs to filter by:", stationIds);

    const { data, error } = await supabaseClient
      .from("reports")
      .select("*")
      .in("station_id", stationIds)
      .order("created_at", { ascending: false });

    if (error) { console.error("[loadReports] Reports fetch error:", error); return; }

    reports = data || [];
    console.log("[loadReports] Seller → reports matching their stations:", reports.length);

  } else {
    console.warn("[loadReports] Unknown role — access denied.");
    return;
  }

  // ── Render ─────────────────────────────────────────────────
  if (!reports.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">No reports submitted yet</div></div>`;
    return;
  }

  // Seller can Resolve + update station | Admin can Resolve + Dismiss
  const isSeller = user.role === "seller";
  const isAdmin  = user.role === "admin";

  container.innerHTML = reports.map(r => `
    <div class="station-row" style="flex-wrap:wrap;gap:8px;padding:12px 0;align-items:flex-start;">
      <div class="station-row-info" style="min-width:200px;">
        <div class="station-row-name">${r.station_name || "Unknown Station"}</div>
        <div class="station-row-loc">
          By: ${r.reporter_email || "Anonymous"} &nbsp;·&nbsp;
          ${(r.report_type || "").replace(/_/g, " ")}
        </div>
        ${r.note ? `<div class="station-row-loc" style="font-style:italic;margin-top:3px;">"${r.note}"</div>` : ""}
        <div class="station-row-loc" style="margin-top:3px;">${timeAgo(r.created_at)}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <span class="badge ${r.status === "resolved" ? "badge-approved" : "badge-pending"}">${r.status}</span>
        ${r.status === "pending" ? `
          <button class="btn btn-success btn-sm" onclick="resolveReport('${r.id}')">
            ✓ Resolve
          </button>
          ${isSeller ? `
          <button class="btn btn-ghost btn-sm"
            onclick="editStation('${r.station_id}','${(r.station_name || "").replace(/'/g,"\\'")}', null)">
            ✏ Update Station
          </button>` : ""}
          ${isAdmin ? `
          <button class="btn btn-danger btn-sm" onclick="dismissReport('${r.id}')">
            Dismiss
          </button>` : ""}
        ` : ""}
      </div>
    </div>
    <div style="height:1px;background:rgba(37,44,61,0.5);"></div>`).join("");
};

window.resolveReport = async function (id) {
  const { error } = await supabaseClient
    .from("reports").update({ status: "resolved" }).eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  console.log("[resolveReport] Report resolved:", id);
  showToast("Report marked as resolved.", "success");
  loadReports();
};

window.dismissReport = async function (id) {
  // Admin only — hard delete
  const user = window.getCurrentUser();
  if (!user || user.role !== "admin") {
    showToast("Only admins can dismiss reports.", "error"); return;
  }
  const { error } = await supabaseClient.from("reports").delete().eq("id", id);
  if (error) { showToast(error.message, "error"); return; }
  console.log("[dismissReport] Report dismissed:", id);
  showToast("Report dismissed.", "success");
  loadReports();
};

// ============================================================
// ADMIN — Broadcast Notifications
// target: "all"      → customers + sellers (NOT admin)
// target: "customer" → customers only
// target: "seller"   → sellers only
// Admin accounts never receive notifications
// ============================================================
window.sendBroadcast = async function () {
  const title   = document.getElementById("broadcastTitle")?.value.trim();
  const message = document.getElementById("broadcastMsg")?.value.trim();
  const type    = document.getElementById("broadcastType")?.value;
  const target  = document.getElementById("broadcastTarget")?.value || "all";
  const btn     = document.getElementById("broadcastBtn");

  if (!title)   { showToast("Please enter a title.", "error"); return; }
  if (!message) { showToast("Please enter a message.", "error"); return; }

  if (btn) { btn.textContent = "Sending…"; btn.disabled = true; }

  try {
    // Step 1 — fetch user IDs matching the target role (never admin)
    let query = supabaseClient.from("users").select("id, role").neq("role", "admin");

    if (target === "customer") {
      query = query.eq("role", "customer");
    } else if (target === "seller") {
      query = query.eq("role", "seller");
    }
    // "all" → no extra filter, fetches both customers and sellers

    const { data: users, error: userErr } = await query;
    if (userErr) throw userErr;

    if (!users || users.length === 0) {
      showToast("No users found for the selected target.", "warning");
      if (btn) { btn.textContent = "Send Notification →"; btn.disabled = false; }
      return;
    }

    // Step 2 — build one notification row per user (no null broadcast rows)
    const rows = users.map(u => ({
      user_id:  u.id,
      title,
      message,
      type,
      target,
      is_read:  false
    }));

    // Step 3 — bulk insert
    const { error: insertErr } = await supabaseClient.from("notifications").insert(rows);
    if (insertErr) throw insertErr;

    // Step 4 — clear form
    document.getElementById("broadcastTitle").value = "";
    document.getElementById("broadcastMsg").value   = "";

    const targetLabel = { all: "all users", customer: "customers", seller: "sellers" }[target];
    showToast(`Notification sent to ${users.length} ${targetLabel}!`, "success");

  } catch (err) {
    console.error("[sendBroadcast] Error:", err);
    showToast(err.message, "error");
  } finally {
    if (btn) { btn.textContent = "Send Notification →"; btn.disabled = false; }
  }
};

// Preview recipient count when target changes
window.previewBroadcastTarget = async function () {
  const target  = document.getElementById("broadcastTarget")?.value || "all";
  const preview = document.getElementById("broadcastPreview");
  if (!preview) return;

  let query = supabaseClient.from("users").select("id", { count: "exact", head: true }).neq("role", "admin");
  if (target === "customer") query = query.eq("role", "customer");
  else if (target === "seller") query = query.eq("role", "seller");

  const { count } = await query;
  const label = { all: "customers + sellers", customer: "customers", seller: "sellers" }[target];
  preview.textContent = `📬 This will notify ${count ?? "—"} ${label}`;
  preview.style.display = "block";
};

// ============================================================
// SELLER — Add Station
// ============================================================
window.addStation = async function () {
  const name      = document.getElementById("stationName")?.value.trim();
  const location  = document.getElementById("stationLocation")?.value.trim();
  const lat       = parseFloat(document.getElementById("lat")?.value);
  const lng       = parseFloat(document.getElementById("lng")?.value);
  const imageFile = document.getElementById("stationImage")?.files[0];
  const user      = window.getCurrentUser();

  if (!user)     { showToast("You must be logged in.", "error"); return; }
  if (!name)     { showToast("Please enter a station name.", "error"); return; }
  if (!location) { showToast("Please enter a location.", "error"); return; }
  if (isNaN(lat) || isNaN(lng)) { showToast("Please enter valid latitude and longitude.", "error"); return; }

  let imageUrl = "";
  if (imageFile) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("station-images").upload(fileName, imageFile);
    if (uploadError) { showToast(uploadError.message, "error"); return; }
    const { data } = supabaseClient.storage.from("station-images").getPublicUrl(fileName);
    imageUrl = data.publicUrl;
  }

  const { error } = await supabaseClient.from("stations").insert([{
    name, location, owner_id: user.id,
    image_url: imageUrl, status: "pending", lat, lng
  }]);
  if (error) { showToast(error.message, "error"); return; }

  showToast("Station submitted for approval!", "success");

  // Clear form
  ["stationName","stationLocation","lat","lng"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const img = document.getElementById("stationImage");
  if (img) img.value = "";
};

// ============================================================
// SELLER — Load My Stations (station cards)
// ============================================================
window.loadMyStations = async function () {
  const user = window.getCurrentUser();
  if (!user) return;

  const { data, error } = await supabaseClient.from("stations")
    .select("*").eq("owner_id", user.id);
  if (error) { console.error(error); return; }

  const container = document.getElementById("myStations");
  if (!container) return;

  const badge = document.getElementById("stationCount");
  if (badge) badge.textContent = `TOTAL: ${data ? data.length : 0} ACTIVE`;

  if (!data || !data.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">⛽</div><div class="empty-text">No stations added yet</div></div>`;
    return;
  }

  const statusBadge = s => ({
    approved: `<span class="badge badge-approved"><span class="badge-dot"></span> OPERATIONAL</span>`,
    pending:  `<span class="badge badge-pending">PENDING APPROVAL</span>`,
    rejected: `<span class="badge badge-rejected">REJECTED</span>`
  }[s.status] || `<span class="badge">${s.status}</span>`);

  container.innerHTML = data.map(s => `
    <div class="station-card">
      ${s.image_url
        ? `<img src="${s.image_url}" class="station-card-img" alt="${s.name}">`
        : `<div class="station-card-img-placeholder">⛽</div>`}
      <div class="station-card-content">
        <div class="station-card-header">
          <div>
            <div class="station-card-name">${s.name}</div>
            <div class="station-card-loc">📍 ${s.location}</div>
          </div>
          ${statusBadge(s)}
        </div>
        <div class="fuel-pills" style="margin-top:10px;">
          ${fuelPill("Petrol",   "⛽", s.petrol,   s.petrol_price)}
          ${fuelPill("Diesel",   "🛢", s.diesel,   s.diesel_price)}
          ${fuelPill("Kerosene", "🔥", s.kerosene, s.kerosene_price)}
          ${fuelPill("LPG",      "🫙", s.lpg,      s.lpg_price)}
        </div>
      </div>
    </div>`).join("");
};

// ============================================================
// SELLER — Load Stations into dropdown
// ============================================================
window.loadSellerStations = async function () {
  const user = window.getCurrentUser();
  if (!user) return;

  const { data, error } = await supabaseClient.from("stations")
    .select("*").eq("owner_id", user.id);
  if (error) { console.error(error); return; }

  const select = document.getElementById("stationSelect");
  if (!select) return;

  select.innerHTML = `<option value="">— Select a Station —</option>`;
  if (!data || !data.length) return;

  data.forEach(s => {
    select.innerHTML += `<option value="${s.id}">${s.name} (${s.status})</option>`;
  });
};

// ============================================================
// SELLER — Update Fuel Availability & Prices
// ============================================================
window.updateFuel = async function () {
  const user = window.getCurrentUser();
  if (!user)               { showToast("You must be logged in.", "error"); window.location.href = "login.html"; return; }
  if (!user.can_update_fuel) { showToast("You are not approved to update fuel. Contact admin.", "error"); return; }

  const stationId = document.getElementById("stationSelect")?.value;
  if (!stationId) { showToast("Please select a station.", "error"); return; }

  const getBool = id => document.getElementById(id)?.value === "true";
  const getVal  = id => document.getElementById(id)?.value || null;

  const petrol   = getBool("petrol");
  const diesel   = getBool("diesel");
  const kerosene = getBool("kerosene");
  const lpg      = getBool("lpg");

  const petrol_price   = getVal("petrolPrice");
  const diesel_price   = getVal("dieselPrice");
  const kerosene_price = getVal("kerosenePrice");
  const lpg_price      = getVal("lpgPrice");

  const { error } = await supabaseClient.from("stations")
    .update({ petrol, diesel, kerosene, lpg, petrol_price, diesel_price, kerosene_price, lpg_price })
    .eq("id", stationId);

  if (error) { showToast(error.message, "error"); return; }
  showToast("Fuel availability updated!", "success");
  loadMyStations();
};

// Sync toggle switch → hidden select
window.syncToggle = function (fuel, checked) {
  const sel = document.getElementById(fuel);
  if (sel) sel.value = checked ? "true" : "false";
};

// ============================================================
// CUSTOMER — Load Approved Stations (with Directions + Report)
// ============================================================
window.loadApprovedStations = async function (search = "", fuel = "", maxPrice = "") {
  const { data, error } = await supabaseClient.from("stations")
    .select("*").eq("status", "approved");
  if (error) { console.error(error); return; }

  let filtered = data || [];

  if (search) filtered = filtered.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location.toLowerCase().includes(search.toLowerCase())
  );
  if (fuel)     filtered = filtered.filter(s => s[fuel] === true);
  if (maxPrice && fuel) {
    filtered = filtered.filter(s => s[fuel + "_price"] && s[fuel + "_price"] <= Number(maxPrice));
  }

  const container = document.getElementById("approvedStations");
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `<div class="empty" style="grid-column:1/-1;">
      <div class="empty-icon">🔍</div>
      <div class="empty-text">No stations match your filters</div>
    </div>`;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div class="station-card">
      ${s.image_url
        ? `<img src="${s.image_url}" class="station-card-img" alt="${s.name}">`
        : `<div class="station-card-img-placeholder">⛽</div>`}
      <div class="station-card-content">
        <div class="station-card-header">
          <div>
            <div class="station-card-name">${s.name}</div>
            <div class="station-card-loc">📍 ${s.location}</div>
          </div>
          <span class="badge badge-approved"><span class="badge-dot"></span> ACTIVE</span>
        </div>
        <div class="fuel-pills">
          ${fuelPill("Petrol (PMS)",   "⛽", s.petrol,   s.petrol_price)}
          ${fuelPill("Diesel (AGO)",   "🛢", s.diesel,   s.diesel_price)}
          ${fuelPill("Kerosene (DPK)", "🔥", s.kerosene, s.kerosene_price)}
          ${fuelPill("LPG / Gas",      "🫙", s.lpg,      s.lpg_price)}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center;"
            onclick="getDirections(${s.lat ?? "null"}, ${s.lng ?? "null"}, '${s.name.replace(/'/g,"\\'")}')">
            🗺 Get Directions
          </button>
          <button class="btn btn-ghost btn-sm"
            onclick="reportStation('${s.id}', '${s.name.replace(/'/g,"\\'")}')">
            🚩 Report
          </button>
        </div>
      </div>
    </div>`).join("");
};

// ============================================================
// CUSTOMER — Get Directions
// ============================================================
window.getDirections = function (destLat, destLng, name) {
  if (!destLat || !destLng) {
    showToast("No coordinates available for this station.", "error");
    return;
  }

  // Check if browser supports geolocation
  if (!navigator.geolocation) {
    // Fallback — open Google Maps without origin, it will use its own location detection
    showToast("Location not supported on this browser. Opening Google Maps…", "info");
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    window.open(url, "_blank");
    return;
  }

  // Show a loading toast while waiting for location permission
  showToast("📍 Requesting your location…", "info");

  navigator.geolocation.getCurrentPosition(
    // ── SUCCESS — user granted location ──
    function (position) {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Build Google Maps URL with both origin (user) and destination (station)
      const url = `https://www.google.com/maps/dir/?api=1` +
                  `&origin=${userLat},${userLng}` +
                  `&destination=${destLat},${destLng}` +
                  `&travelmode=driving`;

      showToast(`✅ Location found! Opening directions to ${name}…`, "success");
      window.open(url, "_blank");
    },

    // ── ERROR — user denied or location unavailable ──
    function (err) {
      let message = "";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = "Location access denied. Opening Google Maps without your location.";
          break;
        case err.POSITION_UNAVAILABLE:
          message = "Your location is unavailable. Opening Google Maps…";
          break;
        case err.TIMEOUT:
          message = "Location request timed out. Opening Google Maps…";
          break;
        default:
          message = "Could not get your location. Opening Google Maps…";
      }
      showToast(message, "warning");

      // Fallback — open without origin, Google Maps will prompt on its own
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
      window.open(url, "_blank");
    },

    // ── OPTIONS ──
    {
      enableHighAccuracy: true,   // use GPS if available
      timeout: 10000,             // wait up to 10 seconds
      maximumAge: 0               // always get fresh location, no cache
    }
  );
};

// ============================================================
// CUSTOMER — Report Incorrect Station Info
// ============================================================
window.reportStation = function (stationId, stationName) {
  const user = window.getCurrentUser();
  if (!user) { showToast("You must be logged in to report.", "error"); return; }

  const existing = document.getElementById("reportModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "reportModal";
  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;
      display:flex;align-items:center;justify-content:center;padding:1rem;">
      <div style="background:#1a1f2e;border:1px solid #252c3d;border-radius:14px;
        padding:1.5rem;width:100%;max-width:400px;font-family:'Inter',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:#e8edf5;font-size:1rem;">
            Report Incorrect Info
          </div>
          <button onclick="document.getElementById('reportModal').remove()"
            style="background:transparent;border:none;color:#8892a4;font-size:1.2rem;cursor:pointer;line-height:1;">✕</button>
        </div>
        <div style="font-size:0.78rem;color:#8892a4;margin-bottom:1rem;">
          Station: <strong style="color:#e8edf5;">${stationName}</strong>
        </div>
        <label style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#4a5568;display:block;margin-bottom:6px;">
          What is incorrect?
        </label>
        <select id="reportType" style="width:100%;background:#111520;border:1px solid #252c3d;
          border-radius:6px;color:#e8edf5;padding:9px 12px;font-size:0.82rem;margin-bottom:12px;outline:none;">
          <option value="wrong_fuel_status">Wrong fuel availability status</option>
          <option value="wrong_price">Incorrect price listed</option>
          <option value="station_closed">Station is closed / doesn't exist</option>
          <option value="other">Other</option>
        </select>
        <label style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#4a5568;display:block;margin-bottom:6px;">
          Additional details (optional)
        </label>
        <textarea id="reportNote" rows="3" placeholder="Describe the issue…"
          style="width:100%;background:#111520;border:1px solid #252c3d;border-radius:6px;
          color:#e8edf5;padding:9px 12px;font-size:0.82rem;resize:none;outline:none;margin-bottom:14px;"></textarea>
        <button onclick="submitReport('${stationId}','${stationName.replace(/'/g,"\\'")}','${user.id}','${user.email}')"
          style="width:100%;background:#3b6ff5;color:#fff;border:none;border-radius:6px;
          padding:10px;font-size:0.85rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">
          Submit Report
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
};

window.submitReport = async function (stationId, stationName, userId, userEmail) {
  const type = document.getElementById("reportType")?.value;
  const note = document.getElementById("reportNote")?.value;

  const { error } = await supabaseClient.from("reports").insert([{
    station_id: stationId, station_name: stationName,
    reported_by: userId, reporter_email: userEmail,
    report_type: type, note: note, status: "pending"
  }]);

  if (error) { showToast(error.message, "error"); return; }
  const modal = document.getElementById("reportModal");
  if (modal) modal.remove();
  showToast("Report submitted. Thank you!", "success");
};

// ============================================================
// NOTIFICATIONS
// ============================================================
window.loadNotifications = async function () {
  const user = window.getCurrentUser();
  if (!user) return;

  // Admin never receives broadcast notifications — skip entirely
  if (user.role === "admin") {
    const badge = document.getElementById("notifBadge");
    if (badge) badge.style.display = "none";
    const container = document.getElementById("notifList");
    if (container) container.innerHTML = `<div class="empty" style="padding:1.5rem;">
      <div class="empty-icon">🔔</div>
      <div class="empty-text">Admins do not receive user notifications</div></div>`;
    return;
  }

  // Customers and sellers: fetch only rows explicitly addressed to them
  const { data, error } = await supabaseClient.from("notifications")
    .select("*")
    .eq("user_id", user.id)           // only rows created FOR this user
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) { console.error("[loadNotifications] Error:", error); return; }

  const badge  = document.getElementById("notifBadge");
  const unread = data ? data.filter(n => !n.is_read).length : 0;

  if (badge) {
    badge.textContent   = unread > 0 ? String(unread) : "";
    badge.style.display = unread > 0 ? "flex" : "none";
  }

  const container = document.getElementById("notifList");
  if (!container) return;

  if (!data || !data.length) {
    container.innerHTML = `<div class="empty" style="padding:1.5rem;">
      <div class="empty-icon">🔔</div>
      <div class="empty-text">No notifications yet</div></div>`;
    return;
  }

  const icons = { price_update:"💰", announcement:"📣", alert:"🚨", approval:"✅", report:"🚩" };

  container.innerHTML = data.map(n => `
    <div class="notif-item ${n.is_read ? "" : "notif-unread"}"
      onclick="markNotifRead('${n.id}', this)">
      <div class="notif-icon">${icons[n.type] || "🔔"}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgo(n.created_at)}</div>
      </div>
    </div>`).join("");
};

window.markNotifRead = async function (id, el) {
  await supabaseClient.from("notifications").update({ is_read: true }).eq("id", id);
  if (el) el.classList.remove("notif-unread");
  loadNotifications();
};

window.markAllRead = async function () {
  const user = window.getCurrentUser();
  if (!user || user.role === "admin") return;
  await supabaseClient.from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id);
  loadNotifications();
};

window.toggleNotifPanel = function () {
  const panel = document.getElementById("notifPanel");
  if (!panel) return;
  const isOpen = panel.style.display === "block";
  panel.style.display = isOpen ? "none" : "block";
  if (!isOpen) loadNotifications();
};

document.addEventListener("click", function (e) {
  const panel = document.getElementById("notifPanel");
  const bell  = document.getElementById("notifBell");
  if (panel && panel.style.display === "block") {
    if (!panel.contains(e.target) && bell && !bell.contains(e.target)) {
      panel.style.display = "none";
    }
  }
});

// ============================================================
// HELPERS
// ============================================================

// Reusable fuel pill renderer
function fuelPill (label, icon, available, price) {
  return `<div class="fuel-pill ${available ? "avail" : "unavail"}">
    <span class="pill-dot"></span>${icon} ${label}
    ${available && price ? `<span class="fuel-price">₦${price}</span>` : ""}
  </div>`;
}

// Toast notification (replaces browser alert)
window.showToast = function (message, type = "success") {
  const existing = document.getElementById("toastEl");
  if (existing) existing.remove();

  const c = {
    success: { bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.3)",  color:"#22c55e", icon:"✓" },
    error:   { bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)",  color:"#f87171", icon:"✕" },
    warning: { bg:"rgba(234,179,8,0.12)",  border:"rgba(234,179,8,0.3)",  color:"#eab308", icon:"⚠" },
    info:    { bg:"rgba(59,111,245,0.12)", border:"rgba(59,111,245,0.3)", color:"#3b6ff5", icon:"ℹ" }
  }[type] || { bg:"rgba(59,111,245,0.12)", border:"rgba(59,111,245,0.3)", color:"#3b6ff5", icon:"ℹ" };

  const toast = document.createElement("div");
  toast.id = "toastEl";
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:99999;
    background:${c.bg};border:1px solid ${c.border};border-radius:10px;
    padding:12px 18px;display:flex;align-items:center;gap:10px;
    font-family:'Inter',sans-serif;font-size:0.83rem;color:${c.color};
    box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:340px;
    animation:slideUp 0.2s ease both;`;
  toast.innerHTML = `<span style="font-weight:700;">${c.icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
};

// Time ago helper
window.timeAgo = function (dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
