/**
 * House Of Zeraha — Luxury Saree Boutique Core Engine
 * Handcrafted Indian Elegance, Inspired by GIVA & Sabyasachi Polish
 */

// Application State
const STATE = {
  currentView: 'home', // 'home' | 'shop'
  cart: [],
  wishlist: [],
  currency: 'INR',
  currencyRates: {
    INR: { symbol: '₹', rate: 1 },
    USD: { symbol: '$', rate: 0.012 },
    GBP: { symbol: '£', rate: 0.0094 },
    AED: { symbol: 'AED ', rate: 0.044 }
  },
  appliedCoupon: null,
  activeProduct: null,
  filters: {
    search: '',
    categories: [],
    occasions: [],
    colours: [],
    maxPrice: 50000,
    sortBy: 'featured'
  }
};

// Initialise Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  loadPersistedState();
  initHeaderScrollListener();
  renderCollections();
  renderFeaturedProducts();
  renderOccasions();
  renderReviews();
  renderFaqs();
  renderCatalog();
  updateCartBadge();
  updateWishlistBadge();
  initCurrencySelector();
  initAnnouncementBar();
});

// Format Price with Active Currency
function formatPrice(amountInINR) {
  const curr = STATE.currencyRates[STATE.currency] || STATE.currencyRates.INR;
  const converted = Math.round(amountInINR * curr.rate);
  if (STATE.currency === 'INR') {
    return `₹${converted.toLocaleString('en-IN')}`;
  }
  return `${curr.symbol}${converted.toLocaleString()}`;
}

// Persist Cart & Wishlist in LocalStorage
function persistState() {
  try {
    localStorage.setItem('hz_cart', JSON.stringify(STATE.cart));
    localStorage.setItem('hz_wishlist', JSON.stringify(STATE.wishlist));
    localStorage.setItem('hz_coupon', JSON.stringify(STATE.appliedCoupon));
  } catch (e) {
    console.warn('Storage unavailable', e);
  }
}

function loadPersistedState() {
  try {
    const savedCart = localStorage.getItem('hz_cart');
    const savedWishlist = localStorage.getItem('hz_wishlist');
    const savedCoupon = localStorage.getItem('hz_coupon');
    if (savedCart) STATE.cart = JSON.parse(savedCart);
    if (savedWishlist) STATE.wishlist = JSON.parse(savedWishlist);
    if (savedCoupon) STATE.appliedCoupon = JSON.parse(savedCoupon);
  } catch (e) {
    console.warn('Could not load storage', e);
  }
}

// Header Sticky Shadow
function initHeaderScrollListener() {
  const header = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  });
}

// Currency Selector Handler
function initCurrencySelector() {
  const select = document.getElementById('currencySelect');
  if (select) {
    select.value = STATE.currency;
    select.addEventListener('change', (e) => {
      STATE.currency = e.target.value;
      renderFeaturedProducts();
      renderCatalog();
      updateCartDrawer();
      if (STATE.activeProduct) {
        openPdpModal(STATE.activeProduct.id);
      }
      showToast(`Currency updated to ${STATE.currency}`);
    });
  }
}

