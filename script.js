let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let currentProduct = null;

function saveData() {
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function updateCounts() {
  const cartTotal = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = cartTotal);
  document.querySelectorAll('#wishlist-count').forEach(el => el.textContent = wishlist.length);
}

function renderCart() {
  const container = document.getElementById('cart-items') || { innerHTML: '' };
  container.innerHTML = '';
  let total = 0;
  cart.forEach((item, i) => {
    total += item.price * (item.qty || 1);
    container.innerHTML += `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="details">
          <strong>${item.name}</strong>
          <small>${item.qty || 1} × ${item.price} MAD</small>
        </div>
        <span>${item.price * (item.qty || 1)} MAD</span>
        <button onclick="removeFromCart(${i})">×</button>
      </div>`;
  });
  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = total + ' MAD';
}

function renderWishlist() {
  const container = document.getElementById('wishlist-items') || { innerHTML: '' };
  container.innerHTML = '';
  wishlist.forEach((item, i) => {
    container.innerHTML += `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="details">
          <strong>${item.name}</strong>
          <small>${item.price} MAD</small>
        </div>
        <button onclick="addToCartFromWishlist(${i})">Add to Cart</button>
      </div>`;
  });
}

window.removeFromCart = (i) => { cart.splice(i, 1); renderCart(); updateCounts(); saveData(); };
window.addToCartFromWishlist = (i) => {
  const item = wishlist[i];
  const existing = cart.find(x => x.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  wishlist.splice(i, 1);
  renderCart(); renderWishlist(); updateCounts(); saveData();
};

document.addEventListener('DOMContentLoaded', () => {
  updateCounts();

  // Loading
  setTimeout(() => document.getElementById('loading-screen')?.classList.add('hidden'), 2800);

  // Cart & Wishlist Buttons
  document.querySelectorAll('#cart-btn, #wishlist-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const target = btn.id === 'cart-btn' ? 'cart-sidebar' : 'wishlist-sidebar';
      document.getElementById(target).classList.add('active');
      document.getElementById('overlay').classList.add('active');
      if (target === 'cart-sidebar') renderCart();
      if (target === 'wishlist-sidebar') renderWishlist();
    });
  });

  document.querySelectorAll('#close-cart, #close-wishlist, #overlay').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.sidebar, .overlay').forEach(s => s.classList.remove('active'));
    });
  });

  // Add to Cart
  document.querySelectorAll('.add-cart').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.glass-card') || btn.closest('.card');
      const item = {
        id: card.dataset.id,
        name: card.querySelector('h3').textContent,
        price: parseInt(card.querySelector('.price').textContent),
        img: card.querySelector('img').src
      };
      const existing = cart.find(x => x.id === item.id);
      if (existing) existing.qty += 1;
      else cart.push({ ...item, qty: 1 });
      updateCounts(); renderCart(); saveData();
      btn.textContent = 'Added ✓';
      btn.style.background = 'var(--gold)';
      setTimeout(() => { btn.textContent = 'Add to Cart'; btn.style.background = ''; }, 1500);
    });
  });

  // Wishlist
  document.querySelectorAll('.wishlist').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.glass-card') || btn.closest('.card');
      const item = {
        id: card.dataset.id,
        name: card.querySelector('h3').textContent,
        price: parseInt(card.querySelector('.price').textContent),
        img: card.querySelector('img').src
      };
      if (!wishlist.find(x => x.id === item.id)) {
        wishlist.push(item);
        updateCounts(); renderWishlist(); saveData();
      }
    });
  });

  // Quick View
  document.querySelectorAll('.glass-card, .card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      currentProduct = {
        id: card.dataset.id,
        name: card.querySelector('h3').textContent,
        price: parseInt(card.querySelector('.price').textContent),
        img: card.querySelector('img').src
      };
      document.getElementById('qv-img').src = currentProduct.img;
      document.getElementById('qv-title').textContent = currentProduct.name;
      document.getElementById('qv-price').textContent = currentProduct.price + ' MAD';
      document.getElementById('quickview').classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  document.getElementById('qv-add-cart').onclick = () => {
    const model = document.getElementById('qv-model').value;
    const name = currentProduct.name + ' (' + document.getElementById('qv-model').selectedOptions[0].textContent + ')';
    const existing = cart.find(i => i.id === currentProduct.id && i.name.includes(model));
    if (existing) existing.qty += 1;
    else cart.push({ ...currentProduct, name, qty: 1 });
    updateCounts(); renderCart(); saveData();
    closeQuickView();
  };

  document.getElementById('qv-wishlist').onclick = () => {
    const model = document.getElementById('qv-model').selectedOptions[0].textContent;
    const name = currentProduct.name + ' (' + model + ')';
    if (!wishlist.find(i => i.id === currentProduct.id && i.name.includes(model))) {
      wishlist.push({ ...currentProduct, name });
      updateCounts(); renderWishlist(); saveData();
    }
    closeQuickView();
  };

  function closeQuickView() {
    document.getElementById('quickview').classList.remove('active');
    document.body.style.overflow = '';
  }
  document.querySelector('.close').onclick = closeQuickView;
  document.getElementById('quickview').onclick = e => { if (e.target === document.getElementById('quickview')) closeQuickView(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeQuickView(); });

  // Checkout Button
  document.getElementById('checkout')?.addEventListener('click', () => {
    if (cart.length === 0) return alert('Cart is empty!');
    window.location.href = 'checkout.html';
  });

  // Clear Cart
  document.getElementById('clear-cart')?.addEventListener('click', () => {
    if (confirm('Empty cart?')) {
      cart = []; renderCart(); updateCounts(); saveData();
    }
  });
});
// Customizer Options
const customOptions = {
  apple: {
    colors: ['Pink Citrus', 'Mint Green', 'Lavender', 'Lemon Yellow', 'Sky Blue', 'Midnight Black', 'Red'],
    price: 37
  },
  rhode: {
    colors: ['Espresso', 'Ribbon', 'Toast', 'Salt'],
    price: 70
  },
  suction: {
    colors: ['Hot Pink', 'Lime Green', 'Black', 'White'],
    price: 27
  }
};

