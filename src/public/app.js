const urlInput = document.getElementById('urlInput');
const btnShorten = document.getElementById('btnShorten');
const result = document.getElementById('result');
const shortUrl = document.getElementById('shortUrl');
const btnCopy = document.getElementById('btnCopy');
const error = document.getElementById('error');
const linksBody = document.getElementById('linksBody');
const empty = document.getElementById('empty');

function showError(msg) {
  error.textContent = msg;
  error.classList.remove('hidden');
}

function clearError() {
  error.classList.add('hidden');
}

async function shorten() {
  clearError();
  const originalUrl = urlInput.value.trim();
  if (!originalUrl) return showError('Nhập URL trước đã!');

  const res = await fetch('/web/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalUrl }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return showError(data.message || 'Lỗi ' + res.status);
  }

  const link = await res.json();
  shortUrl.href = link.shortUrl;
  shortUrl.textContent = link.shortUrl;
  result.classList.remove('hidden');
  urlInput.value = '';
  await loadLinks();
}

async function loadLinks() {
  const res = await fetch('/web/links');
  if (!res.ok) return;
  const links = await res.json();

  linksBody.innerHTML = '';
  empty.classList.toggle('hidden', links.length > 0);

  for (const link of links) {
    const tr = document.createElement('tr');

    const code = document.createElement('td');
    const a = document.createElement('a');
    a.href = '/' + link.code;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = link.code;
    code.appendChild(a);

    const original = document.createElement('td');
    const origA = document.createElement('a');
    origA.href = link.originalUrl;
    origA.target = '_blank';
    origA.rel = 'noopener';
    origA.textContent = link.originalUrl;
    original.appendChild(origA);

    const clicks = document.createElement('td');
    clicks.className = 'clicks';
    clicks.textContent = link.clicks;

    const created = document.createElement('td');
    created.textContent = new Date(link.createdAt).toLocaleString('vi-VN');

    const action = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = 'Xoá';
    del.addEventListener('click', () => removeLink(link.code));
    action.appendChild(del);

    tr.append(code, original, clicks, created, action);
    linksBody.appendChild(tr);
  }
}

async function removeLink(code) {
  const res = await fetch('/web/links/' + code, { method: 'DELETE' });
  if (res.ok) await loadLinks();
}

btnShorten.addEventListener('click', shorten);
btnCopy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(shortUrl.href);
  btnCopy.textContent = 'Đã copy!';
  setTimeout(() => (btnCopy.textContent = 'Copy'), 1500);
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') shorten();
});

loadLinks();
setInterval(loadLinks, 5000);