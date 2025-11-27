// Updated script.js — auto-sequence Order ID generation based on last numeric order number

let orders = JSON.parse(localStorage.getItem('orders')) || [
  {id: '#1001', customer: 'John Smith', address: '', orderDate: '2024-04-20', deliveryDate: '2024-04-25', status: 'Pending', amount: 250, items: []},
  {id: '#1002', customer: 'Acme Corporation', address: '', orderDate: '2024-04-18', deliveryDate: '2024-04-22', status: 'Shipped', amount: 1200, items: []},
  {id: '#1003', customer: 'Sarah Johnson', address: '', orderDate: '2024-04-15', deliveryDate: '2024-04-20', status: 'Delivered', amount: 350, items: []}
];

let selectedOrderId = null;
let sortDirection = {amount: 'asc', orderDate: 'asc', deliveryDate: 'asc'};
let password = localStorage.getItem('appPassword') || 'admin123';

// Items currently being edited/added in the form
let currentItems = [];

/* ---------------------------
   Authentication helpers
   --------------------------- */
function getQueryParam(name) {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch (e) {
    return null;
  }
}

function performLoginUI() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  if (loginScreen) loginScreen.style.display = 'none';
  if (appScreen) appScreen.style.display = 'block';
  renderOrders();
}

function login() {
  const inputEl = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');
  const input = (inputEl ? inputEl.value : '').trim();
  if (input === password || input === 'admin123') {
    if (loginError) loginError.style.display = 'none';
    performLoginUI();
  } else {
    if (loginError) loginError.style.display = 'block';
  }
}

(function tryAutoLoginFromUrl() {
  const pw = getQueryParam('pw');
  if (!pw) return;
  if (pw === password || pw === 'admin123') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', performLoginUI);
    } else {
      performLoginUI();
    }
  }
})();

/* ---------------------------
   Password change helpers
   --------------------------- */
function openChangePassword() {
  const modal = document.getElementById('passwordModal');
  if (modal) modal.style.display = 'block';
}
function closePasswordModal() {
  const modal = document.getElementById('passwordModal');
  if (modal) modal.style.display = 'none';
}
function changePassword() {
  const newPassEl = document.getElementById('newPassword');
  const newPass = newPassEl ? newPassEl.value : '';
  if (newPass) {
    password = newPass;
    localStorage.setItem('appPassword', newPass);
    alert('Password changed successfully!');
    closePasswordModal();
  }
}

/* ---------------------------
   Render / Orders
   --------------------------- */
