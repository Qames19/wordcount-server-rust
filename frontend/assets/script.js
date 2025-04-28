const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

themeToggle.addEventListener('click', () => {
    htmlEl.classList.toggle('dark');
    themeToggle.textContent = htmlEl.classList.contains('dark') ? '☀️' : '🌙';
});

async function fetchBooks() {
    const response = await fetch('/api/books');
    const books = await response.json();
    const select = document.getElementById('book-select');

    select.innerHTML = '<option value="">-- Select a book --</option>';
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        select.appendChild(option);
    });
}

async function loadTopWords() {
    const select = document.getElementById('book-select');
    const book = select.value;
    if (!book) return;

    const nInput = document.getElementById('top-n');
    const n = nInput.value || 10;

    const response = await fetch(`/api/top-words?book=${encodeURIComponent(book)}&n=${n}`);
    const words = await response.json();
    const table = document.getElementById('word-table');

    table.innerHTML = '';
    words.forEach(({ word, count }) => {
        const row = `<tr><td class="p-2 border-b border-gray-400 dark:border-gray-600">${word}</td><td class="p-2 border-b border-gray-400 dark:border-gray-600">${count}</td></tr>`;
        table.innerHTML += row;
    });
}

async function uploadBook(event) {
    event.preventDefault();
    const form = document.getElementById('upload-form');
    const formData = new FormData(form);

    await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    form.reset();
    await fetchBooks();
}

document.getElementById('load-words').addEventListener('click', loadTopWords);
document.getElementById('upload-form').addEventListener('submit', uploadBook);

fetchBooks();