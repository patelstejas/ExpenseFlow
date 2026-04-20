const CATEGORIES = ['Food', 'Rent', 'Fun', 'Transport', 'Other'];

let expenses = [];
let activeFilter = 'All';
let editingId = null;

function fmt(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toDateInputValue(iso) {
  return iso.slice(0, 10);
}

function renderCard(e) {
  return `
    <div class="expense-card">
      <div>
        <div class="expense-meta">
          <span class="expense-desc">${escapeHtml(e.description)}</span>
          <span class="category-badge cat-${e.category}">${e.category}</span>
        </div>
        <span class="expense-date">${fmtDate(e.date)}</span>
      </div>
      <div class="expense-right">
        <span class="expense-amount">${fmt(e.amount)}</span>
        <div class="card-actions">
          <button class="edit-btn" data-id="${e.id}" aria-label="Edit expense">&#9998;</button>
          <button class="delete-btn" data-id="${e.id}" aria-label="Delete expense">&#x2715;</button>
        </div>
      </div>
    </div>
  `;
}

function renderEditCard(e) {
  const opts = CATEGORIES.map(c =>
    `<option value="${c}"${c === e.category ? ' selected' : ''}>${c}</option>`
  ).join('');

  return `
    <div class="expense-card expense-card--editing">
      <div class="edit-grid">
        <input class="edit-input edit-desc" data-field="description" value="${escapeHtml(e.description)}" placeholder="Description">
        <input class="edit-input" data-field="amount" type="number" min="0.01" step="0.01" value="${e.amount}">
        <select class="edit-input" data-field="category">${opts}</select>
        <input class="edit-input" data-field="date" type="date" value="${toDateInputValue(e.date)}">
      </div>
      <div class="edit-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="save-btn" data-id="${e.id}">Save</button>
      </div>
    </div>
  `;
}

async function loadExpenses() {
  const res = await fetch('/api/expenses');
  const { data, error } = await res.json();
  if (error) { console.error('Failed to load expenses:', error); return; }
  expenses = data;
  render();
}

function render() {
  renderTotals();
  renderList();
}

function renderTotals() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById('grand-total').textContent = fmt(total);

  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  const container = document.getElementById('category-totals');
  container.innerHTML = '';
  for (const cat of CATEGORIES) {
    if (!byCategory[cat]) continue;
    const pill = document.createElement('span');
    pill.className = `cat-pill cat-${cat}`;
    pill.textContent = `${cat}  ${fmt(byCategory[cat])}`;
    container.appendChild(pill);
  }
}

function renderList() {
  const filtered = activeFilter === 'All'
    ? expenses
    : expenses.filter(e => e.category === activeFilter);

  const container = document.getElementById('expense-list');

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No expenses yet. Add one above.</p>';
    return;
  }

  container.innerHTML = filtered.map(e =>
    e.id === editingId ? renderEditCard(e) : renderCard(e)
  ).join('');

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => { editingId = btn.dataset.id; renderList(); });
  });
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteExpense(btn.dataset.id));
  });
  container.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', () => saveEdit(btn.dataset.id));
  });
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => { editingId = null; renderList(); });
  });
}

async function saveEdit(id) {
  const card = document.querySelector('.expense-card--editing');
  const get = field => card.querySelector(`[data-field="${field}"]`).value;

  const res = await fetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: get('description'),
      amount:      Number(get('amount')),
      category:    get('category'),
      date:        get('date'),
    }),
  });

  const { data, error } = await res.json();
  if (error) { alert(error); return; }

  const index = expenses.findIndex(e => e.id === id);
  expenses[index] = data;
  editingId = null;
  render();
}

async function deleteExpense(id) {
  const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
  const { error } = await res.json();
  if (error) { alert(error); return; }
  expenses = expenses.filter(e => e.id !== id);
  render();
}

document.getElementById('expense-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.hidden = true;

  const body = {
    description: document.getElementById('description').value,
    amount:      Number(document.getElementById('amount').value),
    category:    document.getElementById('category').value,
    date:        document.getElementById('date').value,
  };

  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const { data, error } = await res.json();
  if (error) {
    errEl.textContent = error;
    errEl.hidden = false;
    return;
  }

  expenses.unshift(data);
  render();
  ev.target.reset();
  document.getElementById('date').valueAsDate = new Date();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.category;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderList();
  });
});

document.getElementById('date').valueAsDate = new Date();
loadExpenses();
