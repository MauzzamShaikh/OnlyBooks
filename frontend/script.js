// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:8080';
const API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = '';
const FALLBACK_COVER_URL = 'https://picsum.photos/200/300?blur=2&grayscale';
const maxResults = 10;

// --- GLOBAL STATE ---
let currentBooks = [];
let currentStartIndex = 0;
let currentQuery = 'bestsellers';
let currentCategory = '';
let currentSort = 'relevance';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- HELPER FUNCTIONS ---
function getBestThumbnail(imageLinksOrUrl) {
    // If a plain URL string is passed (from backend / cart), use it directly
    if (typeof imageLinksOrUrl === 'string') {
        return imageLinksOrUrl || FALLBACK_COVER_URL;
    }

    // Otherwise treat it as Google Books imageLinks object
    const links = imageLinksOrUrl;
    if (!links) return FALLBACK_COVER_URL;

    return (
        links.extraLarge ||
        links.large ||
        links.medium ||
        links.small ||
        links.thumbnail ||
        links.smallThumbnail ||
        FALLBACK_COVER_URL
    );
}

// --- CART FUNCTIONS ---
const saveCart = () => {
    try {
        if (isUserLoggedIn()) {
            localStorage.setItem('cart', JSON.stringify(cart));
        } else {
            localStorage.removeItem('cart');
            cart = [];
        }
        updateCartCount();
        if (window.location.pathname.endsWith('cart.html')) {
            displayCartItems();
        }
    } catch (e) {
        console.error('Error saving cart:', e);
    }
};

const updateCartCount = () => {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const count = isUserLoggedIn() ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
    cartCountElements.forEach(el => {
        el.textContent = count;
    });
};

// --- AUTHENTICATION ---
async function authUser(endpoint, name, email, password) {
    const url = `${BACKEND_URL}/users/${endpoint}`;
    const data = { name, email, password };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('userToken', result.token || result.id);
            localStorage.setItem('userName', result.name || name);
            showToast(`Welcome, ${result.name || name}!`, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        } else {
            showToast(`Error: ${result.error || 'Authentication failed'}`, 'error');
        }
    } catch (error) {
        console.error('Backend error:', error);
        showToast('Cannot connect to server. Make sure backend is running on port 8080.', 'error');
    }
}

async function fetchUserProfile() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        updateNav();
        return null;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/users/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('userName', user.name);
            updateNav();
            return user;
        } else {
            updateNav();
            return null;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        updateNav();
        return null;
    }
}