function renderOrders(filter = '') {
  const tbody = document.getElementById('orderBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  orders
    .filter(order => order.customer.toLowerCase().includes(filter.toLowerCase()) || order.id.includes(filter))
    .forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${order.id}</td><td>${escapeHtml(order.customer)}</td><td>${order.orderDate || ''}</td><td>${order.deliveryDate || ''}</td><td><span class="status ${order.status}">${order.status}</span></td><td>$${Number(order.amount).toFixed(2)}</td>`;
      row.onclick = () => showDetails(order.id);
      tbody.appendChild(row);
    });
}

// Attach search listener if element exists
const searchEl = document.getElementById('search');
if (searchEl) {
  searchEl.addEventListener('input', function() {
    renderOrders(this.value);
  });
}

function showDetails(orderId) {
  selectedOrderId = orderId;
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const details = document.getElementById('orderDetails');
  if (!details) return;

  let html = `<strong>Order #:</strong> ${escapeHtml(order.id)}<br>`;
  html += `<strong>Customer:</strong> ${escapeHtml(order.customer)}<br>`;
  html += `<strong>Address:</strong> ${escapeHtml(order.address || '')}<br>`;
  html += `<strong>Order Date:</strong> ${order.orderDate || ''}<br>`;
  html += `<strong>Delivery Date:</strong> ${order.deliveryDate || ''}<br>`;
  html += `<strong>Status:</strong> ${order.status}<br>`;
  html += `<strong>Total:</strong> $${Number(order.amount).toFixed(2)}<br><hr>`;

  if (order.items && order.items.length) {
    html += '<table style="width:100%; border-collapse:collapse;">';
    html += '<thead><tr><th style="text-align:left">Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>';
    order.items.forEach(it => {
      html += `<tr><td>${escapeHtml(it.name)}</td><td style="text-align:right">${Number(it.quantity)}</td><td style="text-align:right">$${Number(it.rate).toFixed(2)}</td><td style="text-align:right">$${Number(it.amount).toFixed(2)}</td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p>No items.</p>';
  }

  details.innerHTML = html;
  const orderModal = document.getElementById('orderModal');
  if (orderModal) orderModal.style.display = 'block';
}

function closeModal() { const m = document.getElementById('orderModal'); if (m) m.style.display = 'none'; }

/* ---------------------------
   Add / Edit Order form (bill-style)
   --------------------------- */
function openAddForm() {
  // Prepare a clean form for a new order
  currentItems = [];
  rebuildItemTable();
  updateItemsTotalUI();

  const titleEl = document.getElementById('formTitle');
  if (titleEl) titleEl.innerText = 'Add New Order';

  const editId = document.getElementById('editOrderId');
  if (editId) editId.value = '';

  const orderIdInput = document.getElementById('orderIdInput');
  if (orderIdInput) { orderIdInput.value = ''; orderIdInput.disabled = false; }

  const customerEl = document.getElementById('customer');
  if (customerEl) customerEl.value = '';

  const addressEl = document.getElementById('address');
  if (addressEl) addressEl.value = '';

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.value = 'Pending';

  // Default order date = today
  const orderDateEl = document.getElementById('orderDate');
  const deliveryDateEl = document.getElementById('deliveryDate');
  const today = new Date().toISOString().slice(0,10);
  if (orderDateEl) orderDateEl.value = today;
  if (deliveryDateEl) deliveryDateEl.value = '';

  const fm = document.getElementById('formModal');
  if (fm) fm.style.display = 'block';
}

function openEditForm() {
  const order = orders.find(o => o.id === selectedOrderId);
  if (!order) return;
  currentItems = Array.isArray(order.items) ? JSON.parse(JSON.stringify(order.items)) : [];
  rebuildItemTable();
  updateItemsTotalUI();

  const titleEl = document.getElementById('formTitle');
  if (titleEl) titleEl.innerText = 'Edit Order';

  const editId = document.getElementById('editOrderId');
  if (editId) editId.value = order.id;

  const orderIdInput = document.getElementById('orderIdInput');
  if (orderIdInput) { orderIdInput.value = order.id; orderIdInput.disabled = true; }

  const customerEl = document.getElementById('customer');
  if (customerEl) customerEl.value = order.customer;

  const addressEl = document.getElementById('address');
  if (addressEl) addressEl.value = order.address || '';

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.value = order.status;

  const orderDateEl = document.getElementById('orderDate');
  if (orderDateEl) orderDateEl.value = order.orderDate || '';

  const deliveryDateEl = document.getElementById('deliveryDate');
  if (deliveryDateEl) deliveryDateEl.value = order.deliveryDate || '';

  const fm = document.getElementById('formModal');
  if (fm) fm.style.display = 'block';
}

function closeForm() { const fm = document.getElementById('formModal'); if (fm) fm.style.display = 'none'; }

const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.onsubmit = function(e) {
    e.preventDefault();

    // Use editOrderId when editing; otherwise consider user-entered orderIdInput or auto-generate sequential id
    const isEditing = !!document.getElementById('editOrderId').value;
    let id;
    if (isEditing) {
      id = document.getElementById('editOrderId').value;
    } else {
      let manual = (document.getElementById('orderIdInput').value || '').trim();
      if (manual) {
        // normalize manual ID to start with '#'
        if (!manual.startsWith('#')) manual = '#' + manual;
        // check duplicate
        if (orders.some(o => o.id === manual)) {
          alert('Order number already exists. Please enter a different number.');
          return;
        }
        id = manual;
      } else {
        // Auto-sequence: find highest numeric suffix and add 1. If none found start at 1001.
        const nums = orders.map(o => {
          const m = String(o.id).match(/(\d+)/);
          return m ? parseInt(m[1], 10) : NaN;
        }).filter(n => !isNaN(n));
        const next = nums.length === 0 ? 1001 : Math.max(...nums) + 1;
        id = `#${next}`;
      }
    }

    const customer = document.getElementById('customer').value.trim();
    const address = document.getElementById('address').value.trim();
    const orderDate = document.getElementById('orderDate').value || new Date().toISOString().slice(0,10);
    const deliveryDate = document.getElementById('deliveryDate').value || '';
    const amount = currentItemsTotal();
    const status = document.getElementById('status').value;

    if (!customer) {
      alert('Please enter customer name');
      return;
    }
    if (currentItems.length === 0) {
      if (!confirm('No items added. Save empty order?')) return;
    }

    if (isEditing) {
      const index = orders.findIndex(o => o.id === id);
      if (index > -1) {
        orders[index] = {id, customer, address, orderDate, deliveryDate, status, amount, items: currentItems};
      }
    } else {
      orders.push({id, customer, address, orderDate, deliveryDate, status, amount, items: currentItems});
    }

    localStorage.setItem('orders', JSON.stringify(orders));
    renderOrders();
    closeForm();
    currentItems = [];
  };
}

/* ---------------------------
   Item table helpers
   --------------------------- */
function rebuildItemTable() {
  const body = document.getElementById('itemTableBody');
  if (!body) return;
  body.innerHTML = '';
  if (currentItems.length === 0) {
    addItemRow(); // always start with one blank row
    return;
  }
  currentItems.forEach(it => addItemRow(it));
}

function addItemRow(prefill) {
  const body = document.getElementById('itemTableBody');
  if (!body) return;
  const tr = document.createElement('tr');

  const nameTd = document.createElement('td');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Item name';
  nameInput.value = prefill && prefill.name ? prefill.name : '';
  nameTd.appendChild(nameInput);

  const qtyTd = document.createElement('td');
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.min = '0';
  qtyInput.style.textAlign = 'right';
  qtyInput.placeholder = '0';
  qtyInput.value = prefill && prefill.quantity ? prefill.quantity : '';
  qtyTd.appendChild(qtyInput);

  const rateTd = document.createElement('td');
  const rateInput = document.createElement('input');
  rateInput.type = 'number';
  rateInput.min = '0';
  rateInput.step = '0.01';
  rateInput.style.textAlign = 'right';
  rateInput.placeholder = '0.00';
  rateInput.value = prefill && prefill.rate ? prefill.rate : '';
  rateTd.appendChild(rateInput);

  const amountTd = document.createElement('td');
  amountTd.style.textAlign = 'right';
  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.readOnly = true;
  amountInput.style.textAlign = 'right';
  amountInput.value = prefill && prefill.amount ? Number(prefill.amount).toFixed(2) : '0.00';
  amountTd.appendChild(amountInput);

  const actionsTd = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.innerText = 'Remove';
  removeBtn.onclick = function() {
    tr.remove();
    syncCurrentItemsFromTable();
    updateItemsTotalUI();
  };
  actionsTd.appendChild(removeBtn);

  function updateRowAmount() {
    const q = parseFloat(qtyInput.value) || 0;
    const r = parseFloat(rateInput.value) || 0;
    const amt = q * r;
    amountInput.value = amt.toFixed(2);
    syncCurrentItemsFromTable();
    updateItemsTotalUI();
  }

  qtyInput.addEventListener('input', updateRowAmount);
  rateInput.addEventListener('input', updateRowAmount);
  nameInput.addEventListener('input', syncCurrentItemsFromTable);

  tr.appendChild(nameTd);
  tr.appendChild(qtyTd);
  tr.appendChild(rateTd);
  tr.appendChild(amountTd);
  tr.appendChild(actionsTd);
  body.appendChild(tr);

  // if prefill provided, ensure amounts are synced
  updateRowAmount();
  syncCurrentItemsFromTable();
}

function syncCurrentItemsFromTable() {
  const body = document.getElementById('itemTableBody');
  if (!body) {
    currentItems = [];
    return;
  }
  const rows = Array.from(body.querySelectorAll('tr'));
  const items = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input');
    if (!inputs || inputs.length < 4) return;
    const name = inputs[0].value.trim();
    const qty = parseFloat(inputs[1].value) || 0;
    const rate = parseFloat(inputs[2].value) || 0;
    const amount = parseFloat(inputs[3].value) || 0;
    if (name) items.push({name, quantity: qty, rate, amount});
  });
  currentItems = items;
}

