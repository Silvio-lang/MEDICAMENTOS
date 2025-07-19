const fileInput = document.getElementById('fileInput');
const markdownOutput = document.getElementById('markdownOutput');
fileInput.addEventListener('change', (event) => { const file = event.target.files[0]; const reader = new FileReader();
reader.onload = (e) => { const markdownText = e.target.result; const html = marked.parse(markdownText); markdownOutput.innerHTML = html; };
reader.readAsText(file); });