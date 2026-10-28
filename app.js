// ===== 1. Select the elements =====
const API = "https://api.github.com";
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const button = form.querySelector("button");
const suggestions = document.querySelector("#suggestions");
const statusEl = document.querySelector("#status");
const profileEl = document.querySelector("#profile");
const reposSection = document.querySelector("#repos-section");
const reposEl = document.querySelector("#repos");

// ===== 2. A small helper to fetch JSON and handle HTTP errors =====
async function getJSON(url) {
  const res = await fetch(url);

  if (res.status === 404) throw new Error("User not found");
  if (res.status === 403) throw new Error("Too many requests. Wait a bit and try again");
  if (!res.ok) throw new Error(`Something went wrong (HTTP ${res.status})`);

  return res.json();
}

// ===== 3. Show messages to the user =====
function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function clearResults() {
  profileEl.innerHTML = "";
  reposEl.innerHTML = "";
  profileEl.classList.add("hidden");
  reposSection.classList.add("hidden");
}

// ===== 4. Render the profile card =====
function renderProfile(user) {
  profileEl.innerHTML = `
    <img alt="">
    <div class="info">
      <h2></h2>
      <a class="login" target="_blank" rel="noopener"></a>
      <p class="bio"></p>
      <div class="stats">
        <span><b>${user.public_repos.toLocaleString()}</b> repos</span>
        <span><b>${user.followers.toLocaleString()}</b> followers</span>
        <span><b>${user.following.toLocaleString()}</b> following</span>
      </div>
    </div>`;

  // User data goes in with textContent / attributes, never as HTML
  const img = profileEl.querySelector("img");
  img.src = user.avatar_url;
  img.alt = `${user.login}'s avatar`;
  profileEl.querySelector("h2").textContent = user.name ?? user.login;
  const link = profileEl.querySelector(".login");
  link.textContent = `@${user.login}`;
  link.href = user.html_url;
  profileEl.querySelector(".bio").textContent = user.bio ?? "No bio yet.";

  profileEl.classList.remove("hidden");
}

// ===== 5. Render the repositories =====
function renderRepos(repos) {
  reposEl.innerHTML = "";

  if (repos.length === 0) {
    const li = document.createElement("li");
    li.textContent = "This user has no public repositories.";
    reposEl.append(li);
  }

  repos.forEach((repo) => {
    const li = document.createElement("li");
    li.className = "repo";
    li.innerHTML = `
      <a target="_blank" rel="noopener"></a>
      <p></p>
      <div class="meta">
        <span>⭐ ${repo.stargazers_count.toLocaleString()}</span>
        <span class="lang"></span>
      </div>`;

    const link = li.querySelector("a");
    link.textContent = repo.name;
    link.href = repo.html_url;
    li.querySelector("p").textContent = repo.description ?? "No description";
    li.querySelector(".lang").textContent = repo.language ?? "";
    reposEl.append(li);
  });

  reposSection.classList.remove("hidden");
}

// ===== 6. Search: fetch the user and repos at the same time =====
async function searchUser(username) {
  clearResults();
  setStatus("Loading...");
  button.disabled = true;

  try {
    const name = encodeURIComponent(username);
    const [user, repos] = await Promise.all([
      getJSON(`${API}/users/${name}`),
      getJSON(`${API}/users/${name}/repos?sort=updated&per_page=6`),
    ]);

    renderProfile(user);
    renderRepos(repos);
    setStatus("");
  } catch (err) {
    // fetch itself throws a TypeError when there is no internet
    const message = err instanceof TypeError ? "Network error. Check your connection" : err.message;
    setStatus(message, true);
  } finally {
    button.disabled = false;
  }
}

// ===== 7. Events =====
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = input.value.trim();

  if (!username) {
    setStatus("Please type a username first", true);
    return;
  }
  searchUser(username);
});

// One listener for all suggestion chips (event delegation)
suggestions.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;

  input.value = chip.dataset.user;
  searchUser(chip.dataset.user);
});