// Navigation View Routing
function navigateTo(viewName) {
  STATE.currentView = viewName;
  const homeView = document.getElementById('homeView');
  const shopView = document.getElementById('shopView');
  const desktopLinks = document.querySelectorAll('#desktopNavLinks .nav-link');

  desktopLinks.forEach(link => link.classList.remove('active'));

  if (viewName === 'shop') {
    homeView.style.display = 'none';
    shopView.style.display = 'block';
    if (desktopLinks[1]) desktopLinks[1].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderCatalog();
  } else {
    homeView.style.display = 'block';
    shopView.style.display = 'none';
    if (desktopLinks[0]) desktopLinks[0].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollToSection(sectionId) {
  if (STATE.currentView !== 'home') {
    navigateTo('home');
  }
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// Filter Catalog Directly from Header/Dropdown/Occasion Cards
function filterCatalogBy(categoryName) {
  resetFilters();
  STATE.filters.categories = [categoryName];
  navigateTo('shop');

  // Check the corresponding checkbox in sidebar
  const checkboxes = document.querySelectorAll('input[name="catFilter"]');
  checkboxes.forEach(cb => {
    if (cb.value === categoryName) cb.checked = true;
  });

  applyFiltersAndSort();
  showToast(`Showing ${categoryName} Collection`);
}

function filterCatalogByOccasion(occasionTag) {
  resetFilters();
  STATE.filters.occasions = [occasionTag];
  navigateTo('shop');

  const checkboxes = document.querySelectorAll('input[name="occFilter"]');
  checkboxes.forEach(cb => {
    if (cb.value === occasionTag) cb.checked = true;
  });

  applyFiltersAndSort();
  showToast(`Showing ${occasionTag} Sarees`);
}

// Mobile Nav Toggle
function toggleMobileNav() {
  const overlay = document.getElementById('mobileDrawerOverlay');
  const box = document.getElementById('mobileDrawerBox');
  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
    box.style.transform = 'translateX(-100%)';
  } else {
    overlay.classList.add('active');
    box.style.transform = 'translateX(0)';
  }
}

/* ==========================================================================
   RENDER METHODS FOR SECTIONS
   ========================================================================== */

// 1. Render Collections Grid (Section 4)
function renderCollections() {
  const grid = document.getElementById('collectionsGrid');
  if (!grid) return;

  grid.innerHTML = COLLECTIONS.map(col => `
    <div class="collection-card" onclick="filterCatalogBy('${col.categoryFilter}')">
      <div class="collection-img-wrap">
        <img src="${col.image}" alt="${col.name}" class="collection-img" loading="lazy">
      </div>
      <div class="collection-overlay"></div>
      <span class="collection-badge">${col.badge}</span>
      <div class="collection-content">
        <span class="collection-item-count">${col.itemCount}</span>
        <h3 class="collection-card-title">${col.name}</h3>
        <p class="collection-card-sub">${col.subtitle}</p>
        <span class="collection-link-btn">
          Explore Collection
          <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    </div>
  `).join('');
}

// 2. Render Featured Sarees (Section 5)
function renderFeaturedProducts(categoryFilter = 'all') {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  let filtered = PRODUCTS.filter(p => p.isBestseller);
  if (categoryFilter !== 'all') {
    filtered = PRODUCTS.filter(p => p.category === categoryFilter);
  }

  // Show 8 curated products
  const displayItems = filtered.slice(0, 8);

  grid.innerHTML = displayItems.map(p => createProductCardHtml(p)).join('');
}

function filterFeatured(cat, btnEl) {
  const pills = document.querySelectorAll('.featured-section .filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  btnEl.classList.add('active');
  renderFeaturedProducts(cat);
}

// 3. Render Occasions (Section 6)
function renderOccasions() {
  const grid = document.getElementById('occasionsGrid');
  if (!grid) return;

  grid.innerHTML = OCCASIONS.map(occ => `
    <div class="occasion-card" onclick="filterCatalogByOccasion('${occ.tag}')">
      <div class="occasion-img-wrap">
        <img src="${occ.image}" alt="${occ.title}" class="occasion-img" loading="lazy">
      </div>
      <div class="occasion-overlay"></div>
      <div class="occasion-content">
        <h3 class="occasion-title">${occ.title}</h3>
        <p class="occasion-subtitle">${occ.subtitle}</p>
      </div>
    </div>
  `).join('');
}

// 4. Render Reviews (Section 8)
function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  grid.innerHTML = REVIEWS.map(r => `
    <div class="review-card">
      <div class="review-stars">
        ${Array(r.rating).fill('<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>').join('')}
      </div>
      <h4 class="review-title">“${r.title}”</h4>
      <p class="review-text">“${r.comment}”</p>
      <div style="font-size:0.75rem; color:var(--color-champagne-dark); font-weight:600; margin-bottom:0.75rem;">
        Draped: ${r.saree}
      </div>
      <div class="review-author-meta">
        <div>
          <span class="author-name">${r.author}</span>, ${r.city}
        </div>
        <span class="verified-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
          Verified Patron
        </span>
      </div>
    </div>
  `).join('');
}

// 5. Render FAQs Accordion
function renderFaqs() {
  const container = document.getElementById('faqContainer');
  if (!container) return;

  container.innerHTML = FAQS.map((faq, i) => `
    <div style="background:var(--color-ivory); border:1px solid var(--color-sand); border-radius:var(--radius-xs); overflow:hidden;">
      <button onclick="toggleFaq(${i})" style="width:100%; padding:1.25rem 1.5rem; text-align:left; display:flex; justify-content:space-between; align-items:center; font-family:var(--font-serif); font-size:1.15rem; color:var(--color-espresso); font-weight:600;">
        <span>${faq.q}</span>
        <span id="faqIcon-${i}" style="font-size:1.3rem; color:var(--color-champagne); transition:transform 0.2s;">+</span>
      </button>
      <div id="faqAnswer-${i}" style="display:none; padding:0 1.5rem 1.25rem 1.5rem; font-size:0.88rem; color:var(--color-espresso-light); line-height:1.7;">
        ${faq.a}
      </div>
    </div>
  `).join('');
}

function toggleFaq(index) {
  const ans = document.getElementById(`faqAnswer-${index}`);
  const icon = document.getElementById(`faqIcon-${index}`);
  if (ans.style.display === 'none' || !ans.style.display) {
    ans.style.display = 'block';
    icon.textContent = '−';
    icon.style.transform = 'rotate(180deg)';
  } else {
    ans.style.display = 'none';
    icon.textContent = '+';
    icon.style.transform = 'rotate(0deg)';
  }
}

/* ==========================================================================
   PRODUCT CARD HTML GENERATOR
   ========================================================================== */
function createProductCardHtml(product) {
  const isWishlisted = STATE.wishlist.some(item => item.id === product.id);
  const discountPercent = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="product-img-wrap" onclick="openPdpModal(${product.id})">
        <img src="${product.images[0]}" alt="${product.name}" class="product-img" loading="lazy">
        
        <div class="product-badges">
          ${product.silkMarkCertified ? '<span class="badge-silkmark">Silk Mark Certified</span>' : ''}
          ${product.isNew ? '<span class="badge-festive">New Arrival</span>' : ''}
          ${product.isBestseller ? '<span class="badge-bestseller">Bestseller</span>' : ''}
        </div>

        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)" 
                aria-label="Save to Wishlist">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>

        <div class="quick-actions-bar" onclick="event.stopPropagation()">
          <button class="quick-action-btn" onclick="openPdpModal(${product.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            Quick View
          </button>
          <button class="quick-action-btn" onclick="quickAddToCart(${product.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add to Bag
          </button>
        </div>
      </div>

      <div class="product-info">
        <div class="product-code-meta">
          <span class="product-code">${product.code}</span>
          <span class="product-origin">${product.origin}</span>
        </div>
        
        <h3 class="product-title" onclick="openPdpModal(${product.id})">${product.name}</h3>
        <p class="product-fabric">${product.fabric}</p>

        <div class="product-price-row">
          <span class="price-current">${formatPrice(product.sellingPrice)}</span>
          <span class="price-mrp">${formatPrice(product.mrp)}</span>
          <span class="price-discount">${discountPercent}% OFF</span>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================================
   CATALOG VIEW (SHOP ALL 24 SAREES WITH ADVANCED FILTERING)
   ========================================================================== */
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;

  let filtered = [...PRODUCTS];

  // 1. Text Search Filter
  if (STATE.filters.search.trim()) {
    const q = STATE.filters.search.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.fabric.toLowerCase().includes(q) ||
      p.colour.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q)
    );
  }

  // 2. Categories Filter
  if (STATE.filters.categories.length > 0) {
    filtered = filtered.filter(p => STATE.filters.categories.includes(p.category));
  }

  // 3. Occasions Filter
  if (STATE.filters.occasions.length > 0) {
    filtered = filtered.filter(p => STATE.filters.occasions.includes(p.occasion));
  }

  // 4. Colours Filter
  if (STATE.filters.colours.length > 0) {
    filtered = filtered.filter(p => STATE.filters.colours.includes(p.colourFamily));
  }

  // 5. Max Price Filter
  filtered = filtered.filter(p => p.sellingPrice <= STATE.filters.maxPrice);

  // 6. Sorting
  if (STATE.filters.sortBy === 'price-low') {
    filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (STATE.filters.sortBy === 'price-high') {
    filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (STATE.filters.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (STATE.filters.sortBy === 'newest') {
    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else {
    // Featured
    filtered.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
  }

  // Update UI count
  if (countEl) {
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'Saree' : 'Sarees'}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:4rem 1.5rem; background:var(--color-ivory-light); border:1px dashed var(--color-sand); border-radius:var(--radius-sm);">
        <h3 style="font-size:1.5rem; margin-bottom:0.5rem;">No drapes match your criteria</h3>
        <p style="font-size:0.9rem; color:var(--color-espresso-light); margin-bottom:1.5rem;">Try adjusting your price range or clearing color selections.</p>
        <button class="btn btn-outline" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => createProductCardHtml(p)).join('');
}

function applyFiltersAndSort() {
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) STATE.filters.search = searchInput.value;

  const catCheckboxes = document.querySelectorAll('input[name="catFilter"]:checked');
  STATE.filters.categories = Array.from(catCheckboxes).map(c => c.value);

  const occCheckboxes = document.querySelectorAll('input[name="occFilter"]:checked');
  STATE.filters.occasions = Array.from(occCheckboxes).map(c => c.value);

  const sortSelect = document.getElementById('catalogSort');
  if (sortSelect) STATE.filters.sortBy = sortSelect.value;

  renderCatalog();
}

function toggleColorFilter(colorFamily, btnEl) {
  const idx = STATE.filters.colours.indexOf(colorFamily);
  if (idx > -1) {
    STATE.filters.colours.splice(idx, 1);
    btnEl.classList.remove('active');
  } else {
    STATE.filters.colours.push(colorFamily);
    btnEl.classList.add('active');
  }
  renderCatalog();
}

function updatePriceSlider(val) {
  STATE.filters.maxPrice = Number(val);
  const textEl = document.getElementById('priceRangeValue');
  if (textEl) {
    textEl.textContent = `Up to ${formatPrice(Number(val))}`;
  }
  renderCatalog();
}

function resetFilters() {
  STATE.filters = {
    search: '',
    categories: [],
    occasions: [],
    colours: [],
    maxPrice: 50000,
    sortBy: 'featured'
  };

  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) searchInput.value = '';

  const checkboxes = document.querySelectorAll('.catalog-sidebar input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);

  const colorBtns = document.querySelectorAll('.color-swatch-btn');
  colorBtns.forEach(btn => btn.classList.remove('active'));

  const priceSlider = document.getElementById('priceRange');
  if (priceSlider) priceSlider.value = 50000;
  const priceText = document.getElementById('priceRangeValue');
  if (priceText) priceText.textContent = `Up to ${formatPrice(50000)}`;

  const sortSelect = document.getElementById('catalogSort');
  if (sortSelect) sortSelect.value = 'featured';

  renderCatalog();
  showToast('Filters cleared');
}

/* ==========================================================================
   PRODUCT DETAIL MODAL (04 PDP)
   ========================================================================== */
function openPdpModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  STATE.activeProduct = product;

  // Populate data
  document.getElementById('pdpCode').textContent = product.code;
  document.getElementById('pdpStock').textContent = `In Stock (${product.inventory} available)`;
  document.getElementById('pdpTitle').textContent = product.name;
  document.getElementById('pdpOrigin').textContent = product.origin;
  document.getElementById('pdpReviewCount').textContent = `${product.rating} / 5 (${product.reviewCount} verified reviews)`;

  document.getElementById('pdpSellingPrice').textContent = formatPrice(product.sellingPrice);
  document.getElementById('pdpMrp').textContent = formatPrice(product.mrp);
  const discountPercent = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);
  document.getElementById('pdpDiscount').textContent = `${discountPercent}% OFF`;

  document.getElementById('pdpFabric').textContent = product.fabric;
  document.getElementById('pdpColour').textContent = product.colour;
  document.getElementById('pdpOccasion').textContent = product.occasion;
  document.getElementById('pdpLength').textContent = `${product.sareeLength} (Complimentary fall & edge pico)`;
  document.getElementById('pdpBlouse').textContent = product.blousePiece;
  document.getElementById('pdpCare').textContent = product.careInstructions;

  // Reset Addons & Pincode
  const blouseCheck = document.getElementById('blouseStitchingCheck');
  if (blouseCheck) blouseCheck.checked = false;
  const pinInput = document.getElementById('pincodeInput');
  if (pinInput) pinInput.value = '';
  const pinResult = document.getElementById('pincodeResult');
  if (pinResult) pinResult.style.display = 'none';

  // Gallery
  const mainImg = document.getElementById('pdpMainImg');
  mainImg.src = product.images[0];

  const strip = document.getElementById('pdpThumbnailsStrip');
  strip.innerHTML = product.images.map((imgUrl, i) => `
    <button class="pdp-thumb-btn ${i === 0 ? 'active' : ''}" onclick="switchPdpImage('${imgUrl}', this)">
      <img src="${imgUrl}" alt="${product.name} view ${i + 1}">
    </button>
  `).join('');

  // Show Modal
  document.getElementById('pdpModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePdpModal() {
  document.getElementById('pdpModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function switchPdpImage(url, thumbBtn) {
  const mainImg = document.getElementById('pdpMainImg');
  mainImg.src = url;

  const thumbs = document.querySelectorAll('.pdp-thumb-btn');
  thumbs.forEach(t => t.classList.remove('active'));
  thumbBtn.classList.add('active');
}

function toggleBlouseAddon() {
  const isChecked = document.getElementById('blouseStitchingCheck').checked;
  if (isChecked) {
    showToast('Custom blouse tailoring selected (+₹1,499)');
  }
}

function checkPincode() {
  const pin = document.getElementById('pincodeInput').value.trim();
  const res = document.getElementById('pincodeResult');
  if (pin.length >= 5) {
    res.style.display = 'block';
    res.innerHTML = `✓ Express dispatch available to <strong>${pin}</strong>. Free courier delivery within 2–4 business days.`;
  } else {
    showToast('Please enter a valid postal pincode');
  }
}

function openWhatsAppForProduct() {
  if (!STATE.activeProduct) return;
  const p = STATE.activeProduct;
  const price = formatPrice(p.sellingPrice);
  const msg = [
    `🙏 Namaste, House of Zeraha!`,
    ``,
    `I would love to enquire about the following drape:`,
    `📌 *${p.name}* (${p.code})`,
    `💰 Price: ${price}`,
    `🎨 Colour: ${p.colour}`,
    `🧵 Fabric: ${p.fabric}`,
    ``,
    `Could you please share:`,
    `• High-resolution draping video in natural daylight`,
    `• Available colours / weave variations`,
    `• Delivery timeline to my location`,
    ``,
    `Thank you! 🌸`
  ].join('\n');
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ==========================================================================
   CART & SHOPPING BAG ENGINE (07)
   ========================================================================== */
function quickAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  addToCart(product, false);
}

function addCurrentProductToCart() {
  if (!STATE.activeProduct) return;
  const blouseCheck = document.getElementById('blouseStitchingCheck');
  const hasBlouse = blouseCheck ? blouseCheck.checked : false;
  addToCart(STATE.activeProduct, hasBlouse);
  closePdpModal();
}

function buyNowCurrentProduct() {
  addCurrentProductToCart();
  closeCartDrawer();
  openCheckoutModal();
}

function addToCart(product, hasCustomBlouse = false) {
  const existing = STATE.cart.find(item => item.id === product.id && item.hasCustomBlouse === hasCustomBlouse);
  if (existing) {
    existing.quantity += 1;
  } else {
    STATE.cart.push({
      id: product.id,
      code: product.code,
      name: product.name,
      fabric: product.fabric,
      price: product.sellingPrice,
      image: product.images[0],
      quantity: 1,
      hasCustomBlouse: hasCustomBlouse
    });
  }

  persistState();
  updateCartBadge();
  updateCartDrawer();
  openCartDrawer();
  showToast(`Added ${product.name} to shopping bag`);
}

function updateCartBadge() {
  const count = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cartCount');
  const drawerCount = document.getElementById('cartDrawerCount');
  if (badge) badge.textContent = count;
  if (drawerCount) drawerCount.textContent = count;
}

function openCartDrawer() {
  updateCartDrawer();
  document.getElementById('cartDrawerOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  document.getElementById('cartDrawerOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function updateCartDrawer() {
  const container = document.getElementById('cartItemsContainer');
  const footer = document.getElementById('cartDrawerFooter');
  if (!container) return;

  if (STATE.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z"/></svg>
        <h4>Your Shopping Bag is Empty</h4>
        <p style="font-size:0.85rem; color:var(--color-espresso-light); margin-bottom:1.5rem;">Explore our curated Kanjivaram and Banarasi weaves to begin your bridal or festive curation.</p>
        <button class="btn btn-gold btn-sm" onclick="closeCartDrawer(); navigateTo('shop');">
          Explore Sarees
        </button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  let subtotal = 0;

  container.innerHTML = STATE.cart.map((item, index) => {
    const itemBlouseAddon = item.hasCustomBlouse ? 1499 : 0;
    const itemUnitPrice = item.price + itemBlouseAddon;
    const itemTotal = itemUnitPrice * item.quantity;
    subtotal += itemTotal;

    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-info">
          <span class="cart-item-code">${item.code}</span>
          <h4 class="cart-item-title">${item.name}</h4>
          ${item.hasCustomBlouse ? '<span style="font-size:0.7rem; color:var(--color-champagne-dark); font-weight:600;">+ Custom Blouse Stitching (₹1,499)</span>' : ''}
          <div class="cart-item-price">${formatPrice(itemUnitPrice)}</div>

          <div class="cart-item-controls">
            <div class="qty-counter">
              <button class="qty-btn" onclick="changeCartItemQty(${index}, -1)">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="changeCartItemQty(${index}, 1)">+</button>
            </div>
            <span class="remove-item-btn" onclick="removeCartItem(${index})">Remove</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Shipping Progress
  const freeShippingThreshold = 2000;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const progressFill = document.getElementById('shippingProgressFill');
  if (progressFill) progressFill.style.width = `${progressPercent}%`;

  // Apply Coupon
  let discount = 0;
  if (STATE.appliedCoupon) {
    if (STATE.appliedCoupon.type === 'percent') {
      discount = Math.round((subtotal * STATE.appliedCoupon.value) / 100);
    } else if (STATE.appliedCoupon.type === 'flat') {
      discount = Math.min(subtotal, STATE.appliedCoupon.value);
    }
  }

  const finalTotal = Math.max(0, subtotal - discount);

  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  const discountRow = document.getElementById('cartDiscountRow');
  const discountVal = document.getElementById('cartDiscount');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    discountVal.textContent = `-${formatPrice(discount)}`;
  } else {
    discountRow.style.display = 'none';
  }
  document.getElementById('cartTotal').textContent = formatPrice(finalTotal);
}

function changeCartItemQty(index, delta) {
  if (!STATE.cart[index]) return;
  STATE.cart[index].quantity += delta;
  if (STATE.cart[index].quantity <= 0) {
    STATE.cart.splice(index, 1);
  }
  persistState();
  updateCartBadge();
  updateCartDrawer();
}

function removeCartItem(index) {
  if (!STATE.cart[index]) return;
  const name = STATE.cart[index].name;
  STATE.cart.splice(index, 1);
  persistState();
  updateCartBadge();
  updateCartDrawer();
  showToast(`Removed ${name}`);
}

function applyCouponCode() {
  const code = document.getElementById('cartCouponInput').value.trim().toUpperCase();
  const msgEl = document.getElementById('couponMessage');
  msgEl.style.display = 'block';

  if (code === 'ELEGANCE10') {
    STATE.appliedCoupon = { code: 'ELEGANCE10', type: 'percent', value: 10 };
    msgEl.style.color = '#2E7D32';
    msgEl.textContent = '✓ 10% Inaugural Privilege Discount applied!';
    persistState();
    updateCartDrawer();
    showToast('Privilege code ELEGANCE10 applied!');
  } else if (code === 'ZERAHASILK') {
    STATE.appliedCoupon = { code: 'ZERAHASILK', type: 'flat', value: 2000 };
    msgEl.style.color = '#2E7D32';
    msgEl.textContent = '✓ ₹2,000 Bridal Heirloom voucher applied!';
    persistState();
    updateCartDrawer();
    showToast('Voucher ZERAHASILK applied!');
  } else if (code === 'RET20' || code === 'RETURN20' || code === 'CANCEL20') {
    STATE.appliedCoupon = { code: code, type: 'percent', value: 20 };
    msgEl.style.color = '#2E7D32';
    msgEl.textContent = '✓ 20% Special Return Retention Privilege applied!';
    persistState();
    updateCartDrawer();
    showToast('Privilege code applied: 20% OFF!');
  } else {
    msgEl.style.color = 'var(--color-burgundy)';
    msgEl.textContent = 'Invalid promo code. Try ELEGANCE10 or RET20 for discount.';
  }
}

/* ==========================================================================
   CHECKOUT SIMULATOR & ORDER SUCCESS (07)
   ========================================================================== */
function openCheckoutModal() {
  closeCartDrawer();
  goToCheckoutStep1();

  // Calculate amount
  const subtotal = STATE.cart.reduce((sum, item) => sum + ((item.price + (item.hasCustomBlouse ? 1499 : 0)) * item.quantity), 0);
  let discount = 0;
  if (STATE.appliedCoupon) {
    discount = STATE.appliedCoupon.type === 'percent' ? Math.round((subtotal * STATE.appliedCoupon.value) / 100) : STATE.appliedCoupon.value;
  }
  const total = Math.max(0, subtotal - discount);
  document.getElementById('checkoutPayableAmount').textContent = formatPrice(total);

  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function goToCheckoutStep1() {
  document.getElementById('stepTab1').className = 'checkout-step-tab active';
  document.getElementById('stepTab2').className = 'checkout-step-tab';
  document.getElementById('stepTab3').className = 'checkout-step-tab';

  document.getElementById('checkoutStep1').style.display = 'block';
  document.getElementById('checkoutStep2').style.display = 'none';
  document.getElementById('checkoutStep3').style.display = 'none';
}

function goToCheckoutStep2() {
  const name = document.getElementById('shipFirstName').value.trim();
  const phone = document.getElementById('shipPhone').value.trim();
  if (!name || !phone) {
    showToast('Please provide your name and contact phone');
    return;
  }

  document.getElementById('stepTab1').className = 'checkout-step-tab';
  document.getElementById('stepTab2').className = 'checkout-step-tab active';
  document.getElementById('stepTab3').className = 'checkout-step-tab';

  document.getElementById('checkoutStep1').style.display = 'none';
  document.getElementById('checkoutStep2').style.display = 'block';
  document.getElementById('checkoutStep3').style.display = 'none';
}

function selectPaymentOption(mode, cardEl) {
  const cards = document.querySelectorAll('.payment-option-card');
  cards.forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
}

/* ==========================================================================
   RAZORPAY + WHATSAPP CONFIGURATION
   Replace RAZORPAY_KEY_ID with your actual key from Razorpay Dashboard.
   Replace WHATSAPP_NUMBER with your WhatsApp Business number (no + or spaces).
   ========================================================================== */
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_HERE'; // ← Paste your Razorpay Test Key ID here
const WHATSAPP_NUMBER = '919876543210';            // ← Replace with your WhatsApp Business number

/* Internal state for confirmed order details (used by WhatsApp confirmation) */
let _lastConfirmedOrder = null;

function processPayment() {
  const firstName    = document.getElementById('shipFirstName').value.trim() || 'Patron';
  const lastName     = document.getElementById('shipLastName').value.trim() || '';
  const email        = document.getElementById('shipEmail').value.trim() || '';
  const phone        = document.getElementById('shipPhone').value.trim() || '';
  const address      = document.getElementById('shipAddress').value.trim() || '';
  const city         = document.getElementById('shipCity').value.trim() || '';
  const pin          = document.getElementById('shipPin').value.trim() || '';
  const giftNote     = document.getElementById('shipGiftNote').value.trim() || '';
  const fullName     = `${firstName} ${lastName}`.trim();

  // Resolve total amount
  const subtotal = STATE.cart.reduce((sum, item) =>
    sum + ((item.price + (item.hasCustomBlouse ? 1499 : 0)) * item.quantity), 0);
  let discount = 0;
  if (STATE.appliedCoupon) {
    discount = STATE.appliedCoupon.type === 'percent'
      ? Math.round((subtotal * STATE.appliedCoupon.value) / 100)
      : Math.min(subtotal, STATE.appliedCoupon.value);
  }
  const totalINR = Math.max(0, subtotal - discount);

  // Determine selected payment method
  const selectedPayment = document.querySelector('input[name="paymentOption"]:checked');
  const paymentMode = selectedPayment ? selectedPayment.value : 'upi';

  const orderId = `HZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ── COD: No payment gateway needed ────────────────────────────────────────
  if (paymentMode === 'cod') {
    showToast('Cash on Delivery order placed!');
    _lastConfirmedOrder = {
      orderId, fullName, email, phone, address, city, pin,
      totalINR, paymentMode: 'Cash on Delivery', giftNote,
      items: [...STATE.cart]
    };
    _showOrderSuccess(orderId, firstName);
    return;
  }

  // ── Razorpay Checkout for UPI / Card / Netbanking ─────────────────────────
  showToast('Opening Razorpay secure checkout...');

  // Amount in paise (Razorpay requirement)
  const amountInPaise = totalINR * 100;

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: 'INR',
    name: 'House of Zeraha',
    description: `Luxury Saree Order — ${orderId}`,
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90" fill="%23C5A572">⚜</text></svg>',
    order_id: '', // Leave blank for test mode; in production, generate via your backend
    prefill: {
      name: fullName,
      email: email,
      contact: phone.replace(/\D/g, '').slice(-10) // Strip to 10-digit mobile
    },
    notes: {
      order_ref: orderId,
      shipping_address: `${address}, ${city} - ${pin}`,
      gift_note: giftNote || 'None'
    },
    theme: {
      color: '#C5A572' // House of Zeraha champagne gold
    },
    method: {
      upi: paymentMode === 'upi',
      card: paymentMode === 'card',
      netbanking: paymentMode === 'netbanking',
      wallet: false
    },
    handler: function(response) {
      // ✅ Payment successful — response contains razorpay_payment_id
      const rzpPaymentId = response.razorpay_payment_id || 'TEST_SUCCESS';
      showToast(`Payment verified! ID: ${rzpPaymentId.slice(0, 12)}...`);

      _lastConfirmedOrder = {
        orderId, fullName, email, phone, address, city, pin,
        totalINR, paymentMode: paymentMode.toUpperCase(),
        razorpayPaymentId: rzpPaymentId,
        giftNote, items: [...STATE.cart]
      };

      _showOrderSuccess(orderId, firstName);
    },
    modal: {
      ondismiss: function() {
        showToast('Payment cancelled. Your bag is still saved.');
      }
    }
  };

  try {
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function(response) {
      showToast('Payment failed: ' + (response.error.description || 'Please try again.'));
    });
    rzp.open();
  } catch (err) {
    // Razorpay SDK not loaded or key invalid — show helpful message
    console.error('Razorpay error:', err);
    showToast('⚠ Razorpay key not configured. Please add your Test Key ID in app.js');
  }
}

/** Internal: advance to step 3 success screen after payment confirmed */
function _showOrderSuccess(orderId, firstName) {
  document.getElementById('stepTab1').className = 'checkout-step-tab';
  document.getElementById('stepTab2').className = 'checkout-step-tab';
  document.getElementById('stepTab3').className = 'checkout-step-tab active';

  document.getElementById('checkoutStep1').style.display = 'none';
  document.getElementById('checkoutStep2').style.display = 'none';
  document.getElementById('checkoutStep3').style.display = 'block';

  document.getElementById('confirmedCustomerName').textContent = firstName;
  document.getElementById('confirmedOrderId').textContent = orderId;

  // Clear cart
  STATE.cart = [];
  STATE.appliedCoupon = null;
  persistState();
  updateCartBadge();
  showToast('🎉 Order Confirmed! Heirloom drape reserved for you.');
}

function finishCheckoutAndClose() {
  closeCheckoutModal();
  navigateTo('home');
}

/* ==========================================================================
   WHATSAPP HELPERS
   ========================================================================== */

/**
 * Sends a rich order confirmation message to the store WhatsApp after checkout.
 * Called from the order success screen button.
 */
function sendWhatsAppOrderConfirmation() {
  const order = _lastConfirmedOrder;
  if (!order) {
    showToast('No order details found. Please place an order first.');
    return;
  }

  const itemLines = order.items.map(item =>
    `  • ${item.name} (${item.code}) × ${item.quantity} — ₹${((item.price + (item.hasCustomBlouse ? 1499 : 0)) * item.quantity).toLocaleString('en-IN')}`
  ).join('\n');

  const msg = [
    `🎉 *Order Confirmed — House of Zeraha*`,
    ``,
    `📦 *Order ID:* ${order.orderId}`,
    `👤 *Name:* ${order.fullName}`,
    `📱 *Phone:* ${order.phone}`,
    ``,
    `🛍️ *Items Ordered:*`,
    itemLines,
    ``,
    `💰 *Total Paid:* ₹${order.totalINR.toLocaleString('en-IN')}`,
    `💳 *Payment:* ${order.paymentMode}`,
    order.razorpayPaymentId ? `🔒 *Razorpay ID:* ${order.razorpayPaymentId}` : '',
    ``,
    `🚚 *Ship To:* ${order.address}, ${order.city} — ${order.pin}`,
    order.giftNote ? `💌 *Gift Note:* "${order.giftNote}"` : '',
    ``,
    `Please confirm receipt and estimated dispatch timeline. 🙏`
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Opening WhatsApp with your order details ✨');
}

/**
 * Shares the current cart as a WhatsApp message — useful for concierge assistance.
 * Called from the cart drawer "Share My Cart via WhatsApp" button.
 */
function shareCartOnWhatsApp() {
  if (STATE.cart.length === 0) {
    showToast('Your cart is empty. Add some sarees first!');
    return;
  }

  const subtotal = STATE.cart.reduce((sum, item) =>
    sum + ((item.price + (item.hasCustomBlouse ? 1499 : 0)) * item.quantity), 0);

  const itemLines = STATE.cart.map(item =>
    `  • ${item.name} (${item.code}) × ${item.quantity} — ₹${((item.price + (item.hasCustomBlouse ? 1499 : 0)) * item.quantity).toLocaleString('en-IN')}`
  ).join('\n');

  const msg = [
    `🛍️ *My House of Zeraha Shopping Bag*`,
    ``,
    itemLines,
    ``,
    `💰 *Bag Total:* ₹${subtotal.toLocaleString('en-IN')}`,
    ``,
    `I'd love to get your styling advice on this selection. Could you help me with:`,
    `• Any complementary draping recommendations?`,
    `• Current stock availability for these pieces?`,
    `• Customisation or blouse stitching options?`,
    ``,
    `Thank you! 🌸`
  ].join('\n');

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  showToast('Opening WhatsApp to share your cart ✨');
}

/* ==========================================================================
   WISHLIST ENGINE
   ========================================================================== */
function toggleWishlist(productId, btnEl) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const idx = STATE.wishlist.findIndex(item => item.id === productId);
  if (idx > -1) {
    STATE.wishlist.splice(idx, 1);
    if (btnEl) btnEl.classList.remove('active');
    showToast(`Removed from Wishlist`);
  } else {
    STATE.wishlist.push(product);
    if (btnEl) btnEl.classList.add('active');
    showToast(`Added ${product.name} to Wishlist`);
  }

  persistState();
  updateWishlistBadge();
}

function updateWishlistBadge() {
  const count = STATE.wishlist.length;
  const badge = document.getElementById('wishlistCount');
  const drawerCount = document.getElementById('wishlistDrawerCount');
  if (badge) badge.textContent = count;
  if (drawerCount) drawerCount.textContent = count;
}

function openWishlistDrawer() {
  const container = document.getElementById('wishlistItemsContainer');
  if (!container) return;

  if (STATE.wishlist.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <h4>Your Wishlist is Empty</h4>
        <p style="font-size:0.85rem; color:var(--color-espresso-light);">Tap the heart icon on any saree to save your favorite drapes for bridal or festive occasions.</p>
      </div>
    `;
  } else {
    container.innerHTML = STATE.wishlist.map((item, idx) => `
      <div class="cart-item">
        <img src="${item.images[0]}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-info">
          <span class="cart-item-code">${item.code}</span>
          <h4 class="cart-item-title">${item.name}</h4>
          <div class="cart-item-price">${formatPrice(item.sellingPrice)}</div>
          <div class="cart-item-controls">
            <button class="btn btn-gold btn-sm" onclick="quickAddToCart(${item.id}); closeWishlistDrawer();">
              Move to Bag
            </button>
            <span class="remove-item-btn" onclick="toggleWishlist(${item.id}); openWishlistDrawer();">Remove</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('wishlistOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeWishlistDrawer() {
  document.getElementById('wishlistOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
}

/* ==========================================================================
   INSTANT SEARCH MODAL
   ========================================================================== */
function openSearchModal() {
  document.getElementById('searchModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    document.getElementById('liveSearchInput').focus();
  }, 100);
}

function closeSearchModal() {
  document.getElementById('searchModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function setSearchQuery(term) {
  const input = document.getElementById('liveSearchInput');
  if (input) {
    input.value = term;
    handleLiveSearch(term);
  }
}

function handleLiveSearch(query) {
  const container = document.getElementById('searchResultsContainer');
  if (!container) return;

  if (!query.trim()) {
    container.innerHTML = '';
    return;
  }

  const q = query.toLowerCase().trim();
  const matches = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.code.toLowerCase().includes(q) ||
    p.fabric.toLowerCase().includes(q) ||
    p.colour.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--color-espresso-light);">No sarees matching "${query}"</div>`;
    return;
  }

  container.innerHTML = matches.map(p => `
    <div style="display:flex; align-items:center; gap:1rem; padding:0.6rem; border-radius:var(--radius-xs); background:var(--color-ivory-light); border:1px solid var(--color-sand); cursor:pointer;" onclick="closeSearchModal(); openPdpModal(${p.id})">
      <img src="${p.images[0]}" alt="${p.name}" style="width:50px; height:65px; object-fit:cover; border-radius:var(--radius-xs);">
      <div style="flex-grow:1;">
        <span style="font-size:0.68rem; font-weight:700; color:var(--color-champagne-dark);">${p.code}</span>
        <h5 style="font-size:0.95rem; color:var(--color-espresso);">${p.name}</h5>
        <div style="font-size:0.8rem; font-weight:600; color:var(--color-espresso-deep);">${formatPrice(p.sellingPrice)}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); closeSearchModal(); quickAddToCart(${p.id})">Add to Bag</button>
    </div>
  `).join('');
}

/* ==========================================================================
   CONCIERGE & WHATSAPP MODAL (06)
   ========================================================================== */
function openConciergeModal() {
  document.getElementById('conciergeModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeConciergeModal() {
  document.getElementById('conciergeModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function handleConciergeSubmit() {
  const name  = document.getElementById('conciergeName').value.trim();
  const phone = document.getElementById('conciergePhone').value.trim();
  const occ   = document.getElementById('conciergeOccasion').value;
  const notes = document.getElementById('conciergeNotes').value.trim();

  if (!name || !phone) {
    showToast('Please enter your name and WhatsApp number');
    return;
  }

  const msg = [
    `🙏 Namaste, House of Zeraha!`,
    ``,
    `I am *${name}* and I would like a personalised consultation.`,
    `📱 My WhatsApp: ${phone}`,
    `✨ Occasion / Interest: *${occ}*`,
    notes ? `📝 Notes: ${notes}` : '',
    ``,
    `Please connect me with an atelier stylist at your earliest convenience. 🌸`
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeConciergeModal();
  showToast('Opening WhatsApp — Our stylist will respond shortly ✨');
}

/* ==========================================================================
   A6 PLATFORM ARCHITECTURE MODAL (07)
   ========================================================================== */
function openPlatformModal() {
  document.getElementById('platformModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePlatformModal() {
  document.getElementById('platformModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function copyPlatformPrompt() {
  const text = document.getElementById('platformPromptText').innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Platform prompt copied to clipboard!');
  }).catch(() => {
    showToast('Copied to clipboard');
  });
}

/* ==========================================================================
   POLICIES MODAL (08)
   ========================================================================== */
function openPolicyModal(type) {
  const container = document.getElementById('policyContent');
  if (!container) return;

  if (type === 'shipping') {
    container.innerHTML = `
      <span class="section-pretitle">Worldwide Transit</span>
      <h3 style="font-size:1.8rem; margin-bottom:1rem;">Shipping & Delivery Policy</h3>
      <p style="margin-bottom:1rem;"><strong>Complimentary Domestic Delivery:</strong> All orders shipped across India receive free insured express delivery. Metro deliveries (Mumbai, Delhi NCR, Bengaluru, Chennai, Hyderabad, Kolkata) arrive within 2–3 business days. Other cities arrive within 4 business days.</p>
      <p style="margin-bottom:1rem;"><strong>International Express:</strong> We deliver to over 45 countries including USA, UK, UAE, Canada, Australia and Singapore via DHL Express with door-to-door tracking. International delivery takes 4–6 business days.</p>
      <p><strong>Insured Keepsake Packaging:</strong> Every saree is dispatched in our signature rigid velvet preservation box inside a weatherproof security-sealed outer casing.</p>
    `;
  } else if (type === 'returns') {
    container.innerHTML = `
      <span class="section-pretitle">Guaranteed Peace of Mind</span>
      <h3 style="font-size:1.8rem; margin-bottom:1rem;">7-Day Return & Exchange Privilege</h3>
      <p style="margin-bottom:1rem;">We understand that an heirloom saree is an emotional purchase. If you wish to exchange your saree for a different weave or colour palette, you may initiate a return within 7 days of delivery.</p>
      <p style="margin-bottom:1rem;"><strong>Conditions:</strong> The saree must be unworn, unwashed, with the unstitched blouse intact and the Silk Mark security tag affixed.</p>
      <p><strong>Reverse Pickup:</strong> Our concierge will arrange a seamless doorstep courier pickup at no cost to you.</p>
    `;
  } else {
    container.innerHTML = `
      <span class="section-pretitle">Ministry of Textiles</span>
      <h3 style="font-size:1.8rem; margin-bottom:1rem;">Silk Mark Certification & Authenticity</h3>
      <p style="margin-bottom:1rem;">House Of Zeraha is an authorized corporate member of the Silk Mark Organisation of India (SMOI), sponsored by the Central Silk Board, Ministry of Textiles, Government of India.</p>
      <p style="margin-bottom:1rem;">Every pure silk drape in our collection carries a non-reusable Silk Mark holographic tag with a unique serial number that can be authenticated directly on the official Silk Mark national registry.</p>
      <p>We guarantee 100% natural mulberry silk yarns and genuine silver-gilt tested zari threads.</p>
    `;
  }

  document.getElementById('policyModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePolicyModal() {
  document.getElementById('policyModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

/* ==========================================================================
   ATELIER ACCOUNT & TRACK ORDER MODALS
   ========================================================================== */
function openAccountModal() {
  document.getElementById('accountModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAccountModal() {
  document.getElementById('accountModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function simulateLogin() {
  showToast('Welcome back, Gayatri Krishnan. VIP privileges active.');
  closeAccountModal();
}

function openTrackOrderModal() {
  const orderId = prompt('Enter your House of Zeraha Order ID (e.g. HZ-2026-8941):');
  if (orderId) {
    alert(`Order ${orderId}:\nStatus: Out for Delivery with Express Insured Courier\nEstimated Arrival: Tomorrow before 6:00 PM\nAuthentication: Silk Mark Certified.`);
  }
}

function handleNewsletterSubmit() {
  const email = document.getElementById('newsletterEmail').value;
  if (email) {
    showToast('Privilege code ELEGANCE10 sent to ' + email);
    document.getElementById('newsletterEmail').value = '';
  }
}

/* ==========================================================================
   TOAST NOTIFICATION COMPONENT
   ========================================================================== */
let toastTimeout;
function showToast(message, icon = '⚜') {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');

  if (!toast) return;

  clearTimeout(toastTimeout);
  msgEl.textContent = message;
  iconEl.textContent = icon;
  toast.classList.add('active');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

/* ==========================================================================
   ANNOUNCEMENT BAR ROTATING SLIDER / TICKER
   ========================================================================== */
function initAnnouncementBar() {
  const slider = document.getElementById('announcementSlider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.announcement-slide'));
  if (slides.length <= 1) return;

  const prevBtn = document.getElementById('announcementPrev');
  const nextBtn = document.getElementById('announcementNext');
  const sliderWrap = document.getElementById('announcementSliderWrap') || slider;

  let currentIndex = 0;
  let timer = null;
  let isTransitioning = false;
  const ROTATE_INTERVAL = 4500; // 4.5 seconds per announcement

  function goToSlide(nextIndex, direction = 'next') {
    if (isTransitioning || nextIndex === currentIndex) return;
    isTransitioning = true;

    const currentSlide = slides[currentIndex];
    const targetSlide = slides[nextIndex];

    if (direction === 'next') {
      currentSlide.classList.remove('active');
      currentSlide.classList.add('exit-up');

      targetSlide.classList.add('enter-up');
      void targetSlide.offsetWidth; // Force layout reflow
      targetSlide.classList.add('active');
      targetSlide.classList.remove('enter-up');
    } else {
      currentSlide.classList.remove('active');
      currentSlide.classList.add('exit-down');

      targetSlide.classList.add('enter-down');
      void targetSlide.offsetWidth; // Force layout reflow
      targetSlide.classList.add('active');
      targetSlide.classList.remove('enter-down');
    }

    currentIndex = nextIndex;

    setTimeout(() => {
      slides.forEach((s, idx) => {
        if (idx !== currentIndex) {
          s.classList.remove('active', 'exit-up', 'exit-down', 'enter-up', 'enter-down');
        }
      });
      isTransitioning = false;
    }, 550);
  }

  function advanceNext() {
    const nextIdx = (currentIndex + 1) % slides.length;
    goToSlide(nextIdx, 'next');
  }

  function advancePrev() {
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(prevIdx, 'prev');
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(advanceNext, ROTATE_INTERVAL);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      advanceNext();
      startTimer();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      advancePrev();
      startTimer();
    });
  }

  sliderWrap.addEventListener('mouseenter', stopTimer);
  sliderWrap.addEventListener('mouseleave', startTimer);

  startTimer();
}

function handleAnnouncementClick(index) {
  if (index === 0) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('ELEGANCE10');
    }
    showToast('Privilege code ELEGANCE10 copied to clipboard! (10% OFF)');
  } else if (index === 1) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('RET20');
    }
    showToast('Special Privilege: Cancel return to get 20% MORE OFF! Code RET20 copied');
  }
}

