const CATEGORIES = ['Food', 'Rent', 'Fun', 'Transport', 'Other'];

let expenses = [];
let activeFilter = 'All';

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

  container.innerHTML = filtered.map(e => `
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
        <button class="delete-btn" data-id="${e.id}" aria-label="Delete expense">&#x2715;</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteExpense(btn.dataset.id));
  });
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
