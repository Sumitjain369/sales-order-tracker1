let orders = JSON.parse(localStorage.getItem('orders')) || [
  {id: '#1001', customer: 'John Smith', status: 'Pending', amount: 250, date: '2024-04-25'},
  {id: '#1002', customer: 'Acme Corporation', status: 'Shipped', amount: 1200, date: '2024-04-22'},
  {id: '#1003', customer: 'Sarah Johnson', status: 'Delivered', amount: 350, date: '2024-04-20'}
];

let selectedOrderId = null;
let sortDirection = {amount: 'asc', date: 'asc'};
let password = localStorage.getItem('appPassword') || 'admin123';

function login() {
  const input = document.getElementById('passwordInput').value;
  if (input === password) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    renderOrders();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function openChangePassword() {
  document.getElementById('passwordModal').style.display = 'block';
}

function closePasswordModal() {
  document.getElementById('passwordModal').style.display = 'none';
}

function changePassword() {
  const newPass = document.getElementById('newPassword').value;
  if (newPass) {
    password = newPass;
    localStorage.setItem('appPassword', newPass);
    alert('Password changed successfully!');
    closePasswordModal();
  }
}

function renderOrders(filter = '') {
  const tbody = document.getElementById('orderBody');
  tbody.innerHTML = '';
  orders.filter(order => order.customer.toLowerCase().includes(filter.toLowerCase()) || order.id.includes(filter)).forEach(order => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${order.id}</td><td>${order.customer}</td><td><span class="status ${order.status}">${order.status}</span></td><td>$${order.amount}</td><td>${order.date}</td>`;
    row.onclick = () => showDetails(order.id);
    tbody.appendChild(row);
  });
}

document.getElementById('search').addEventListener('input', function() {
  renderOrders(this.value);
});

function showDetails(orderId) {
  selectedOrderId = orderId;
  const order = orders.find(o => o.id === orderId);
  document.getElementById('orderDetails').innerHTML = `Customer: ${order.customer}<br>Amount: $${order.amount}<br>Status: ${order.status}<br>Date: ${order.date}`;
  document.getElementById('orderModal').style.display = 'block';
}

function closeModal() { document.getElementById('orderModal').style.display = 'none'; }
function openAddForm() {
  document.getElementById('formTitle').innerText = 'Add New Order';
  document.getElementById('editOrderId').value = '';
  document.getElementById('customer').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('status').value = 'Pending';
  document.getElementById('date').value = '';
  document.getElementById('formModal').style.display = 'block';
}
function openEditForm() {
  const order = orders.find(o => o.id === selectedOrderId);
  document.getElementById('formTitle').innerText = 'Edit Order';
  document.getElementById('editOrderId').value = order.id;
  document.getElementById('customer').value = order.customer;
  document.getElementById('amount').value = order.amount;
  document.getElementById('status').value = order.status;
  document.getElementById('date').value = order.date;
  document.getElementById('formModal').style.display = 'block';
}
function closeForm() { document.getElementById('formModal').style.display = 'none'; }

document.getElementById('orderForm').onsubmit = function(e) {
  e.preventDefault();
  const id = document.getElementById('editOrderId').value || `#${Math.floor(Math.random()*10000)}`;
  const customer = document.getElementById('customer').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const status = document.getElementById('status').value;
  const date = document.getElementById('date').value;

  if (document.getElementById('editOrderId').value) {
    const index = orders.findIndex(o => o.id === id);
    orders[index] = {id, customer, status, amount, date};
  } else {
    orders.push({id, customer, status, amount, date});
  }

  localStorage.setItem('orders', JSON.stringify(orders));
  renderOrders();
  closeForm();
};

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
  renderOrders(document.getElementById('search').value);
}

function exportCSV() {
  let csvContent = 'Order ID,Customer,Status,Amount,Date
';
  orders.forEach(order => {
    csvContent += `${order.id},${order.customer},${order.status},${order.amount},${order.date}
`;
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'orders.csv';
  link.click();
}
