const fallbackImage = 'assets/img/open-book.png';
const API_BASE = 'http://localhost:3000';
const CURRENT_USER_KEY = 'bookshelf_current_user';

const state = {
  books: [],
  currentUser: null,
  profile: null,
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Помилка запиту до сервера');
  }

  return data;
}

function messageBox(message, type = 'success') {
  const box = qs('#globalMessage');
  if (!box) return;

  box.textContent = message;
  box.className = `status-box mb-4 message-${type}`;
  box.classList.remove('hidden');

  setTimeout(() => {
    box.classList.add('hidden');
  }, 3200);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function apiTypeToUi(type) {
  if (type === 'sell') return 'Продаж';
  if (type === 'exchange') return 'Обмін';
  return type || 'Продаж';
}

function uiTypeToApi(type) {
  if (type === 'Продаж') return 'sell';
  if (type === 'Обмін') return 'exchange';
  return type || 'sell';
}

function apiConditionToUi(condition) {
  const map = {
    new: 'Новий',
    excellent: 'Дуже добрий',
    good: 'Добрий',
    used: 'Вживаний',
  };
  return map[condition] || condition || 'Добрий';
}

function uiConditionToApi(condition) {
  const map = {
    Новий: 'new',
    'Дуже добрий': 'excellent',
    Добрий: 'good',
    Вживаний: 'used',
  };
  return map[condition] || condition || 'good';
}

function normalizeBook(book) {
  return {
    id: book.id,
    title: book.title || '',
    description: book.description || '',
    condition: apiConditionToUi(book.condition_book),
    condition_book: book.condition_book || 'good',
    type: apiTypeToUi(book.type),
    type_raw: book.type || 'sell',
    city: book.city || '',
    userId: book.user_id,
    createdAt: book.created_at,
    seller: book.user_name || 'Користувач',
    image: book.image_url || fallbackImage,
    price: book.price,
    sellerNote: book.seller_note || '',
    sellerEmail: book.seller_email || '',
  };
}

function priceLabel(book) {
  if (book.type_raw === 'sell') {
    return book.price ? `${Number(book.price)} ₴` : 'Продаж';
  }

  return 'Обмін';
}

function buildSellerMailto(book) {
  const subject = encodeURIComponent(`Питання щодо книги "${book.title}"`);
  const body = encodeURIComponent(
    `Добрий день! Мене зацікавило ваше оголошення "${book.title}" на BookShelf.`,
  );

  return `mailto:${book.sellerEmail}?subject=${subject}&body=${body}`;
}

function getInitials(name = 'BS') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function isOwner(book) {
  return Boolean(
    state.currentUser && Number(book.userId) === Number(state.currentUser.id),
  );
}

function bookCardTemplate(book) {
  const ownerButtons = isOwner(book)
    ? `
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-soft w-100" onclick="prepareEdit(${book.id})">Редагувати</button>
        <button class="btn btn-soft w-100" onclick="deleteListing(${book.id})">Видалити</button>
      </div>
    `
    : '';

  return `
    <div class="col-sm-6 col-xl-4">
      <div class="book-card">
        <img class="book-cover" src="${escapeHtml(book.image || fallbackImage)}" alt="${escapeHtml(book.title)}" onerror="this.src='${fallbackImage}'">
        <div class="pt-3 px-1">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h3 class="h5 mb-0">${escapeHtml(book.title)}</h3>
            <span class="book-badge">${escapeHtml(book.type)}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="muted">${escapeHtml(book.city)}</div>
            <div class="price">${priceLabel(book)}</div>
          </div>
          <div class="muted mb-2">Стан: ${escapeHtml(book.condition)}</div>
          <div class="muted mb-3">Продавець: ${escapeHtml(book.seller)}</div>
          <div class="d-grid gap-2">
            <button class="btn btn-accent" onclick="openBook(${book.id})">Детальніше</button>
          </div>
          ${ownerButtons}
        </div>
      </div>
    </div>
  `;
}

function renderGrid(selector, books) {
  const grid = qs(selector);
  if (!grid) return;

  if (!books.length) {
    grid.innerHTML =
      '<div class="col-12"><div class="status-box empty-state">Нічого не знайдено. Спробуйте змінити фільтри.</div></div>';
    return;
  }

  grid.innerHTML = books.map(bookCardTemplate).join('');
}

function renderProfile(profile) {
  const guestState = qs('#profileGuestState');
  const profileLayout = qs('#profileContent');

  if (!profile || !profileLayout) {
    if (guestState) guestState.classList.remove('hidden');
    if (profileLayout) profileLayout.classList.add('hidden');
    return;
  }

  if (guestState) guestState.classList.add('hidden');
  profileLayout.classList.remove('hidden');

  const name = profile.fullName || profile.name || 'Користувач';
  const city = profile.city || 'Місто';
  const email = profile.email || 'email@example.com';

  qsa('[data-profile-name]').forEach((el) => {
    el.textContent = name;
  });
  qsa('[data-profile-city]').forEach((el) => {
    el.textContent = city;
  });
  qsa('[data-profile-email]').forEach((el) => {
    el.textContent = email;
  });

  const avatarEl = qs('[data-profile-avatar]');
  if (avatarEl) avatarEl.textContent = getInitials(name);

  fillProfileForm(profile);
}

function renderMyListings(books) {
  const wrap = qs('#myListings');
  if (!wrap) return;

  if (!books.length) {
    wrap.innerHTML =
      '<div class="status-box empty-state">У вас ще немає оголошень.</div>';
    return;
  }

  wrap.innerHTML = books
    .map(
      (book) => `
    <div class="d-flex flex-column flex-md-row gap-3 align-items-start align-items-md-center p-3 border rounded-4 bg-white">
      <img class="listing-thumb" src="${escapeHtml(book.image || fallbackImage)}" alt="${escapeHtml(book.title)}" onerror="this.src='${fallbackImage}'">
      <div class="flex-grow-1">
        <div class="fw-bold">${escapeHtml(book.title)}</div>
        <div class="muted">${escapeHtml(book.city)} · ${escapeHtml(book.type)} · ${escapeHtml(book.condition)}</div>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-soft" onclick="openBook(${book.id})">Переглянути</button>
        <button class="btn btn-soft" onclick="prepareEdit(${book.id})">Редагувати</button>
        <button class="btn btn-accent" onclick="deleteListing(${book.id})">Видалити</button>
      </div>
    </div>
  `,
    )
    .join('');
}

function renderAuthControls() {
  qsa('[data-auth-nav]').forEach((wrap) => {
    if (state.currentUser) {
      const userName = escapeHtml(
        state.currentUser.fullName ||
          state.currentUser.name ||
          state.currentUser.email ||
          'Користувач',
      );

      wrap.innerHTML = `
        <a href="profile.html" class="user-pill user-link">
          ${userName}
        </a>
        <button class="btn btn-soft" onclick="logoutUser()">Вийти</button>
      `;
    } else {
      wrap.innerHTML = `
        <button class="btn btn-soft" onclick="openAuthModal('login')">Увійти</button>
        <button class="btn btn-accent" onclick="openAuthModal('register')">Реєстрація</button>
      `;
    }
  });
}

async function loadBooks(filters = {}) {
  const params = new URLSearchParams();

  if (filters.title) {
    params.set('title', filters.title);
  }

  if (filters.city && filters.city !== 'all') {
    params.set('city', filters.city);
  }

  if (filters.type && filters.type !== 'all') {
    params.set('type', uiTypeToApi(filters.type));
  }

  const queryString = params.toString();
  const url = queryString ? `/api/listings?${queryString}` : '/api/listings';

  const data = await apiFetch(url);
  const normalized = data.map(normalizeBook);
  state.books = normalized;

  return normalized;
}

async function loadSession() {
  state.currentUser = getCurrentUser();
  return state.currentUser;
}

async function loadMyBooks() {
  if (!state.currentUser) return [];
  const data = await apiFetch(`/api/my-listings/${state.currentUser.id}`);
  return data.map(normalizeBook);
}

async function openBook(id) {
  try {
    const book = normalizeBook(await apiFetch(`/api/listings/${id}`));
    fillBookModal(book);

    const modalEl = qs('#bookModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
  } catch (error) {
    messageBox(error.message, 'error');
  }
}

function syncPriceField(form) {
  const typeField = qs('.type-field', form);
  const priceWrap = qs('.price-wrap', form);
  if (!typeField || !priceWrap) return;

  priceWrap.classList.toggle('hidden', typeField.value !== 'Продаж');
}

function collectFormData(form) {
  const type = uiTypeToApi(qs('.type-field', form).value);
  const priceField = qs('.price-field', form);

  return {
    title: qs('.title-field', form).value.trim(),
    city: qs('.city-field', form).value,
    type,
    condition_book: uiConditionToApi(qs('.condition-field', form).value),
    description: qs('.description-field', form).value.trim(),
    image_url: qs('.image-field', form)?.value.trim() || '',
    price: type === 'sell' ? priceField?.value || null : null,
    seller_note: qs('.note-field', form)?.value.trim() || '',
  };
}

async function refreshPageData() {
  const page = document.body.dataset.page;
  renderAuthControls();

  if (page === 'home') {
    const books = await loadBooks();
    renderGrid('#featuredBooksGrid', books.slice(0, 3));
  }

  if (page === 'catalog') {
    const books = await loadBooks({
      title: qs('#catalogSearchInput')?.value.trim(),
      city: qs('#catalogCityFilter')?.value,
      type: qs('#catalogTypeFilter')?.value,
    });
    renderGrid('#catalogBooksGrid', books);
  }

  if (page === 'profile') {
    if (!state.currentUser) {
      renderProfile(null);
      renderMyListings([]);
      return;
    }

    state.profile = state.currentUser;
    const books = await loadMyBooks();
    renderProfile(state.profile);
    renderMyListings(books);
  }
}

function requireAuth(message = 'Спочатку увійдіть у свій акаунт') {
  if (state.currentUser) return true;
  messageBox(message, 'error');
  openAuthModal('login');
  return false;
}

async function handleListingSubmit(event) {
  event.preventDefault();
  if (!requireAuth()) return;

  const form = event.currentTarget;
  const editId = form.dataset.editId;
  const payload = collectFormData(form);

  try {
    if (editId) {
      await apiFetch(`/api/listings/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...payload,
          user_id: state.currentUser.id,
        }),
      });
      messageBox('Оголошення оновлено');
    } else {
      await apiFetch('/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          user_id: state.currentUser.id,
        }),
      });
      messageBox('Оголошення створено');
    }

    form.reset();
    delete form.dataset.editId;
    syncPriceField(form);

    const modal = bootstrap.Modal.getInstance(qs('#addBookModal'));
    if (modal) modal.hide();

    await refreshPageData();
  } catch (error) {
    messageBox(error.message, 'error');
  }
}

async function deleteListing(id) {
  if (!requireAuth()) return;
  if (!confirm('Видалити це оголошення?')) return;

  try {
    await apiFetch(`/api/listings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({
        user_id: state.currentUser.id,
      }),
    });

    messageBox('Оголошення видалено');
    await refreshPageData();
  } catch (error) {
    messageBox(error.message, 'error');
  }
}

async function prepareEdit(id) {
  if (!requireAuth()) return;

  try {
    const book = normalizeBook(await apiFetch(`/api/listings/${id}`));

    if (!isOwner(book)) {
      messageBox('Редагувати можна лише власні оголошення', 'error');
      return;
    }

    const form = qs('.listing-form');
    if (!form) return;

    form.dataset.editId = String(id);
    qs('.title-field', form).value = book.title || '';
    qs('.city-field', form).value = book.city || 'Київ';
    qs('.type-field', form).value = book.type || 'Продаж';
    qs('.condition-field', form).value = book.condition || 'Добрий';
    qs('.description-field', form).value = book.description || '';

    const imageField = qs('.image-field', form);
    const priceField = qs('.price-field', form);
    const noteField = qs('.note-field', form);

    if (imageField) {
      imageField.value =
        book.image && book.image !== fallbackImage ? book.image : '';
    }

    if (priceField) {
      priceField.value = book.price || '';
    }

    if (noteField) {
      noteField.value = book.sellerNote || '';
    }

    syncPriceField(form);
    new bootstrap.Modal(qs('#addBookModal')).show();
  } catch (error) {
    messageBox(error.message, 'error');
  }
}

async function handleCatalogFilters() {
  const books = await loadBooks({
    title: qs('#catalogSearchInput')?.value.trim(),
    city: qs('#catalogCityFilter')?.value,
    type: qs('#catalogTypeFilter')?.value,
  });
  renderGrid('#catalogBooksGrid', books);
}

function initForms() {
  qsa('.listing-form').forEach((form) => {
    form.addEventListener('submit', handleListingSubmit);

    const typeField = qs('.type-field', form);
    if (typeField) {
      typeField.addEventListener('change', () => syncPriceField(form));
    }

    syncPriceField(form);
  });

  qsa('.js-add-book').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (!state.currentUser) {
        event.preventDefault();
        event.stopPropagation();
        openAuthModal('login');
      }
    });
  });
}