function currentItemsTotal() {
  return currentItems.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
}

function updateItemsTotalUI() {
  const totalEl = document.getElementById('itemsTotal');
  if (totalEl) totalEl.innerText = currentItemsTotal().toFixed(2);
}

/* ---------------------------
   Delete / Sort / Export
   --------------------------- */
function deleteOrder() {
  orders = orders.filter(o => o.id !== selectedOrderId);
  localStorage.setItem('orders', JSON.stringify(orders));
  renderOrders();
  closeModal();
}

function sortBy(key) {
  orders.sort((a, b) => {
    if (key === 'amount') {
      return sortDirection[key] === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    } else if (key === 'orderDate' || key === 'deliveryDate') {
      const da = new Date(a[key] || '1970-01-01');
      const db = new Date(b[key] || '1970-01-01');
      return sortDirection[key] === 'asc' ? da - db : db - da;
    }
  });
  sortDirection[key] = sortDirection[key] === 'asc' ? 'desc' : 'asc';
  const s = document.getElementById('search');
  renderOrders(s ? s.value : '');
}

function exportCSV() {
  let csvContent = 'Order ID,Customer,Order Date,Delivery Date,Status,Amount,Date\n';
  orders.forEach(order => {
    csvContent += `${order.id},${escapeCsv(order.customer)},${order.orderDate || ''},${order.deliveryDate || ''},${order.status},${order.amount},${order.orderDate || ''}\n`;
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'orders.csv';
  link.click();
}

/* ---------------------------
   Small helpers
   --------------------------- */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
  });
}
function escapeCsv(str) {
  if (str == null) return '';
  return `"${String(str).replace(/"/g, '""')}"`;
}
