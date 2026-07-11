const form = document.querySelector('#plan-form');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const button = document.querySelector('#generate-button');
const cards = document.querySelector('#plan-cards');
const contactList = document.querySelector('#contact-list');
const contactKey = 'monsoon-ready-contacts';
const sections = [
  ['plan', 'Your personalised plan', '✓'], ['emergencyChecklist', 'Emergency checklist', '!'],
  ['safetyTips', 'Safety tips', '◈'], ['travelAdvice', 'Travel during heavy rain', '↗'],
  ['groceryMedicine', 'Grocery & medicine', '□'], ['powerOutage', 'Power outage', '⚡'],
  ['floodPreparedness', 'Flood preparedness', '≈']
];
function safeItems(items) { return Array.isArray(items) ? items.filter(item => typeof item === 'string').slice(0, 8) : []; }
function escapeHtml(value) { const el = document.createElement('div'); el.textContent = value; return el.innerHTML; }
function renderPlan(data) {
  cards.innerHTML = '';
  sections.forEach(([key, title, icon]) => {
    const items = safeItems(data[key]); if (!items.length) return;
    const article = document.createElement('article'); article.className = 'card';
    article.innerHTML = `<div class="card-heading"><span class="icon">${icon}</span><h3>${title}</h3></div><ul>${items.map(item => `<li><span></span>${escapeHtml(item)}</li>`).join('')}</ul>`;
    cards.append(article);
  });
}
function loadContacts() { try { return JSON.parse(localStorage.getItem(contactKey)) || [{ name: 'Local emergency service', number: '' }, { name: 'Family contact', number: '' }]; } catch { return []; } }
function saveContacts() { const contacts = [...contactList.querySelectorAll('.contact-row')].map(row => ({ name: row.querySelector('[name=name]').value, number: row.querySelector('[name=number]').value })); localStorage.setItem(contactKey, JSON.stringify(contacts)); }
function renderContacts() { contactList.innerHTML = ''; loadContacts().forEach(addContactRow); }
function addContactRow(contact = { name: '', number: '' }) {
  const row = document.createElement('div'); row.className = 'contact-row';
  row.innerHTML = `<input name="name" aria-label="Contact name" placeholder="Contact name" value="${escapeHtml(contact.name)}"><input name="number" aria-label="Contact number" placeholder="Phone number" value="${escapeHtml(contact.number)}"><button type="button" aria-label="Remove contact">×</button>`;
  row.querySelectorAll('input').forEach(input => input.addEventListener('input', saveContacts));
  row.querySelector('button').addEventListener('click', () => { row.remove(); saveContacts(); }); contactList.append(row);
}
document.querySelector('#add-contact').addEventListener('click', () => addContactRow());
renderContacts();
form.addEventListener('submit', async (event) => {
  event.preventDefault(); button.disabled = true; button.textContent = 'Creating your plan…'; status.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const output = await response.json(); if (!response.ok) throw new Error(output.error || 'Unable to generate plan.');
    renderPlan(output); document.querySelector('#plan-location').textContent = `Ready for monsoon in ${data.city}`;
    results.hidden = false; results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; button.innerHTML = 'Create my plan <span aria-hidden="true">→</span>'; }
});
