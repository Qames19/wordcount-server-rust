const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;
let barChartInstance = null;
let pieChartInstance = null;

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
    if (words.length === 0) {
        table.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-gray-500 dark:text-gray-400">No words to display</td></tr>';
    }
    else {
        words.forEach(({ word, count }) => {
            const row = `<tr><td class="p-2 border-b border-gray-400 dark:border-gray-600">${word}</td><td class="p-2 border-b border-gray-400 dark:border-gray-600">${count}</td></tr>`;
            table.innerHTML += row;
        });
    }

    renderCharts(words);
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

function renderCharts(words) {
    const labels = words.map(w => w.word);
    const data = words.map(w => w.count);

    // Destroy previous charts if they exist
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();

    const barCtx = document.getElementById('bar-chart').getContext('2d');
    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Word Frequency',
                data,
                backgroundColor: 'rgba(59, 91, 219, 0.6)',
                borderColor: 'rgba(59, 91, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Top Words - Bar Chart' }
            }
        }
    });

    const pieCtx = document.getElementById('pie-chart').getContext('2d');
    pieChartInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: labels.map((_, i) =>
                    `hsl(${(i * 137.5) % 360}, 70%, 65%)`
                )
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Top Words - Pie Chart' }
            }
        }
    });
}

document.getElementById('load-words').addEventListener('click', loadTopWords);
document.getElementById('upload-form').addEventListener('submit', uploadBook);

fetchBooks();

window.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('popup-overlay');
    const popupContent = document.getElementById('popup-content');
    const closePopupBtn = document.getElementById('close-popup');

    closePopupBtn.addEventListener('click', () => {
        popup.classList.add('hidden');
        popupContent.innerHTML = '';
    });

    document.querySelector('[data-popup="table"]').addEventListener('click', () => {
        const tableClone = document.getElementById('word-table').parentElement.cloneNode(true);
        popupContent.innerHTML = '';
        popupContent.appendChild(tableClone);
        popup.classList.remove('hidden');
    });

    document.querySelector('[data-popup="bar"]').addEventListener('click', () => {
        const barClone = document.getElementById('bar-chart').cloneNode(true);
        popupContent.innerHTML = '<h3 class="text-xl mb-4">Bar Chart</h3>';
        popupContent.appendChild(barClone);
        new Chart(barClone.getContext('2d'), barChartInstance.config);
        popup.classList.remove('hidden');
    });

    document.querySelector('[data-popup="pie"]').addEventListener('click', () => {
        const pieClone = document.getElementById('pie-chart').cloneNode(true);
        popupContent.innerHTML = '<h3 class="text-xl mb-4">Pie Chart</h3>';
        popupContent.appendChild(pieClone);
        new Chart(pieClone.getContext('2d'), pieChartInstance.config);
        popup.classList.remove('hidden');
    });
});