function initHomeSearch() {
  const btn = qs('#homeSearchBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const params = new URLSearchParams();
    const title = qs('#homeSearchInput')?.value.trim();
    const city = qs('#homeCityFilter')?.value;
    const type = qs('#homeTypeFilter')?.value;

    if (title) params.set('title', title);
    if (city && city !== 'all') params.set('city', city);
    if (type && type !== 'all') params.set('type', type);

    window.location.href = `catalog.html?${params.toString()}`;
  });
}

function initCatalogFromQuery() {
  const input = qs('#catalogSearchInput');
  if (!input) return;

  const params = new URLSearchParams(window.location.search);
  input.value = params.get('title') || '';

  if (qs('#catalogCityFilter')) {
    qs('#catalogCityFilter').value = params.get('city') || 'all';
  }

  if (qs('#catalogTypeFilter')) {
    qs('#catalogTypeFilter').value = params.get('type') || 'all';
  }

  ['#catalogSearchInput', '#catalogCityFilter', '#catalogTypeFilter'].forEach(
    (selector) => {
      const element = qs(selector);
      if (!element) return;

      element.addEventListener(
        selector === '#catalogSearchInput' ? 'input' : 'change',
        handleCatalogFilters,
      );
    },
  );
}

function openAuthModal(mode = 'login') {
  const modalEl = qs('#authModal');
  if (!modalEl) return;

  qsa('[data-auth-pane]', modalEl).forEach((pane) => {
    pane.classList.add('hidden');
  });

  qsa('[data-auth-tab]', modalEl).forEach((tab) => {
    tab.classList.remove('active');
  });

  qs(`[data-auth-pane="${mode}"]`, modalEl)?.classList.remove('hidden');
  qs(`[data-auth-tab="${mode}"]`, modalEl)?.classList.add('active');

  new bootstrap.Modal(modalEl).show();
}