async function fetchOrderHistory() {
    const token = localStorage.getItem('userToken');
    if (!token) return null;

    try {
        const response = await fetch(`${BACKEND_URL}/orders/history`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return null;
    }
}

function handleLogout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('cart');
    cart = [];
    updateNav();
    updateCartCount();
    showToast('Logged out successfully', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
}

function isUserLoggedIn() {
    return localStorage.getItem('userToken') !== null;
}

// --- PRICE GENERATION ---
function generatePrice(book) {
    const title = book.volumeInfo?.title || '';
    let basePrice = 15 * (15 + (title.length % 20));
    if (book.volumeInfo?.pageCount) {
        basePrice += (book.volumeInfo.pageCount / 100);
    }
    return parseFloat(basePrice.toFixed(2));
}

// --- GOOGLE BOOKS API ---
async function fetchAndDisplay(query, container, clear = true, max = 40) {
    if (clear) {
        container.innerHTML = '<div class="loading">Loading books...</div>';
        container.dataset.startIndex = 0;
    }

    const startIndex = parseInt(container.dataset.startIndex) || 0;
    let orderBy = currentSort === 'newest' ? 'newest' : 'relevance';
    let url = `${API_URL}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${max}&orderBy=${orderBy}&printType=books`;
    if (API_KEY) url += `&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (clear) container.innerHTML = '';

        if (data.items && data.items.length > 0) {
            let booksWithPrices = data.items.map(book => {
                if (!book.price) book.price = generatePrice(book);
                return book;
            });

            if (currentSort === 'price') {
                booksWithPrices.sort((a, b) => a.price - b.price);
            }

            booksWithPrices.forEach(book => {
                if (!currentBooks.some(b => b.id === book.id)) {
                    currentBooks.push(book);
                } else {
                    const index = currentBooks.findIndex(b => b.id === book.id);
                    currentBooks[index] = book;
                }
                container.appendChild(createBookCard(book));
            });

            container.dataset.startIndex = startIndex + data.items.length;

            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn && container.id === 'booksContainer') {
                loadMoreBtn.style.display = (data.items.length === max) ? 'block' : 'none';
            }
        } else if (clear) {
            container.innerHTML = '<div class="loading">No books found. Try a different search.</div>';
        }
    } catch (error) {
        console.error('API Error:', error);
        container.innerHTML = '<div class="loading">Error loading books. Check your connection.</div>';
    }
}

function loadMainCatalog(clear = true) {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    const query = searchInput?.value.trim() || currentQuery;
    const category = categoryFilter?.value || '';
    currentSort = sortFilter?.value || 'relevance';

    let finalQuery = query;
    if (category && category !== '') {
        finalQuery += `+subject:${category}`;
    }

    const container = document.getElementById('booksContainer');
    if (clear) container.dataset.startIndex = 0;

    currentQuery = finalQuery;
    fetchAndDisplay(finalQuery, container, clear, maxResults);
}

// --- BOOK CARD & MODAL ---
function generateStars(rating) {
    if (!rating || rating === 'N/A') return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

function createBookCard(book) {
    const { volumeInfo, id, price } = book;
    const card = document.createElement('div');
    card.className = 'book-card';

    const thumbnail = getBestThumbnail(volumeInfo.imageLinks);
    const title = volumeInfo.title || 'Unknown Title';
    const authors = volumeInfo.authors?.join(', ') || 'Unknown Author';
    const rating = volumeInfo.averageRating || 'N/A';
    const bookPrice = price || generatePrice(book);

    card.innerHTML = `
        <img src="${thumbnail}" alt="${title}" class="book-image" onerror="this.src='${FALLBACK_COVER_URL}'">
        <div class="book-info">
            <h3 class="book-title">${title}</h3>
            <p class="book-author">${authors}</p>
            <div class="book-rating">
                <span class="stars">${generateStars(rating)}</span>
                <span class="rating-text">${rating}</span>
            </div>
            <p class="book-price">₹${bookPrice.toFixed(2)}</p>
            <button class="btn-primary btn-add-cart" onclick="addToCart('${id}'); event.stopPropagation();">Add to Cart</button>
        </div>
    `;

    card.addEventListener('click', () => openBookModal(id));
    return card;
}

function openBookModal(bookId) {
    const book = currentBooks.find(b => b.id === bookId);
    if (!book) return;

    const modal = document.getElementById('bookModal');
    const detailsContainer = document.getElementById('bookDetails');

    const { volumeInfo, price } = book;
    const thumbnail = getBestThumbnail(volumeInfo.imageLinks);
    const title = volumeInfo.title || 'Unknown Title';
    const authors = volumeInfo.authors?.join(', ') || 'Unknown Author';
    const description = volumeInfo.description || 'No description available.';
    const publishedDate = volumeInfo.publishedDate || 'Unknown';
    const pageCount = volumeInfo.pageCount || 'N/A';
    const rating = volumeInfo.averageRating || 'N/A';
    const bookPrice = price || generatePrice(book);

    detailsContainer.innerHTML = `
        <div class="book-detail-container">
            <img src="${thumbnail}" alt="${title}" class="modal-cover" onerror="this.src='${FALLBACK_COVER_URL}'">
            <div class="modal-right">
                <h3>${title}</h3>
                <p class="book-author-modal">by ${authors}</p>
                <div class="book-rating">
                    <span class="stars">${generateStars(rating)}</span>
                    <span class="rating-text">${rating}</span>
                </div>
                <p class="modal-price">₹${bookPrice.toFixed(2)}</p>
                <p><strong>Published:</strong> ${publishedDate}</p>
                <p><strong>Pages:</strong> ${pageCount}</p>
                <div class="book-description-modal">
                    <h4>Description</h4>
                    <p>${description}</p>
                </div>
                <button class="btn-primary btn-buy-modal" onclick="addToCart('${bookId}')">Add to Cart</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal() {
    const bookModal = document.getElementById('bookModal');
    const checkoutModal = document.getElementById('checkoutModal');
    const rentModal = document.getElementById('rentModal');

    if (bookModal) bookModal.style.display = 'none';
    if (checkoutModal) checkoutModal.style.display = 'none';
    if (rentModal) rentModal.style.display = 'none';
}

// --- NAVIGATION ---
function loadHeader() {
    document.body.insertAdjacentHTML('afterbegin', getHeaderHTML());
    initializeDropdown();
}

function updateNav() {
    const userName = localStorage.getItem('userName');
    const loginBtn = document.getElementById('loginBtn');
    const userProfileContainer = document.getElementById('userProfileContainer');
    const userDisplayName = document.getElementById('userDisplayName');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfileContainer) {
            userProfileContainer.style.display = 'block';
            if (userDisplayName) userDisplayName.textContent = userName;
            if (userAvatar) {
                userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FF6B6B&color=fff&size=40`;
                userAvatar.alt = userName;
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (userProfileContainer) userProfileContainer.style.display = 'none';
    }

    updateCartCount();
}

function initializeDropdown() {
    const userProfileTrigger = document.getElementById('userProfileTrigger');
    const userDropdown = document.getElementById('userDropdown');

    if (!userProfileTrigger || !userDropdown) return;

    const newTrigger = userProfileTrigger.cloneNode(true);
    userProfileTrigger.parentNode.replaceChild(newTrigger, userProfileTrigger);

    newTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
        newTrigger.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!newTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
            newTrigger.classList.remove('active');
        }
    });

    userDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            userDropdown.classList.remove('show');
            newTrigger.classList.remove('active');
        });
    });

    const newLogout = document.getElementById('dropdownLogout');
    if (newLogout) {
        newLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

// --- CART FUNCTIONS ---
function addToCart(bookId) {
    if (!isUserLoggedIn()) {
        showToast('Please login to add items to cart', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const book = currentBooks.find(b => b.id === bookId);
    if (!book) {
        showToast('Book not found', 'error');
        return;
    }

    if (cart.some(item => item.id === bookId)) {
        showToast('Book already in cart!', 'error');
        return;
    }

    const bookPrice = book.price || generatePrice(book);

    const cartItem = {
        id: book.id,
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
        thumbnail: getBestThumbnail(book.volumeInfo.imageLinks),
        price: bookPrice,
        quantity: 1,
        selectedOption: null,
        rentDuration: null
    };

    cart.push(cartItem);
    saveCart();
    showToast(`${book.volumeInfo.title} added to cart!`, 'success');
    closeModal();
}

function updateQuantity(bookId, change) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;

    item.quantity = Math.max(1, (item.quantity || 1) + change);
    saveCart();
}

function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    saveCart();
    showToast('Item removed from cart', 'success');
}

function selectOption(bookId, option) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;

    if (option === 'rent') {
        showRentModal(bookId);
    } else {
        item.selectedOption = 'buy';
        item.rentDuration = null;
        saveCart();
    }
}

function showRentModal(bookId) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;

    let modal = document.getElementById('rentModal');
    if (!modal) {
        const modalHTML = `
            <div id="rentModal" class="modal">
                <div class="modal-content rent-modal-content">
                    <span class="close-modal" onclick="closeModal()">×</span>
                    <div id="rentModalBody"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('rentModal');
    }

    const modalBody = document.getElementById('rentModalBody');
    const price7 = (item.price * 0.2).toFixed(2);
    const price15 = (item.price * 0.3).toFixed(2);
    const price30 = (item.price * 0.4).toFixed(2);

    const selectedClass7 = item.selectedOption === 'rent' && item.rentDuration === 7 ? 'rent-option-selected' : '';
    const selectedClass15 = item.selectedOption === 'rent' && item.rentDuration === 15 ? 'rent-option-selected' : '';
    const selectedClass30 = item.selectedOption === 'rent' && item.rentDuration === 30 ? 'rent-option-selected' : '';

    modalBody.innerHTML = `
        <h3>Select Rent Duration</h3>
        <p class="rent-book-title">${item.title}</p>
        <div class="rent-options">
            <div class="rent-option ${selectedClass7}" onclick="selectRentDuration('${bookId}', 7, ${price7})">
                <div class="rent-duration">7 Days</div>
                <div class="rent-price">₹${price7}</div>
                ${selectedClass7 ? '<div class="rent-checkmark">✓</div>' : ''}
            </div>
            <div class="rent-option ${selectedClass15}" onclick="selectRentDuration('${bookId}', 15, ${price15})">
                <div class="rent-duration">15 Days</div>
                <div class="rent-price">₹${price15}</div>
                ${selectedClass15 ? '<div class="rent-checkmark">✓</div>' : ''}
            </div>
            <div class="rent-option ${selectedClass30}" onclick="selectRentDuration('${bookId}', 30, ${price30})">
                <div class="rent-duration">30 Days</div>
                <div class="rent-price">₹${price30}</div>
                ${selectedClass30 ? '<div class="rent-checkmark">✓</div>' : ''}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function selectRentDuration(bookId, days, price) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;

    item.selectedOption = 'rent';
    item.rentDuration = days;
    item.rentPrice = price;

    saveCart();
    closeModal();
    showToast(`Rent option selected: ${days} days`, 'success');
}

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    const totalItemsSpan = document.getElementById('totalItems');

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'flex';
        if (cartSummary) cartSummary.classList.add('hidden');
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(emptyCart);
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (cartSummary) cartSummary.classList.remove('hidden');

    cartItemsContainer.innerHTML = '';

    cart.forEach(item => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';

        let optionDisplay = '';
        if (item.selectedOption === 'buy') {
            optionDisplay = `<span class="selected-option">Buy - ₹${item.price.toFixed(2)}</span>`;
        } else if (item.selectedOption === 'rent' && item.rentDuration) {
            optionDisplay = `<span class="selected-option">Rent (${item.rentDuration} days) - ₹${item.rentPrice.toFixed(2)}</span>`;
        }

        cartItemDiv.innerHTML = `
            <img src="${getBestThumbnail(item.thumbnail)}" alt="${item.title}" class="cart-item-image" onerror="this.src='${FALLBACK_COVER_URL}'">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${item.title}</h3>
                <p class="book-author">${item.authors}</p>
                <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
                ${optionDisplay}
                <div class="quantity-control">
                    <label>Quantity:</label>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1); event.stopPropagation();">−</button>
                    <span class="qty-display">${item.quantity || 1}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1); event.stopPropagation();">+</button>
                </div>
                <div class="cart-item-options">
                    <button class="option-btn ${item.selectedOption === 'buy' ? 'selected' : ''}" 
                            onclick="selectOption('${item.id}', 'buy'); event.stopPropagation();">
                        <span class="option-icon">${item.selectedOption === 'buy' ? '✓' : ''}</span> Buy
                    </button>
                    <button class="option-btn ${item.selectedOption === 'rent' ? 'selected' : ''}" 
                            onclick="selectOption('${item.id}', 'rent'); event.stopPropagation();">
                        <span class="option-icon">${item.selectedOption === 'rent' ? '✓' : ''}</span> Rent
                    </button>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="btn-secondary" onclick="removeFromCart('${item.id}'); event.stopPropagation();">Remove</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartItemDiv);
    });

    if (totalItemsSpan) {
        totalItemsSpan.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
}

