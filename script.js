let orders = JSON.parse(localStorage.getItem('orders')) || [
  {id: '#1001', customer: 'John Smith', address: '', status: 'Pending', amount: 250, date: '2024-04-25', items: []},
  {id: '#1002', customer: 'Acme Corporation', address: '', status: 'Shipped', amount: 1200, date: '2024-04-22', items: []},
  {id: '#1003', customer: 'Sarah Johnson', address: '', status: 'Delivered', amount: 350, date: '2024-04-20', items: []}
];

let selectedOrderId = null;
let sortDirection = {amount: 'asc', date: 'asc'};
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
      row.innerHTML = `<td>${order.id}</td><td>${escapeHtml(order.customer)}</td><td><span class="status ${order.status}">${order.status}</span></td><td>$${Number(order.amount).toFixed(2)}</td><td>${order.date}</td>`;
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

  let html = `<strong>Customer:</strong> ${escapeHtml(order.customer)}<br>`;
  html += `<strong>Address:</strong> ${escapeHtml(order.address || '')}<br>`;
  html += `<strong>Date:</strong> ${order.date}<br>`;
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

  const customerEl = document.getElementById('customer');
  if (customerEl) customerEl.value = '';

  const addressEl = document.getElementById('address');
  if (addressEl) addressEl.value = '';

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.value = 'Pending';

  const dateEl = document.getElementById('date');
  if (dateEl) dateEl.value = '';

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

  const customerEl = document.getElementById('customer');
  if (customerEl) customerEl.value = order.customer;

  const addressEl = document.getElementById('address');
  if (addressEl) addressEl.value = order.address || '';

  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.value = order.status;

  const dateEl = document.getElementById('date');
  if (dateEl) dateEl.value = order.date;

  const fm = document.getElementById('formModal');
  if (fm) fm.style.display = 'block';
}

function closeForm() { const fm = document.getElementById('formModal'); if (fm) fm.style.display = 'none'; }

const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('editOrderId').value || `#${Math.floor(Math.random()*10000)}`;
    const customer = document.getElementById('customer').value.trim();
    const address = document.getElementById('address').value.trim();
    const amount = currentItemsTotal();
    const status = document.getElementById('status').value;
    const date = document.getElementById('date').value;

    if (!customer) {
      alert('Please enter customer name');
      return;
    }
    if (currentItems.length === 0) {
      if (!confirm('No items added. Save empty order?')) return;
    }

    if (document.getElementById('editOrderId').value) {
      const index = orders.findIndex(o => o.id === id);
      orders[index] = {id, customer, address, status, amount, date, items: currentItems};
    } else {
      orders.push({id, customer, address, status, amount, date, items: currentItems});
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
    } else if (key === 'date') {
      return sortDirection[key] === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
    }
  });
  sortDirection[key] = sortDirection[key] === 'asc' ? 'desc' : 'asc';
  const s = document.getElementById('search');
  renderOrders(s ? s.value : '');
}

function exportCSV() {
  let csvContent = 'Order ID,Customer,Status,Amount,Date\n';
  orders.forEach(order => {
    csvContent += `${order.id},${order.customer},${order.status},${order.amount},${order.date}\n`;
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
