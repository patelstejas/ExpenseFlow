# ExpenseFlow — Personal Expense Tracker

## Tech Stack
- Backend: Node.js 22, Express.js
- Frontend: Plain HTML, CSS, vanilla JavaScript (no frameworks)
- Data: JSON file at ./data/expenses.json
- Port: 3000

## Commands
- Start server: node server.js
- Install dependencies: npm install express

## Architecture
- server.js: Express server and API routes
- public/: Static files (index.html, style.css, app.js)
- data/: JSON data storage

## Conventions
- Use ES modules (import/export), not require()
- API routes return JSON: { data, error } shape
- Never expose stack traces to the client
- CSS: mobile-first, no frameworks, "Dark Mode" aesthetic

## Data Model
{
  "id": "uuid string",
  "description": "string",
  "amount": 0.00,
  "category": "Food | Rent | Fun | Transport | Other",
  "date": "ISO timestamp"
}