/**
 * ==========================================================================
 * HOUSE OF ZERAHA — CMS & ADMIN STUDIO
 * Visual Live Editor: Inline Text, Images, Box/Card Management & Columns
 * ==========================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'hz_cms_store';

  // Default Preset Boutique Images for Image Editor
  const PRESET_GALLERY = [
    { title: "Royal Golden Saree", url: "assets/images/collection_silk.jpg" },
    { title: "Crimson Bridal Trousseau", url: "assets/images/collection_wedding.jpg" },
    { title: "Pastel Sheer Organza", url: "assets/images/collection_semisilk.jpg" },
    { title: "Burgundy & Zardozi Edit", url: "assets/images/collection_festive.jpg" },
    { title: "Royal Ivory Silk Banner", url: "assets/images/hero_banner.jpg" },
    { title: "Heritage Atelier Craft", url: "assets/images/atelier_craft.jpg" },
    { title: "Opulent Kanjivaram Weave", url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80" },
    { title: "Scarlet Royal Bridal Silk", url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80" },
    { title: "Emerald Green Banarasi", url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80" },
    { title: "Peacock Blue Kadwa Saree", url: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80" },
    { title: "Ethereal Pastel Drapery", url: "https://images.unsplash.com/photo-1611042553365-9b101441c135?auto=format&fit=crop&w=1000&q=80" },
    { title: "Deep Imperial Violet Silk", url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80" }
  ];

  // Active Admin State
  window.ADMIN_STUDIO = {
    isActive: false,
    isPreviewMode: false,
    activeImageTarget: null,
    unsavedChangesCount: 0,
    store: {
      textOverrides: {},
      imageOverrides: {},
      customProducts: [],
      deletedProductIds: [],
      customAnnouncements: [],
      customCollections: [],
      customFaqs: [],
      columnLayout: '4'
    }
  };

  /**
   * Initialize Admin Studio on DOM Ready
   */
  function initAdminStudio() {
    loadStore();
    applyStoreToPage();
    injectAdminInterface();
    bindAdminEvents();
    enhanceEditableContent();
    applyColumnLayout(window.ADMIN_STUDIO.store.columnLayout || '4', false);
  }

  /**
   * Load Persistent CMS Data from LocalStorage
   */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        window.ADMIN_STUDIO.store = Object.assign({
          textOverrides: {},
          imageOverrides: {},
          customProducts: [],
          deletedProductIds: [],
          customAnnouncements: [],
          customCollections: [],
          customFaqs: [],
          columnLayout: '4'
        }, parsed);

        // Merge custom products into PRODUCTS array if available
        if (window.PRODUCTS && Array.isArray(window.ADMIN_STUDIO.store.customProducts)) {
          window.ADMIN_STUDIO.store.customProducts.forEach(cp => {
            const existingIdx = window.PRODUCTS.findIndex(p => p.id === cp.id);
            if (existingIdx >= 0) {
              window.PRODUCTS[existingIdx] = Object.assign({}, window.PRODUCTS[existingIdx], cp);
            } else {
              window.PRODUCTS.unshift(cp);
            }
          });
        }

        // Filter out deleted products
        if (window.PRODUCTS && Array.isArray(window.ADMIN_STUDIO.store.deletedProductIds)) {
          window.PRODUCTS = window.PRODUCTS.filter(p => !window.ADMIN_STUDIO.store.deletedProductIds.includes(p.id));
        }
      }
    } catch (err) {
      console.warn('Could not load CMS store:', err);
    }
  }

  /**
   * Save CMS Store to LocalStorage
   */
  function saveStore() {
    try {
      // Capture any active contenteditable text currently focused
      document.querySelectorAll('[data-cms-id]').forEach(el => {
        const id = el.getAttribute('data-cms-id');
        if (id) {
          window.ADMIN_STUDIO.store.textOverrides[id] = el.innerHTML.trim();
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.ADMIN_STUDIO.store));
      window.ADMIN_STUDIO.unsavedChangesCount = 0;
      updateToolbarStatus();

      if (typeof window.showToast === 'function') {
        window.showToast('✓ Website changes saved successfully! All edits are now live.');
      } else {
        alert('Website changes saved successfully!');
      }
    } catch (err) {
      console.error('Error saving CMS store:', err);
      alert('Could not save changes: ' + err.message);
    }
  }

  /**
   * Reset Website Content back to Default Boutique State
   */
  function resetDefaults() {
    const confirmed = confirm(
      'Are you sure you want to reset all custom edits?\n\nThis will restore the original boutique text, images, and catalog layouts.'
    );
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    window.ADMIN_STUDIO.unsavedChangesCount = 0;
    if (typeof window.showToast === 'function') {
      window.showToast('Restoring boutique original defaults...');
    }
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }

  /**
   * Apply Stored Overrides to DOM Elements
   */
  function applyStoreToPage() {
    const { textOverrides, imageOverrides } = window.ADMIN_STUDIO.store;

    // Apply text overrides
    if (textOverrides) {
      Object.keys(textOverrides).forEach(id => {
        const el = document.querySelector(`[data-cms-id="${id}"]`);
        if (el) {
          el.innerHTML = textOverrides[id];
        }
      });
    }

    // Apply image overrides
    if (imageOverrides) {
      Object.keys(imageOverrides).forEach(id => {
        const img = document.querySelector(`[data-cms-img-id="${id}"]`) || document.getElementById(id);
        if (img) {
          if (img.tagName === 'IMG') {
            img.src = imageOverrides[id];
          } else {
            img.style.backgroundImage = `url("${imageOverrides[id]}")`;
          }
        }
      });
    }

    // Apply custom announcements if any
    if (window.ADMIN_STUDIO.store.customAnnouncements && window.ADMIN_STUDIO.store.customAnnouncements.length > 0) {
      const slider = document.getElementById('announcementSlider');
      if (slider) {
        window.ADMIN_STUDIO.store.customAnnouncements.forEach((ann, idx) => {
          if (!document.getElementById(`custom-ann-${idx}`)) {
            const slide = document.createElement('div');
            slide.className = 'announcement-slide';
            slide.id = `custom-ann-${idx}`;
            slide.setAttribute('data-index', slider.children.length);
            slide.innerHTML = `
              <span class="announcement-tag" data-cms-id="custom-ann-tag-${idx}">${ann.tag || 'Special Offer'}</span>
              <span class="announcement-text" data-cms-id="custom-ann-text-${idx}">${ann.text || 'Exclusive Boutique Offer'}</span>
            `;
            slider.appendChild(slide);
          }
        });
      }
    }
  }

  /**
   * Automatically tag and enhance all key editable text & images across the site
   */
  function enhanceEditableContent() {
    // 1. Tag Section Titles and Subtitles
    const editableSelectors = [
      { sel: '.hero-title', id: 'hero-title' },
      { sel: '.hero-subtitle', id: 'hero-subtitle' },
      { sel: '.hero-tag', id: 'hero-tag' },
      { sel: '#announcementSlider .announcement-slide[data-index="0"] .announcement-tag', id: 'announcement-tag-0' },
      { sel: '#announcementSlider .announcement-slide[data-index="0"] .announcement-text', id: 'announcement-text-0' },
      { sel: '#announcementSlider .announcement-slide[data-index="1"] .announcement-tag', id: 'announcement-tag-1' },
      { sel: '#announcementSlider .announcement-slide[data-index="1"] .announcement-text', id: 'announcement-text-1' },
      { sel: '.hero-btn-primary', id: 'hero-btn-primary' },
      { sel: '.hero-btn-secondary', id: 'hero-btn-secondary' },
      { sel: '#collectionsSection .section-title', id: 'collections-section-title' },
      { sel: '#collectionsSection .section-subtitle', id: 'collections-section-subtitle' },
      { sel: '#collectionsSection .section-desc', id: 'collections-section-desc' },
      { sel: '.featured-section .section-title', id: 'featured-section-title' },
      { sel: '.featured-section .section-subtitle', id: 'featured-section-subtitle' },
      { sel: '#occasionsSection .section-title', id: 'occasions-section-title' },
      { sel: '#occasionsSection .section-subtitle', id: 'occasions-section-subtitle' },
      { sel: '#storySection .section-title', id: 'story-section-title' },
      { sel: '#storySection .section-subtitle', id: 'story-section-subtitle' },
      { sel: '#storySection .story-text-p1', id: 'story-p1' },
      { sel: '#storySection .story-text-p2', id: 'story-p2' },
      { sel: '.reviews-section .section-title', id: 'reviews-section-title' },
      { sel: '.reviews-section .section-subtitle', id: 'reviews-section-subtitle' },
      { sel: '#faqSection .section-title', id: 'faq-section-title' },
      { sel: '#faqSection .section-subtitle', id: 'faq-section-subtitle' },
      { sel: '.newsletter-title', id: 'newsletter-title' },
      { sel: '.newsletter-subtitle', id: 'newsletter-subtitle' },
      { sel: '.footer-about-text', id: 'footer-about-text' }
    ];

    editableSelectors.forEach(({ sel, id }) => {
      const el = document.querySelector(sel);
      if (el && !el.getAttribute('data-cms-id')) {
        el.setAttribute('data-cms-id', id);
        el.setAttribute('data-cms-editable', 'true');
      }
    });

    // Tag Key Images
    const imageSelectors = [
      { sel: '.hero-bg-img', id: 'hero-banner-img' },
      { sel: '.story-image-wrap img', id: 'atelier-craft-img' }
    ];

    imageSelectors.forEach(({ sel, id }) => {
      const img = document.querySelector(sel);
      if (img) {
        img.setAttribute('data-cms-img-id', id);
        wrapImageWithAdminOverlay(img, id);
      }
    });

    // Tag Collection Cards
    document.querySelectorAll('.collection-card').forEach((card, idx) => {
      const img = card.querySelector('.collection-img');
      const title = card.querySelector('.collection-card-title');
      const sub = card.querySelector('.collection-card-sub');
      const badge = card.querySelector('.collection-badge');

      if (img) {
        const imgId = `col-img-${idx}`;
        img.setAttribute('data-cms-img-id', imgId);
        wrapImageWithAdminOverlay(img, imgId);
      }
      if (title && !title.getAttribute('data-cms-id')) {
        title.setAttribute('data-cms-id', `col-title-${idx}`);
        title.setAttribute('data-cms-editable', 'true');
      }
      if (sub && !sub.getAttribute('data-cms-id')) {
        sub.setAttribute('data-cms-id', `col-sub-${idx}`);
        sub.setAttribute('data-cms-editable', 'true');
      }
      if (badge && !badge.getAttribute('data-cms-id')) {
        badge.setAttribute('data-cms-id', `col-badge-${idx}`);
        badge.setAttribute('data-cms-editable', 'true');
      }

      addCardAdminActions(card, 'collection', idx);
    });

    // Tag Product Cards
    tagProductCards();

    // Tag FAQ Items
    document.querySelectorAll('.faq-item').forEach((item, idx) => {
      const q = item.querySelector('.faq-question h4');
      const a = item.querySelector('.faq-answer p');
      if (q && !q.getAttribute('data-cms-id')) {
        q.setAttribute('data-cms-id', `faq-q-${idx}`);
        q.setAttribute('data-cms-editable', 'true');
      }
      if (a && !a.getAttribute('data-cms-id')) {
        a.setAttribute('data-cms-id', `faq-a-${idx}`);
        a.setAttribute('data-cms-editable', 'true');
      }
      addCardAdminActions(item, 'faq', idx);
    });

    // Add Section "+ Add Item" buttons
    addSectionAddButtons();
  }

  /**
   * Tag dynamic product cards for editing
   */
  function tagProductCards() {
    document.querySelectorAll('.product-card').forEach(card => {
      const pId = card.getAttribute('data-product-id');
      const img = card.querySelector('.product-img');
      const title = card.querySelector('.product-title');
      const fabric = card.querySelector('.product-fabric');
      const price = card.querySelector('.price-current');

      if (img && pId) {
        const imgId = `product-img-${pId}`;
        img.setAttribute('data-cms-img-id', imgId);
        wrapImageWithAdminOverlay(img, imgId);
      }
      if (title && pId && !title.getAttribute('data-cms-id')) {
        title.setAttribute('data-cms-id', `prod-title-${pId}`);
        title.setAttribute('data-cms-editable', 'true');
      }
      if (fabric && pId && !fabric.getAttribute('data-cms-id')) {
        fabric.setAttribute('data-cms-id', `prod-fabric-${pId}`);
        fabric.setAttribute('data-cms-editable', 'true');
      }
      if (price && pId && !price.getAttribute('data-cms-id')) {
        price.setAttribute('data-cms-id', `prod-price-${pId}`);
        price.setAttribute('data-cms-editable', 'true');
      }

      if (pId && !card.querySelector('.admin-card-actions')) {
        addCardAdminActions(card, 'product', pId);
      }
    });
  }

  /**
   * Wrap an image element with Admin Edit Overlay
   */
  function wrapImageWithAdminOverlay(imgEl, imgId) {
    if (!imgEl) return;
    const parent = imgEl.parentElement;
    if (!parent) return;

    if (!parent.classList.contains('admin-img-target-wrap')) {
      parent.classList.add('admin-img-target-wrap');
    }

    if (!parent.querySelector('.admin-img-edit-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-img-edit-btn';
      btn.setAttribute('aria-label', 'Change Image');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span>Change Image</span>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openImageEditorModal(imgEl, imgId);
      });
      parent.appendChild(btn);
    }
  }

  /**
   * Add Delete and Duplicate actions on Card Boxes
   */
  function addCardAdminActions(cardEl, type, id) {
    if (cardEl.querySelector('.admin-card-actions')) return;

    const wrap = document.createElement('div');
    wrap.className = 'admin-card-actions';
    wrap.innerHTML = `
      <button type="button" class="admin-card-btn duplicate-btn" title="Duplicate Box">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Clone</span>
      </button>
      <button type="button" class="admin-card-btn delete-btn" title="Delete Box">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        <span>Delete</span>
      </button>
    `;

    wrap.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBox(cardEl, type, id);
    });

    wrap.querySelector('.duplicate-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      duplicateBox(cardEl, type, id);
    });

    cardEl.style.position = 'relative';
    cardEl.appendChild(wrap);
  }

  /**
   * Delete a Box/Card and Reflow Layout
   */
  function deleteBox(el, type, id) {
    if (!confirm('Are you sure you want to delete this box?')) return;

    if (type === 'product' && window.ADMIN_STUDIO.store.deletedProductIds) {
      window.ADMIN_STUDIO.store.deletedProductIds.push(Number(id) || id);
    }

    el.style.transition = 'all 0.35s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.85)';

    setTimeout(() => {
      el.remove();
      window.ADMIN_STUDIO.unsavedChangesCount++;
      updateToolbarStatus();
      if (typeof window.showToast === 'function') {
        window.showToast('Box removed. Remember to click Save Changes to persist.');
      }
    }, 350);
  }

  /**
   * Duplicate a Box/Card and Reflow Layout
   */
  function duplicateBox(el, type, id) {
    const clone = el.cloneNode(true);
    const newId = Date.now();

    // Re-bind cloned elements
    clone.style.opacity = '0';
    clone.style.transform = 'scale(0.9)';
    clone.style.transition = 'all 0.35s ease';

    // Update attributes
    clone.querySelectorAll('[data-cms-id]').forEach(elem => {
      const oldCmsId = elem.getAttribute('data-cms-id');
      elem.setAttribute('data-cms-id', `${oldCmsId}-copy-${newId}`);
    });

    // Remove old overlay actions before re-attaching
    const oldActions = clone.querySelector('.admin-card-actions');
    if (oldActions) oldActions.remove();

    const oldImgBtn = clone.querySelector('.admin-img-edit-btn');
    if (oldImgBtn) oldImgBtn.remove();

    el.parentNode.insertBefore(clone, el.nextSibling);

    const img = clone.querySelector('img');
    if (img) {
      wrapImageWithAdminOverlay(img, `img-clone-${newId}`);
    }

    addCardAdminActions(clone, type, newId);

    setTimeout(() => {
      clone.style.opacity = '1';
      clone.style.transform = 'scale(1)';
      window.ADMIN_STUDIO.unsavedChangesCount++;
      updateToolbarStatus();
      if (typeof window.showToast === 'function') {
        window.showToast('Box duplicated! You can now edit its text and image.');
      }
    }, 50);
  }

  /**
   * Add "+ Add New Box" buttons to grid sections
   */
  function addSectionAddButtons() {
    // 1. Featured Sarees Section Add Button
    const productsSection = document.querySelector('.featured-section .container');
    if (productsSection && !document.getElementById('adminAddProductBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'adminAddProductBtn';
      btn.className = 'admin-section-add-btn';
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>+ Add New Saree Product</span>
      `;
      btn.addEventListener('click', openAddProductModal);
      productsSection.appendChild(btn);
    }

    // 2. Collections Section Add Button
    const colSection = document.querySelector('#collectionsSection .container');
    if (colSection && !document.getElementById('adminAddCollectionBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'adminAddCollectionBtn';
      btn.className = 'admin-section-add-btn';
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>+ Add New Collection Card</span>
      `;
      btn.addEventListener('click', openAddCollectionModal);
      colSection.appendChild(btn);
    }

    // 3. Announcement Bar Add Button
    const annBar = document.getElementById('announcementSliderWrap');
    if (annBar && !document.getElementById('adminAddAnnounceBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'adminAddAnnounceBtn';
      btn.className = 'admin-announcement-add-btn';
      btn.title = 'Add new running announcement message';
      btn.innerHTML = `+ Message`;
      btn.addEventListener('click', addNewAnnouncementMessage);
      annBar.appendChild(btn);
    }

    // 4. FAQ Section Add Button
    const faqContainer = document.querySelector('#faqSection .container');
    if (faqContainer && !document.getElementById('adminAddFaqBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'adminAddFaqBtn';
      btn.className = 'admin-section-add-btn';
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>+ Add FAQ Question</span>
      `;
      btn.addEventListener('click', addNewFaqItem);
      faqContainer.appendChild(btn);
    }
  }

  /**
   * Add a new Announcement message into the running loop
   */
  function addNewAnnouncementMessage() {
    const slider = document.getElementById('announcementSlider');
    if (!slider) return;

    const count = slider.querySelectorAll('.announcement-slide').length;
    const newSlide = document.createElement('div');
    newSlide.className = 'announcement-slide';
    newSlide.setAttribute('data-index', count);
    newSlide.innerHTML = `
      <span class="announcement-tag" data-cms-id="custom-ann-tag-${count}">Limited Offer</span>
      <span class="announcement-text" data-cms-id="custom-ann-text-${count}">Click to edit this custom promotion announcement</span>
    `;

    slider.appendChild(newSlide);
    window.ADMIN_STUDIO.store.customAnnouncements.push({
      tag: 'Limited Offer',
      text: 'Click to edit this custom promotion announcement'
    });

    window.ADMIN_STUDIO.unsavedChangesCount++;
    updateToolbarStatus();
    enhanceEditableContent();

    if (typeof window.initAnnouncementBar === 'function') {
      window.initAnnouncementBar();
    }

    if (typeof window.showToast === 'function') {
      window.showToast('New announcement added! Click on the text to customize it.');
    }
  }

  /**
   * Add a new FAQ Item to Accordion
   */
  function addNewFaqItem() {
    const faqList = document.querySelector('.faq-list');
    if (!faqList) return;

    const index = faqList.children.length;
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <div class="faq-question" onclick="toggleFaq(${index})">
        <h4 data-cms-id="faq-q-${index}">Click to edit this frequently asked question?</h4>
        <div class="faq-toggle-icon">
          <svg viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
      <div class="faq-answer">
        <p data-cms-id="faq-a-${index}">Click to write the answer explaining care, fabric, or boutique heritage details.</p>
      </div>
    `;

    faqList.appendChild(item);
    addCardAdminActions(item, 'faq', index);
    enhanceEditableContent();
    window.ADMIN_STUDIO.unsavedChangesCount++;
    updateToolbarStatus();

    if (typeof window.showToast === 'function') {
      window.showToast('New FAQ box added! Click to edit question and answer.');
    }
  }

  /**
   * Modal: Add New Saree Product Box
   */
  function openAddProductModal() {
    const modal = document.getElementById('adminAddProductModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  /**
   * Modal: Add New Collection Box
   */
  function openAddCollectionModal() {
    const name = prompt('Enter new Collection Name (e.g., Royal Tussar Silks):', 'Royal Tussar Silks');
    if (!name) return;

    const sub = prompt('Enter Collection Subtitle (e.g., Hand-loomed Wild Silks):', 'Hand-loomed Wild Silks');
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;

    const idx = grid.children.length;
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.innerHTML = `
      <div class="collection-img-wrap admin-img-target-wrap">
        <img src="assets/images/collection_silk.jpg" alt="${name}" class="collection-img" data-cms-img-id="col-img-${idx}">
      </div>
      <div class="collection-overlay"></div>
      <span class="collection-badge" data-cms-id="col-badge-${idx}">New Edition</span>
      <div class="collection-content">
        <span class="collection-item-count">6 Heirloom Pieces</span>
        <h3 class="collection-card-title" data-cms-id="col-title-${idx}">${name}</h3>
        <p class="collection-card-sub" data-cms-id="col-sub-${idx}">${sub || ''}</p>
        <span class="collection-link-btn">
          Explore Collection
          <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </span>
      </div>
    `;

    grid.appendChild(card);
    wrapImageWithAdminOverlay(card.querySelector('.collection-img'), `col-img-${idx}`);
    addCardAdminActions(card, 'collection', idx);
    enhanceEditableContent();

    window.ADMIN_STUDIO.unsavedChangesCount++;
    updateToolbarStatus();

    if (typeof window.showToast === 'function') {
      window.showToast(`Collection "${name}" added! Click image or text to customize.`);
    }
  }

  /**
   * Confirm Add Product from Modal
   */
  function handleConfirmAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('newProdName').value.trim() || 'Custom Heirloom Silk Saree';
    const category = document.getElementById('newProdCategory').value || 'Silk';
    const price = Number(document.getElementById('newProdPrice').value) || 24500;
    const fabric = document.getElementById('newProdFabric').value.trim() || '100% Pure Mulberry Silk with Pure Zari';
    const image = document.getElementById('newProdImage').value.trim() || 'assets/images/collection_silk.jpg';

    const newProduct = {
      id: Date.now(),
      code: `HZ-${category.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      name: name,
      category: category,
      subCategory: `${category} Heritage`,
      fabric: fabric,
      colour: 'Custom Royal Weave',
      colourFamily: 'Gold',
      sellingPrice: price,
      mrp: Math.round(price * 1.25),
      inventory: 3,
      images: [image],
      isBestseller: true,
      isNew: true,
      rating: 5.0,
      reviewCount: 1,
      shortDescription: `Artisanal masterpiece in ${fabric}.`
    };

    if (!window.PRODUCTS) window.PRODUCTS = [];
    window.PRODUCTS.unshift(newProduct);
    window.ADMIN_STUDIO.store.customProducts.push(newProduct);

    // Re-render Featured Grid
    if (typeof window.renderFeaturedProducts === 'function') {
      window.renderFeaturedProducts('all');
    }

    tagProductCards();
    enhanceEditableContent();

    window.ADMIN_STUDIO.unsavedChangesCount++;
    updateToolbarStatus();

    closeModal('adminAddProductModal');

    if (typeof window.showToast === 'function') {
      window.showToast(`Added saree "${name}" to the showcase!`);
    }
  }

  /**
   * Open Image Studio Modal
   */
  function openImageEditorModal(imgEl, imgId) {
    window.ADMIN_STUDIO.activeImageTarget = { imgEl, imgId };

    const modal = document.getElementById('adminImageEditorModal');
    if (!modal) return;

    const currentSrc = imgEl.tagName === 'IMG' ? imgEl.src : (imgEl.style.backgroundImage || '');
    document.getElementById('adminCurrentImgPreview').src = currentSrc.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
    document.getElementById('adminImageUrlInput').value = '';
    document.getElementById('adminImageFileInput').value = '';

    modal.classList.add('active');
  }

  /**
   * Apply Selected Image to Target
   */
  function applySelectedImage() {
    const target = window.ADMIN_STUDIO.activeImageTarget;
    if (!target) return;

    let newUrl = document.getElementById('adminImageUrlInput').value.trim();
    if (!newUrl) {
      newUrl = document.getElementById('adminCurrentImgPreview').src;
    }

    if (!newUrl) {
      alert('Please provide an image URL, upload a file, or pick a preset.');
      return;
    }

    // Apply to DOM
    if (target.imgEl.tagName === 'IMG') {
      target.imgEl.src = newUrl;
    } else {
      target.imgEl.style.backgroundImage = `url("${newUrl}")`;
    }

    // Record in Store
    window.ADMIN_STUDIO.store.imageOverrides[target.imgId] = newUrl;
    window.ADMIN_STUDIO.unsavedChangesCount++;
    updateToolbarStatus();

    closeModal('adminImageEditorModal');

    if (typeof window.showToast === 'function') {
      window.showToast('Image updated! Click "Save Changes" in toolbar to make permanent.');
    }
  }

  /**
   * Handle Local Image File Upload via FileReader
   */
  function handleImageFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      const dataUrl = evt.target.result;
      document.getElementById('adminImageUrlInput').value = dataUrl;
      document.getElementById('adminCurrentImgPreview').src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Set Dynamic Column Layout (2, 3, 4, or Auto)
   */
  function applyColumnLayout(cols, markUnsaved = true) {
    const productsGrid = document.getElementById('featuredGrid') || document.querySelector('.products-grid');
    const collectionsGrid = document.getElementById('collectionsGrid') || document.querySelector('.collections-grid');

    const grids = [productsGrid, collectionsGrid].filter(Boolean);
    grids.forEach(grid => {
      grid.classList.remove('cols-2', 'cols-3', 'cols-4', 'cols-auto');
      grid.classList.add(`cols-${cols}`);
    });

    // Update active state in toolbar buttons
    document.querySelectorAll('.admin-col-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cols') === cols);
    });

    window.ADMIN_STUDIO.store.columnLayout = cols;
    if (markUnsaved) {
      window.ADMIN_STUDIO.unsavedChangesCount++;
      updateToolbarStatus();
    }
  }

  /**
   * Toggle Customer Preview Mode (Hides all editor outlines & buttons)
   */
  function toggleCustomerPreview() {
    window.ADMIN_STUDIO.isPreviewMode = !window.ADMIN_STUDIO.isPreviewMode;
    document.body.classList.toggle('admin-preview-mode', window.ADMIN_STUDIO.isPreviewMode);

    const btn = document.getElementById('adminPreviewBtn');
    if (btn) {
      btn.classList.toggle('active', window.ADMIN_STUDIO.isPreviewMode);
      btn.innerHTML = window.ADMIN_STUDIO.isPreviewMode
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> <span>Return to Edit Mode</span>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> <span>Customer Preview</span>`;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(
        window.ADMIN_STUDIO.isPreviewMode
          ? 'Customer Preview ON: Showing clean customer view.'
          : 'Edit Mode Active: Click any text or image to edit.'
      );
    }
  }

  /**
   * Toggle Admin Studio ON/OFF
   */
  window.toggleAdminMode = function (forcedState) {
    const newState = typeof forcedState === 'boolean' ? forcedState : !window.ADMIN_STUDIO.isActive;
    window.ADMIN_STUDIO.isActive = newState;

    document.body.classList.toggle('admin-mode-active', newState);

    const navBtn = document.getElementById('adminToggleBtn');
    if (navBtn) {
      navBtn.classList.toggle('active', newState);
    }

    if (newState) {
      enhanceEditableContent();
      updateToolbarStatus();
      if (typeof window.showToast === 'function') {
        window.showToast('👑 Admin Studio Active: Click any text, image, or card to edit live!');
      }
    } else {
      document.body.classList.remove('admin-preview-mode');
      if (typeof window.showToast === 'function') {
        window.showToast('Admin Studio closed.');
      }
    }
  };

  /**
   * Update Status Text in Toolbar
   */
  function updateToolbarStatus() {
    const countEl = document.getElementById('adminUnsavedCount');
    const saveBtn = document.getElementById('adminSaveBtn');

    if (countEl) {
      if (window.ADMIN_STUDIO.unsavedChangesCount > 0) {
        countEl.textContent = `(${window.ADMIN_STUDIO.unsavedChangesCount} unsaved)`;
        countEl.style.display = 'inline';
      } else {
        countEl.style.display = 'none';
      }
    }

    if (saveBtn) {
      saveBtn.classList.toggle('has-changes', window.ADMIN_STUDIO.unsavedChangesCount > 0);
    }
  }

  /**
   * Export CMS Configuration as downloadable JSON
   */
  function exportCmsBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(window.ADMIN_STUDIO.store, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `house_of_zeraha_cms_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    if (typeof window.showToast === 'function') {
      window.showToast('Backup JSON downloaded successfully!');
    }
  }

  /**
   * Close a Modal by ID
   */
  window.closeAdminModal = function (modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('active');
  };

  function closeModal(modalId) {
    window.closeAdminModal(modalId);
  }

  /**
   * Inject Admin HTML Interface: Toolbar, Image Modal, Add Product Modal
   */
  function injectAdminInterface() {
    // 1. Add Admin Navigation Button to Navbar if not already present
    const navActions = document.querySelector('.nav-actions');
    if (navActions && !document.getElementById('adminToggleBtn')) {
      const adminNavBtn = document.createElement('button');
      adminNavBtn.id = 'adminToggleBtn';
      adminNavBtn.className = 'nav-icon-btn admin-toggle-btn';
      adminNavBtn.title = 'Admin Studio: Visual Live Editor (Ctrl+Shift+A)';
      adminNavBtn.setAttribute('aria-label', 'Toggle Admin Mode');
      adminNavBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        <span class="admin-nav-text">Admin</span>
      `;
      adminNavBtn.addEventListener('click', () => window.toggleAdminMode());
      navActions.insertBefore(adminNavBtn, navActions.firstChild);
    }

    // 2. Add Admin Link in Footer
    const footerLinks = document.querySelector('.footer-col ul');
    if (footerLinks && !document.getElementById('footerAdminLink')) {
      const li = document.createElement('li');
      li.id = 'footerAdminLink';
      li.innerHTML = `<span class="footer-link" style="color:var(--color-champagne); font-weight:600;" onclick="toggleAdminMode(true)">⚜ Admin Studio (Visual Editor)</span>`;
      footerLinks.appendChild(li);
    }

    // 3. Inject Floating Admin Studio Toolbar
    const toolbar = document.createElement('aside');
    toolbar.id = 'adminStudioToolbar';
    toolbar.className = 'admin-studio-toolbar';
    toolbar.setAttribute('aria-label', 'Zeraha Admin Studio Toolbar');
    toolbar.innerHTML = `
      <div class="admin-toolbar-brand">
        <span class="admin-crown-icon">⚜</span>
        <div class="admin-brand-info">
          <span class="admin-brand-title">Admin Studio</span>
          <span class="admin-brand-status">● Live Editor <strong id="adminUnsavedCount" style="display:none; color:#C5A572;"></strong></span>
        </div>
      </div>

      <div class="admin-toolbar-group">
        <span class="admin-group-label">Columns:</span>
        <div class="admin-col-switcher">
          <button type="button" class="admin-col-btn" data-cols="2" onclick="ADMIN_STUDIO.setCols('2')">2</button>
          <button type="button" class="admin-col-btn" data-cols="3" onclick="ADMIN_STUDIO.setCols('3')">3</button>
          <button type="button" class="admin-col-btn active" data-cols="4" onclick="ADMIN_STUDIO.setCols('4')">4</button>
          <button type="button" class="admin-col-btn" data-cols="auto" onclick="ADMIN_STUDIO.setCols('auto')">Auto</button>
        </div>
      </div>

      <div class="admin-toolbar-actions">
        <button type="button" class="admin-tool-btn" id="adminPreviewBtn" onclick="ADMIN_STUDIO.togglePreview()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>Customer Preview</span>
        </button>

        <button type="button" class="admin-tool-btn admin-save-btn" id="adminSaveBtn" onclick="ADMIN_STUDIO.save()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          <span>Save Changes</span>
        </button>

        <button type="button" class="admin-tool-btn" onclick="ADMIN_STUDIO.exportBackup()" title="Download JSON Backup">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Export</span>
        </button>

        <button type="button" class="admin-tool-btn admin-reset-btn" onclick="ADMIN_STUDIO.reset()" title="Reset all changes back to boutique template defaults">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          <span>Reset</span>
        </button>

        <button type="button" class="admin-close-btn" onclick="toggleAdminMode(false)" title="Exit Admin Mode">✕</button>
      </div>
    `;
    document.body.appendChild(toolbar);

    // 4. Inject Image Editor Modal
    const imgModal = document.createElement('div');
    imgModal.id = 'adminImageEditorModal';
    imgModal.className = 'admin-modal-overlay';
    imgModal.innerHTML = `
      <div class="admin-modal-dialog">
        <div class="admin-modal-header">
          <h3>📷 Zeraha Image Studio</h3>
          <button type="button" class="admin-modal-close" onclick="closeAdminModal('adminImageEditorModal')">✕</button>
        </div>
        <div class="admin-modal-body">
          <div class="admin-img-preview-box">
            <span class="admin-preview-label">Live Preview:</span>
            <img id="adminCurrentImgPreview" src="" alt="Selected Preview" class="admin-preview-img">
          </div>

          <div class="admin-form-group">
            <label for="adminImageFileInput"><strong>Option 1: Upload from Computer</strong></label>
            <input type="file" id="adminImageFileInput" accept="image/*" class="admin-file-input">
            <small class="admin-hint">Supports JPG, PNG, WEBP, SVG</small>
          </div>

          <div class="admin-form-group">
            <label for="adminImageUrlInput"><strong>Option 2: Paste Image Web URL</strong></label>
            <input type="url" id="adminImageUrlInput" placeholder="https://images.unsplash.com/..." class="admin-text-input">
          </div>

          <div class="admin-form-group">
            <label><strong>Option 3: Pick from Luxury Preset Boutique Gallery</strong></label>
            <div class="admin-preset-grid" id="adminPresetGrid">
              ${PRESET_GALLERY.map(item => `
                <div class="admin-preset-item" onclick="ADMIN_STUDIO.selectPreset('${item.url}')" title="${item.title}">
                  <img src="${item.url}" alt="${item.title}" loading="lazy">
                  <span>${item.title}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeAdminModal('adminImageEditorModal')">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="ADMIN_STUDIO.applyImage()">Apply to Website</button>
        </div>
      </div>
    `;
    document.body.appendChild(imgModal);

    // Bind file upload change
    document.getElementById('adminImageFileInput').addEventListener('change', handleImageFileUpload);
    document.getElementById('adminImageUrlInput').addEventListener('input', (e) => {
      if (e.target.value.trim()) {
        document.getElementById('adminCurrentImgPreview').src = e.target.value.trim();
      }
    });

    // 5. Inject Add Product Modal
    const prodModal = document.createElement('div');
    prodModal.id = 'adminAddProductModal';
    prodModal.className = 'admin-modal-overlay';
    prodModal.innerHTML = `
      <div class="admin-modal-dialog">
        <div class="admin-modal-header">
          <h3>✨ Add New Saree to Showcase</h3>
          <button type="button" class="admin-modal-close" onclick="closeAdminModal('adminAddProductModal')">✕</button>
        </div>
        <form id="adminAddProductForm" onsubmit="ADMIN_STUDIO.confirmAddProduct(event)">
          <div class="admin-modal-body">
            <div class="admin-form-group">
              <label for="newProdName">Saree Name *</label>
              <input type="text" id="newProdName" required placeholder="e.g. Swarna Mayuri Kanjivaram Silk" class="admin-text-input" value="Swarna Mayuri Heirloom Silk Saree">
            </div>

            <div class="admin-form-row">
              <div class="admin-form-group">
                <label for="newProdCategory">Collection Category</label>
                <select id="newProdCategory" class="admin-text-input">
                  <option value="Silk">Pure Silk</option>
                  <option value="Wedding" selected>Bridal & Wedding</option>
                  <option value="Festive">Festive Celebrations</option>
                  <option value="Organza">Organza & Semi-Silk</option>
                </select>
              </div>

              <div class="admin-form-group">
                <label for="newProdPrice">Price (₹ INR) *</label>
                <input type="number" id="newProdPrice" required placeholder="32000" class="admin-text-input" value="34500">
              </div>
            </div>

            <div class="admin-form-group">
              <label for="newProdFabric">Fabric & Weave Details</label>
              <input type="text" id="newProdFabric" class="admin-text-input" value="100% Pure Mulberry Silk with 3-Ply Real Gold Tested Zari">
            </div>

            <div class="admin-form-group">
              <label for="newProdImage">Image URL</label>
              <input type="text" id="newProdImage" class="admin-text-input" value="assets/images/collection_wedding.jpg">
            </div>
          </div>
          <div class="admin-modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeAdminModal('adminAddProductModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Saree Box</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(prodModal);

    // Export public hooks
    window.ADMIN_STUDIO.save = saveStore;
    window.ADMIN_STUDIO.reset = resetDefaults;
    window.ADMIN_STUDIO.exportBackup = exportCmsBackup;
    window.ADMIN_STUDIO.togglePreview = toggleCustomerPreview;
    window.ADMIN_STUDIO.applyImage = applySelectedImage;
    window.ADMIN_STUDIO.setCols = (c) => applyColumnLayout(c, true);
    window.ADMIN_STUDIO.confirmAddProduct = handleConfirmAddProduct;
    window.ADMIN_STUDIO.selectPreset = (url) => {
      document.getElementById('adminImageUrlInput').value = url;
      document.getElementById('adminCurrentImgPreview').src = url;
    };
  }

  /**
   * Bind Global Events (Keyboard shortcut Ctrl+Shift+A, inline text blur/input tracking)
   */
  function bindAdminEvents() {
    // Keyboard shortcut: Ctrl + Shift + A (or Alt + A)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        window.toggleAdminMode();
      }
    });

    // Contenteditable tracking on editable elements
    document.addEventListener('input', (e) => {
      if (!window.ADMIN_STUDIO.isActive) return;
      const target = e.target;
      if (target && target.getAttribute('data-cms-editable') === 'true') {
        const id = target.getAttribute('data-cms-id');
        if (id) {
          window.ADMIN_STUDIO.store.textOverrides[id] = target.innerHTML;
          window.ADMIN_STUDIO.unsavedChangesCount++;
          updateToolbarStatus();
        }
      }
    });

    // Click handler to activate contenteditable on editables
    document.addEventListener('click', (e) => {
      if (!window.ADMIN_STUDIO.isActive || window.ADMIN_STUDIO.isPreviewMode) return;

      const editable = e.target.closest('[data-cms-editable="true"]');
      if (editable) {
        // Prevent default navigation if it's a link or button
        if (editable.tagName === 'A' || editable.tagName === 'BUTTON' || editable.closest('a')) {
          e.preventDefault();
        }
        editable.contentEditable = 'true';
        editable.focus();
      }
    }, true);
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminStudio);
  } else {
    initAdminStudio();
  }

})();