let currentCustom = null;

// Open Customizer
document.querySelectorAll('.customize-btn').forEach(btn => {
  btn.onclick = e => {
    e.stopPropagation();
    const type = btn.dataset.type;
    currentCustom = { type, ...customOptions[type] };

    let colorsHtml = `<label>Choose Color</label><div class="color-grid">`;
    currentCustom.colors.forEach(color => {
      const colorCode = 
        color.includes('Pink') ? '#ff9ecd' :
        color.includes('Mint') || color.includes('Lime') ? '#98fb98' :
        color.includes('Lavender') ? '#c8a2c8' :
        color.includes('Yellow') ? '#ffff99' :
        color.includes('Sky') ? '#87ceeb' :
        color.includes('Black') || color.includes('Midnight') ? '#000000' :
        color.includes('Red') ? '#ff4444' :
        color.includes('Espresso') ? '#4a2c2a' :
        color.includes('Ribbon') ? '#ffb6c1' :
        color.includes('Toast') ? '#d2691e' :
        color.includes('White') ? '#f0f0f0' : '#ffffff';

      colorsHtml += `
        <button class="color-btn" data-color="${color}" style="background:${colorCode}; color:${color.includes('Black') || color.includes('Midnight') ? 'white' : 'black'}">
          ${color}
        </button>`;
    });
    colorsHtml += `</div>`;

    document.getElementById('customizer-options').innerHTML = colorsHtml;
    document.getElementById('custom-model').value = 'iPhone 15 Pro Max'; // default
    document.getElementById('customizer').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Auto-select first color
    document.querySelector('.color-btn').classList.add('active');
  };
});

// Confirm & Add to Cart
document.getElementById('custom-add-cart').onclick = () => {
  if (!currentCustom) return;

  const selectedColor = document.querySelector('.color-btn.active')?.dataset.color || currentCustom.colors[0];
  const selectedModel = document.getElementById('custom-model').value;
  const productName = 
    currentCustom.type === 'apple' ? 'Apple Silicone Case' :
    currentCustom.type === 'rhode' ? 'Rhode Lip Case' :
    'Suction Grip Case';

  const fullName = `${productName} — ${selectedColor} (${selectedModel})`;

  const item = {
    id: `${currentCustom.type}-${selectedColor.replace(/ /g,'-')}-${selectedModel.replace(/ /g,'-')}`,
    name: fullName,
    price: currentCustom.price,
    img: document.querySelector(`[data-id="${currentCustom.type === 'apple' ? 'apple-silicone' : currentCustom.type === 'rhode' ? 'rhode-lip' : 'suction-grip'}"] img`).src
  };

  const existing = cart.find(x => x.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });

  updateCounts();
  renderCart();
  saveData();

  document.getElementById('customizer').classList.remove('active');
  document.body.style.overflow = '';
  alert('Added to cart: ' + fullName);
};

// Close modal
document.querySelector('#customizer .close').onclick = () => {
  document.getElementById('customizer').classList.remove('active');
  document.body.style.overflow = '';
};

// COLOR SELECTION — FIXED, PERFECT, GORGEOUS
document.getElementById('customizer-options').addEventListener('click', e => {
  const btn = e.target.closest('.color-btn');
  if (!btn) return;

  // Remove active from all
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  
  // Add active to clicked
  btn.classList.add('active');
});


// PERFECT SMOOTH SCROLL — LANDS EXACTLY ON THE PRODUCT CARDS
document.querySelectorAll('.smooth-scroll').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    const cardsContainer = document.querySelector('.cards-container');
    if (!cardsContainer) return;

    // Get the position of the first row of cards
    const rect = cardsContainer.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = rect.top + scrollTop;

    // Final scroll position: cards appear nicely in view
    const offset = 120; // Adjust this if you want it higher or lower (120 is perfect)

    window.scrollTo({
      top: targetPosition - offset,
      behavior: 'smooth'
    });
  });
});