function bindAuthTabs() {
  qsa('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => openAuthModal(tab.dataset.authTab));
  });
}

function fillBookModal(book) {
  const body = qs('#bookModalBody');
  if (!body) return;

  const ownerActions = isOwner(book)
    ? `
      <div class="d-flex gap-2 flex-wrap mt-2">
        <button class="btn btn-soft" onclick="prepareEdit(${book.id})">Редагувати</button>
        <button class="btn btn-soft" onclick="deleteListing(${book.id})">Видалити</button>
      </div>
    `
    : '';

  const contactButton =
    book.sellerEmail && !isOwner(book)
      ? `
        <a class="btn btn-accent" href="${escapeHtml(buildSellerMailto(book))}">
          Написати продавцю
        </a>
      `
      : '';

  body.innerHTML = `
    <div class="row g-0">
      <div class="col-lg-5">
        <img 
          src="${escapeHtml(book.image || fallbackImage)}" 
          alt="${escapeHtml(book.title)}" 
          class="w-100 h-100" 
          style="object-fit: cover; min-height: 100%;" 
          onerror="this.src='${fallbackImage}'"
        >
      </div>

      <div class="col-lg-7 p-4 p-md-5">
        <div class="d-flex flex-wrap gap-2 mb-3">
          <span class="book-badge">${escapeHtml(book.type)}</span>
          <span class="book-badge">${escapeHtml(book.city)}</span>
          <span class="book-badge">${escapeHtml(book.condition)}</span>
        </div>

        <h3 class="mb-3">${escapeHtml(book.title)}</h3>

        <div class="price mb-3">${priceLabel(book)}</div>

        <p class="muted mb-3">${escapeHtml(book.description)}</p>

        ${
          book.sellerNote
            ? `
              <div class="mini-card mb-4">
                <div class="fw-bold mb-1">Нотатка продавця</div>
                <div class="muted">${escapeHtml(book.sellerNote)}</div>
              </div>
            `
            : ''
        }

        <div class="mini-card mb-4">
          <div class="fw-bold mb-1">Продавець</div>
          <div class="muted">${escapeHtml(book.seller)}</div>
        </div>

        <div class="d-grid gap-2 d-md-flex">
          ${contactButton}
          <button class="btn btn-soft" data-bs-dismiss="modal">Закрити</button>
        </div>

        ${ownerActions}
      </div>
    </div>
  `;
}

