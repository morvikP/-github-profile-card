// DOM Elements
const usernameInput = document.getElementById('username-input');
const searchBtn = document.getElementById('search-btn');
const loadingEl = document.getElementById('loading');
const errorMessageEl = document.getElementById('error-message');
const profileCardEl = document.getElementById('profile-card');
const reposSectionEl = document.getElementById('repos-section');
const reposListEl = document.getElementById('repos-list');

// Profile fields
const avatarEl = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const loginEl = document.getElementById('login');
const bioEl = document.getElementById('bio');
const publicReposEl = document.getElementById('public-repos');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');

// State
let currentAbortController = null;

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Main search function
async function handleSearch() {
    const username = usernameInput.value.trim();

    if (!username) {
        showError('Пожалуйста, введите GitHub-юзернейм.');
        return;
    }

    // Cancel previous request if exists
    if (currentAbortController) {
        currentAbortController.abort();
    }

    // Create new AbortController for this request
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    // Hide previous results and errors
    hideError();
    hideProfile();
    showLoading();

    try {
        // Fetch user data
        const userResponse = await fetch(`https://api.github.com/users/${username}`, { signal });

        // Handle 404 - user not found
        if (userResponse.status === 404) {
            hideLoading();
            showError(`Пользователь "${username}" не найден. Проверьте правильность написания юзернейма.`);
            return;
        }

        // Handle other errors
        if (!userResponse.ok) {
            hideLoading();
            showError(`Ошибка сервера: ${userResponse.status}. Попробуйте позже.`);
            return;
        }

        const userData = await userResponse.json();

        // Fetch repos
        const reposResponse = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
            { signal }
        );

        let reposData = [];
        if (reposResponse.ok) {
            reposData = await reposResponse.json();
        }

        // Display data
        displayProfile(userData);
        displayRepos(reposData);
        hideLoading();

    } catch (error) {
        // Ignore abort errors (user started a new search)
        if (error.name === 'AbortError') {
            return;
        }

        hideLoading();
        showError('Произошла ошибка при загрузке данных. Проверьте подключение к интернету и попробуйте снова.');
        console.error('Fetch error:', error);
    } finally {
        currentAbortController = null;
    }
}

// Display profile card
function displayProfile(data) {
    avatarEl.src = data.avatar_url || '';
    avatarEl.alt = `${data.login}'s avatar`;
    nameEl.textContent = data.name || '—';
    loginEl.textContent = `@${data.login}`;
    bioEl.textContent = data.bio || 'Нет описания';
    publicReposEl.textContent = data.public_repos ?? 0;
    followersEl.textContent = data.followers ?? 0;
    followingEl.textContent = data.following ?? 0;

    profileCardEl.classList.remove('hidden');
}

// Display repos list
function displayRepos(repos) {
    reposListEl.innerHTML = '';

    if (repos.length === 0) {
        reposListEl.innerHTML = '<p class="repo-description">Нет публичных репозиториев.</p>';
    } else {
        repos.forEach(repo => {
            const repoItem = document.createElement('div');
            repoItem.className = 'repo-item';

            const repoLink = document.createElement('a');
            repoLink.className = 'repo-name';
            repoLink.href = repo.html_url;
            repoLink.target = '_blank';
            repoLink.textContent = repo.name;

            const repoDesc = document.createElement('p');
            repoDesc.className = 'repo-description';
            repoDesc.textContent = repo.description || 'Нет описания';

            repoItem.appendChild(repoLink);
            repoItem.appendChild(repoDesc);
            reposListEl.appendChild(repoItem);
        });
    }

    reposSectionEl.classList.remove('hidden');
}

// UI Helpers
function showLoading() {
    loadingEl.classList.remove('hidden');
}

function hideLoading() {
    loadingEl.classList.add('hidden');
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.remove('hidden');
}

function hideError() {
    errorMessageEl.classList.add('hidden');
    errorMessageEl.textContent = '';
}

function hideProfile() {
    profileCardEl.classList.add('hidden');
    reposSectionEl.classList.add('hidden');
    reposListEl.innerHTML = '';
}
