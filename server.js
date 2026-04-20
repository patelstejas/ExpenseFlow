import express from 'express';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data', 'expenses.json');

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const VALID_CATEGORIES = ['Food', 'Rent', 'Fun', 'Transport', 'Other'];

async function readExpenses() {
  const raw = await readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function writeExpenses(expenses) {
  await writeFile(DATA_FILE, JSON.stringify(expenses, null, 2));
}

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await readExpenses();
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ data: expenses });
  } catch {
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: Math.round(Number(amount) * 100) / 100,
      category,
      date: new Date(date).toISOString(),
    };

    const expenses = await readExpenses();
    expenses.push(expense);
    await writeExpenses(expenses);

    res.status(201).json({ data: expense });
  } catch {
    res.status(500).json({ error: 'Failed to save expense' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, date } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const expenses = await readExpenses();
    const index = expenses.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    expenses[index] = {
      ...expenses[index],
      description: description.trim(),
      amount: Math.round(Number(amount) * 100) / 100,
      category,
      date: new Date(date).toISOString(),
    };
    await writeExpenses(expenses);

    res.json({ data: expenses[index] });
  } catch {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expenses = await readExpenses();
    const index = expenses.findIndex(e => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    expenses.splice(index, 1);
    await writeExpenses(expenses);

    res.json({ data: null });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
  console.log('ExpenseFlow running at http://localhost:3000');
});