function clearCart() {
    if (cart.length === 0) {
        showToast('Cart is already empty', 'error');
        return;
    }

    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        showToast('Cart cleared', 'success');
    }
}

function proceedToCheckout() {
    if (!isUserLoggedIn()) {
        showToast('Please login to proceed with checkout', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty! Add some books first.', 'error');
        return;
    }

    const unselectedItems = cart.filter(item => !item.selectedOption);

    if (unselectedItems.length > 0) {
        showToast('Please select buy or rent for all items', 'error');
        return;
    }

    const modal = document.getElementById('checkoutModal');
    const detailsContainer = document.getElementById('checkoutDetails');

    let total = 0;
    let html = '<h3>Order Summary</h3><div class="checkout-items">';

    cart.forEach(item => {
        let price = item.price;
        let optionText = 'Buy';

        if (item.selectedOption === 'rent') {
            price = item.rentPrice;
            optionText = `Rent (${item.rentDuration} days)`;
        }

        const itemTotal = price * (item.quantity || 1);
        total += itemTotal;

        html += `
            <div class="checkout-item">
                <p><strong>${item.title}</strong></p>
                <p>${optionText} × ${item.quantity || 1}: ₹${itemTotal.toFixed(2)}</p>
            </div>
        `;
    });

    html += `</div>
        <div class="checkout-total">
            <h3>Total: ₹${total.toFixed(2)}</h3>
        </div>
        <button class="btn-primary btn-block" onclick="completeCheckout()">Complete Purchase</button>
    `;

    detailsContainer.innerHTML = html;
    modal.style.display = 'flex';
}

async function completeCheckout() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        showToast('Please login to complete checkout', 'error');
        return;
    }

    const orderItems = cart.map(item => {
        const orderItem = {
            bookId: item.id,
            bookTitle: item.title,
            bookAuthor: item.authors,
            bookThumbnail: item.thumbnail,
            price: item.selectedOption === 'rent' ? item.rentPrice : item.price,
            quantity: item.quantity || 1,
            option: item.selectedOption
        };

        if (item.selectedOption === 'rent') {
            orderItem.durationDays = item.rentDuration;
        }

        return orderItem;
    });

    try {
        const response = await fetch(`${BACKEND_URL}/orders/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items: orderItems })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Order placed successfully! Thank you for your purchase.', 'success');
            cart = [];
            saveCart();
            closeModal();
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        } else {
            showToast('Order failed: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Order error:', error);
        showToast('Order placed successfully!', 'success');
        cart = [];
        saveCart();
        closeModal();
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 1500);
    }
}

// --- LOGIN PAGE ---
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (!loginForm || !registerForm) return;

    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');

    function setupToggleLink() {
        const toggleLink = document.getElementById('toggleForm');
        if (!toggleLink) return;

        const newToggleLink = toggleLink.cloneNode(true);
        toggleLink.parentNode.replaceChild(newToggleLink, toggleLink);

        newToggleLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const formTitle = document.getElementById('formTitle');
            const formSubtitle = document.getElementById('formSubtitle');
            const toggleText = document.getElementById('toggleText');
            const isLoginVisible = loginForm.style.display !== 'none';

            if (isLoginVisible) {
                loginForm.style.display = 'none';
                loginForm.classList.add('hidden');
                registerForm.style.display = 'block';
                registerForm.classList.remove('hidden');
                formTitle.textContent = 'Create Account';
                formSubtitle.textContent = 'Register to get started';
                toggleText.innerHTML = 'Already have an account? <a href="javascript:void(0)" id="toggleForm" class="toggle-link">Login here</a>';
            } else {
                loginForm.style.display = 'block';
                loginForm.classList.remove('hidden');
                registerForm.style.display = 'none';
                registerForm.classList.add('hidden');
                formTitle.textContent = 'Welcome Back';
                formSubtitle.textContent = 'Login to access your account';
                toggleText.innerHTML = 'Don\'t have an account? <a href="javascript:void(0)" id="toggleForm" class="toggle-link">Register here</a>';
            }

            setTimeout(setupToggleLink, 100);
        });
    }

    setupToggleLink();

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        authUser('login', '', email, password);
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        authUser('register', name, email, password);
    });

    updateNav();
}

// --- HOME PAGE ---
function initializeHomePage() {
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadMainCatalog(true);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchBtn) searchBtn.click();
            }
        });
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => loadMainCatalog(true));
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', () => loadMainCatalog(true));
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => loadMainCatalog(false));
    }

    const bookModal = document.getElementById('bookModal');
    if (bookModal) {
        const closeBtn = bookModal.querySelector('.close-modal');
        if (closeBtn) closeBtn.onclick = closeModal;

        window.onclick = (event) => {
            if (event.target === bookModal ||
                event.target === document.getElementById('checkoutModal') ||
                event.target === document.getElementById('rentModal')) {
                closeModal();
            }
        };
    }

    loadMainCatalog(true);
    fetchUserProfile();
    initializeDropdown();
}

// --- CART PAGE ---
function initializeCartPage() {
    if (!isUserLoggedIn()) {
        showToast('Please login to view your cart', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    updateNav();
    initializeDropdown();

    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        const closeBtn = checkoutModal.querySelector('.close-modal');
        if (closeBtn) closeBtn.onclick = closeModal;
    }

    displayCartItems();
}

// --- LIBRARY PAGE ---
async function initializeLibraryPage() {
    if (!isUserLoggedIn()) {
        showToast('Please login to view your library', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    updateNav();
    initializeDropdown();

    const history = await fetchOrderHistory();
    displayLibrary(history);

    // Category filter
    const navItems = document.querySelectorAll('.library-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const category = item.getAttribute('data-category');
            displayLibrary(history, category);
        });
    });

    // Sort functionality
    const sortSelect = document.getElementById('librarySort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const category = document.querySelector('.library-nav-item.active').getAttribute('data-category');
            displayLibrary(history, category);
        });
    }

    // View toggle
    const viewBtns = document.querySelectorAll('.view-btn');
    const libraryBooks = document.getElementById('libraryBooks');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            if (view === 'list') {
                libraryBooks.classList.remove('library-books-grid');
                libraryBooks.classList.add('library-books-list');
            } else {
                libraryBooks.classList.remove('library-books-list');
                libraryBooks.classList.add('library-books-grid');
            }
        });
    });
}

function displayLibrary(history, category = 'all') {
    const libraryBooks = document.getElementById('libraryBooks');
    if (!libraryBooks) return;

    libraryBooks.innerHTML = '';

    if (!history || (!history.purchases?.length && !history.rentals?.length)) {
        libraryBooks.innerHTML = `
            <div class="empty-library">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="50" stroke="#E0E0E0" stroke-width="4"/>
                    <path d="M40 40H80V80H40V40Z" stroke="#E0E0E0" stroke-width="3"/>
                    <path d="M55 40V80M70 40V80" stroke="#E0E0E0" stroke-width="3"/>
                </svg>
                <h3>No books in your library yet</h3>
                <p>Start building your collection!</p>
                <a href="index.html" class="btn-primary">Browse Books</a>
            </div>
        `;
        return;
    }

    let books = [];
    if (category === 'all') {
        books = [...(history.purchases || []), ...(history.rentals || [])];
    } else if (category === 'owned') {
        books = history.purchases || [];
    } else if (category === 'rented') {
        books = history.rentals || [];
    }

    // Sort books
    const sortSelect = document.getElementById('librarySort');
    const sortBy = sortSelect?.value || 'recent';

    if (sortBy === 'title') {
        books.sort((a, b) => (a.bookTitle || '').localeCompare(b.bookTitle || ''));
    } else if (sortBy === 'author') {
        books.sort((a, b) => (a.bookAuthor || '').localeCompare(b.bookAuthor || ''));
    }

    if (books.length === 0) {
        libraryBooks.innerHTML = `
            <div class="empty-library">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="50" stroke="#E0E0E0" stroke-width="4"/>
                    <path d="M40 40H80V80H40V40Z" stroke="#E0E0E0" stroke-width="3"/>
                    <path d="M55 40V80M70 40V80" stroke="#E0E0E0" stroke-width="3"/>
                </svg>
                <h3>No books in this category</h3>
                <p>Start building your collection!</p>
                <a href="index.html" class="btn-primary">Browse Books</a>
            </div>
        `;
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'library-book-card';

        const isRental = book.expiryDate;
        const badge = isRental ? '<span class="book-badge rental">Rented</span>' : '<span class="book-badge owned">Owned</span>';

        let expiryInfo = '';
        if (isRental) {
            const expiryDate = new Date(book.expiryDate);
            const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            expiryInfo = `<p class="expiry-info">Expires in ${daysLeft} days</p>`;
        }

        bookCard.innerHTML = `
            ${badge}
            <img src="${getBestThumbnail(book.bookThumbnail)}" alt="${book.bookTitle}" class="library-book-image" onerror="this.src='${FALLBACK_COVER_URL}'">
            <div class="library-book-info">
                <h4>${book.bookTitle}</h4>
                <p class="library-book-author">${book.bookAuthor}</p>
                ${expiryInfo}
                <p class="library-book-price">₹${(book.price * (book.quantity || 1)).toFixed(2)} ${book.quantity > 1 ? `(×${book.quantity})` : ''}</p>
            </div>
        `;

        libraryBooks.appendChild(bookCard);
    });
}

// --- SETTINGS PAGE ---
async function initializeSettingsPage() {
    if (!isUserLoggedIn()) {
        showToast('Please login to view settings', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    updateNav();
    initializeDropdown();

    // Load user profile
    const user = await fetchUserProfile();
    if (user) {
        const nameInput = document.getElementById('settingsName');
        const emailInput = document.getElementById('settingsEmail');
        const bioInput = document.getElementById('settingsBio');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (bioInput) bioInput.value = user.bio || '';
    }

    // Settings tabs
    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    const settingsTabs = document.querySelectorAll('.settings-tab');

    settingsNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.getAttribute('data-tab');

            settingsNavItems.forEach(nav => nav.classList.remove('active'));
            settingsTabs.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const targetTab = document.getElementById(tabName + 'Tab');
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // Profile form
    const profileForm = document.querySelector('#profileTab .settings-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('settingsName').value.trim();
            const bio = document.getElementById('settingsBio').value.trim();

            if (!name) {
                showToast('Name is required', 'error');
                return;
            }

            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(`${BACKEND_URL}/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, bio })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('userName', name);
                    updateNav();
                    showToast('Profile updated successfully!', 'success');
                } else {
                    showToast(data.error || 'Failed to update profile', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showToast('Error updating profile', 'error');
            }
        });
    }

    // Password form
    const passwordForm = document.querySelector('#securityTab .settings-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(`${BACKEND_URL}/users/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('Password updated successfully!', 'success');
                    passwordForm.reset();
                } else {
                    showToast(data.error || 'Failed to update password', 'error');
                }
            } catch (error) {
                console.error('Error updating password:', error);
                showToast('Error updating password', 'error');
            }
        });
    }

    // Add danger zone and delete account button
    const profileTab = document.getElementById('profileTab');
    if (profileTab && !document.querySelector('.danger-zone')) {
        const dangerZoneHTML = `
            <div class="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <button type="button" class="btn-danger" id="deleteAccountBtn">Delete Account</button>
            </div>
        `;
        profileTab.insertAdjacentHTML('beforeend', dangerZoneHTML);

        const deleteBtn = document.getElementById('deleteAccountBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', confirmDeleteAccount);
        }
    }
}