function toggleProfileForm() {
  const form = qs('#profileForm');
  if (!form) return;

  form.classList.toggle('hidden');
}

function fillProfileForm(profile) {
  const nameInput = qs('#profileName');
  const emailInput = qs('#profileEmail');
  const cityInput = qs('#profileCity');
  const currentPasswordInput = qs('#profileCurrentPassword');
  const newPasswordInput = qs('#profileNewPassword');
  const confirmPasswordInput = qs('#profileConfirmPassword');

  if (!nameInput || !emailInput || !cityInput || !profile) return;

  nameInput.value = profile.fullName || profile.name || '';
  emailInput.value = profile.email || '';
  cityInput.value = profile.city || '';

  if (currentPasswordInput) currentPasswordInput.value = '';
  if (newPasswordInput) newPasswordInput.value = '';
  if (confirmPasswordInput) confirmPasswordInput.value = '';
}

async function submitAuthForm(event, mode) {
  event.preventDefault();

  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());

  const errorTarget = qs(`#${mode}Error`);
  if (errorTarget) errorTarget.textContent = '';

  try {
    if (mode === 'register') {
      const registerPayload = {
        name: payload.fullName,
        email: payload.email,
        city: payload.city,
        password: payload.password,
      };

      const data = await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(registerPayload),
      });

      state.currentUser = {
        id: data.userId,
        name: registerPayload.name,
        fullName: registerPayload.name,
        email: registerPayload.email,
        city: registerPayload.city,
      };

      setCurrentUser(state.currentUser);
      messageBox('Реєстрація успішна');
    }

    if (mode === 'login') {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
        }),
      });

      state.currentUser = {
        id: data.user.id,
        name: data.user.name,
        fullName: data.user.name,
        email: data.user.email,
        city: data.user.city,
      };

      setCurrentUser(state.currentUser);
      messageBox('Вхід успішний');
    }

    renderAuthControls();
    renderProfile(state.currentUser);

    const modal = bootstrap.Modal.getInstance(qs('#authModal'));
    if (modal) modal.hide();

    form.reset();
    await refreshPageData();
  } catch (error) {
    if (errorTarget) {
      errorTarget.textContent = error.message;
    } else {
      messageBox(error.message, 'error');
    }
  }
}

