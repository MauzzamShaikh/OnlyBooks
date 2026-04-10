// Function to generate the complete header HTML dynamically
function getHeaderHTML() {
    return `
        <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M6 4H18L26 8V28L18 24H6V4Z" fill="#FF6B6B" stroke="#FF6B6B" stroke-width="2"/>
                        <path d="M12 4V24" stroke="white" stroke-width="2"/>
                    </svg>
                    <h1>OnlyBooks</h1>
                </div>
                <nav class="nav">
                    <a href="index.html" class="nav-link">Home</a>
                    
                    <!-- Login Button (visible when not logged in) -->
                    <a href="login.html" class="nav-link login-btn" id="loginBtn">Login</a>
                    
                    <!-- User Profile Dropdown (visible when logged in) -->
                    <div class="user-profile-container" id="userProfileContainer" style="display:none;">
                        <div class="user-profile-trigger" id="userProfileTrigger">
                            <img src="https://ui-avatars.com/api/?name=User&background=FF6B6B&color=fff&size=40" alt="User" class="user-avatar" id="userAvatar">
                            <span class="user-display-name" id="userDisplayName">User</span>
                            <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        
                        <!-- Dropdown Menu -->
                        <div class="user-dropdown" id="userDropdown">
                            <a href="library.html" class="dropdown-item">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M3 3H17V17H3V3Z" stroke="currentColor" stroke-width="2"/>
                                    <path d="M7 3V17M13 3V17" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                My Library
                            </a>
                            <a href="settings.html" class="dropdown-item">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                                    <path d="M10 1V4M10 16V19M19 10H16M4 10H1M16.5 16.5L14.5 14.5M5.5 5.5L3.5 3.5M16.5 3.5L14.5 5.5M5.5 14.5L3.5 16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                Account Settings
                            </a>
                            <a href="orders.html" class="dropdown-item">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M3 3H17L15 13H5L3 3Z" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="7" cy="17" r="1" fill="currentColor"/>
                                    <circle cx="13" cy="17" r="1" fill="currentColor"/>
                                </svg>
                                Order History
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" onclick="handleLogout(); return false;" class="dropdown-item logout-item" id="dropdownLogout">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M13 3H17V17H13M9 14L13 10L9 6M13 10H3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                Logout
                            </a>
                        </div>
                    </div>
                    
                    <a href="cart.html" class="nav-link cart-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M9 2L7 6H3C2.45 6 2 6.45 2 7V19C2 19.55 2.45 20 3 20H21C21.55 20 22 19.55 22 19V7C22 6.45 21.55 6 21 6H17L15 2H9Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Cart <span class="cart-count">0</span>
                    </a>
                </nav>  
            </div>
        </div>
    </header>
        `;
}