// --- ACCOUNT DELETION ---
async function confirmDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
        return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        showToast('You are not logged in.', 'error');
        return;
    }

    const btn = document.getElementById('deleteAccountBtn');
    if (btn) btn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/users/delete`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Account deleted successfully!', 'success');
            localStorage.clear();
            cart = [];
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showToast(data.error || 'Failed to delete account', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Network error. Is backend running on port 8080?', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// --- ORDERS PAGE ---
async function initializeOrdersPage() {
    if (!isUserLoggedIn()) {
        showToast('Please login to view orders', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    updateNav();
    initializeDropdown();

    const history = await fetchOrderHistory();
    displayOrders(history);
}

function displayOrders(history) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    ordersList.innerHTML = '';

    if (!history || (!history.purchases?.length && !history.rentals?.length)) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="50" stroke="#E0E0E0" stroke-width="4"/>
                    <path d="M40 40H80L75 75H45L40 40Z" stroke="#E0E0E0" stroke-width="3"/>
                    <circle cx="52" cy="85" r="5" stroke="#E0E0E0" stroke-width="3"/>
                    <circle cx="68" cy="85" r="5" stroke="#E0E0E0" stroke-width="3"/>
                </svg>
                <h3>No orders yet</h3>
                <p>Your order history will appear here</p>
                <a href="index.html" class="btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    const allOrders = [
        ...(history.purchases || []).map(p => ({ ...p, type: 'purchase' })),
        ...(history.rentals || []).map(r => ({ ...r, type: 'rental' }))
    ];

    // Sort by date (most recent first)
    allOrders.sort((a, b) => {
        const dateA = new Date(a.purchaseDate || a.rentalDate);
        const dateB = new Date(b.purchaseDate || b.rentalDate);
        return dateB - dateA;
    });

    allOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        const date = new Date(order.purchaseDate || order.rentalDate);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const isRental = order.type === 'rental';
        const statusBadge = isRental ?
            '<span class="order-status rental">Rental</span>' :
            '<span class="order-status completed">Purchased</span>';

        let expiryInfo = '';
        if (isRental && order.expiryDate) {
            const expiryDate = new Date(order.expiryDate);
            const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            expiryInfo = `<p class="order-expiry">Expires in ${daysLeft > 0 ? daysLeft : 0} days</p>`;
        }

        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <h4>${order.bookTitle}</h4>
                    <p class="order-author">${order.bookAuthor}</p>
                </div>
                ${statusBadge}
            </div>
            <div class="order-details">
                <img src="${getBestThumbnail(order.bookThumbnail)}" alt="${order.bookTitle}" class="order-image" onerror="this.src='${FALLBACK_COVER_URL}'">
                <div class="order-info">
                    <p><strong>Order Date:</strong> ${formattedDate}</p>
                    <p><strong>Price:</strong> ₹${(order.price * (order.quantity || 1)).toFixed(2)} ${order.quantity > 1 ? `(×${order.quantity})` : ''}</p>
                    ${isRental ? `<p><strong>Duration:</strong> ${order.durationDays} days</p>` : ''}
                    ${expiryInfo}
                </div>
            </div>
        `;

        ordersList.appendChild(orderCard);
    });
}