async function handleProfileSubmit(event) {
  event.preventDefault();

  if (!requireAuth()) return;

  const errorBox = qs('#profileError');
  if (errorBox) errorBox.textContent = '';

  const name = qs('#profileName')?.value.trim();
  const email = qs('#profileEmail')?.value.trim();
  const city = qs('#profileCity')?.value.trim();

  const currentPassword = qs('#profileCurrentPassword')?.value.trim();
  const newPassword = qs('#profileNewPassword')?.value.trim();
  const confirmPassword = qs('#profileConfirmPassword')?.value.trim();

  if (newPassword || confirmPassword || currentPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      if (errorBox) {
        errorBox.textContent =
          'Для зміни пароля потрібно заповнити поточний пароль, новий пароль і повторення нового пароля.';
      }
      return;
    }

    if (newPassword.length < 6) {
      if (errorBox) {
        errorBox.textContent = 'Новий пароль має бути мінімум 6 символів.';
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (errorBox) {
        errorBox.textContent =
          'Новий пароль і повторення пароля не збігаються.';
      }
      return;
    }
  }

  try {
    const data = await apiFetch(`/api/users/${state.currentUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        email,
        city,
        currentPassword,
        newPassword,
      }),
    });

    state.currentUser = {
      ...state.currentUser,
      id: data.user.id,
      name: data.user.name,
      fullName: data.user.name,
      email: data.user.email,
      city: data.user.city,
    };

    setCurrentUser(state.currentUser);
    renderAuthControls();
    renderProfile(state.currentUser);

    const form = qs('#profileForm');
    if (form) form.classList.add('hidden');

    messageBox('Профіль оновлено');
  } catch (error) {
    if (errorBox) {
      errorBox.textContent = error.message;
    } else {
      messageBox(error.message, 'error');
    }
  }
}

function bindAuthForms() {
  qs('#loginForm')?.addEventListener('submit', (event) =>
    submitAuthForm(event, 'login'),
  );

  qs('#registerForm')?.addEventListener('submit', (event) =>
    submitAuthForm(event, 'register'),
  );
}

function bindProfileForm() {
  qs('#profileForm')?.addEventListener('submit', handleProfileSubmit);
  qs('#editProfileBtn')?.addEventListener('click', toggleProfileForm);
}

async function logoutUser() {
  setCurrentUser(null);
  state.currentUser = null;
  renderAuthControls();
  messageBox('Ви вийшли з акаунта');
  await refreshPageData();
}

async function init() {
  initForms();
  initHomeSearch();
  initCatalogFromQuery();
  bindAuthTabs();
  bindAuthForms();
  bindProfileForm();

  try {
    await loadSession();
    await refreshPageData();
  } catch (error) {
    messageBox(
      'Сервер або база даних недоступні. Спочатку запустіть MySQL і server.js.',
      'error',
    );
  }
}

document.addEventListener('DOMContentLoaded', init);

window.openBook = openBook;
window.prepareEdit = prepareEdit;
window.deleteListing = deleteListing;
window.openAuthModal = openAuthModal;
window.logoutUser = logoutUser;