// --- TOAST ---
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// --- CART INITIALIZER ---
function initializeCart() {
    try {
        const stored = localStorage.getItem('cart');
        cart = stored ? JSON.parse(stored) : [];

        if (!isUserLoggedIn()) {
            cart = [];
            localStorage.removeItem('cart');
        } else {
            if (!Array.isArray(cart)) cart = [];
        }

        updateCartCount();

        if (window.location.pathname.endsWith('cart.html')) {
            displayCartItems();
        }
    } catch (e) {
        console.error('initializeCart error:', e);
        cart = [];
        localStorage.removeItem('cart');
        updateCartCount();
    }
}

// --- GLOBAL INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initializeCart();

    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        initializeHomePage();
    } else if (currentPage === 'cart.html') {
        initializeCartPage();
    } else if (currentPage === 'login.html') {
        initializeLoginPage();
    } else if (currentPage === 'library.html') {
        initializeLibraryPage();
    } else if (currentPage === 'settings.html') {
        initializeSettingsPage();
    } else if (currentPage === 'orders.html') {
        initializeOrdersPage();
    }

    loadHeader();
    updateNav();
    initializeDropdown();
});

// Expose to window
window.addToCart = addToCart;
window.handleLogout = handleLogout;
window.openBookModal = openBookModal;
window.removeFromCart = removeFromCart;
window.selectOption = selectOption;
window.selectRentDuration = selectRentDuration;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;
window.completeCheckout = completeCheckout;
window.closeModal = closeModal;
window.confirmDeleteAccount = confirmDeleteAccount;