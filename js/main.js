pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const fileInput = document.getElementById('fileInput');
const tableBody = document.getElementById('tableBody');
const status = document.getElementById('status');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const debugArea = document.getElementById('debugArea');
const copyBtn = document.getElementById('copyBtn');
const debugBtn = document.getElementById('debugBtn');
const forceOcrBtn = document.getElementById('forceOcrBtn');
const clearBtn = document.getElementById('clearBtn');
const selectBtn = document.getElementById('selectBtn');
const editBtn = document.getElementById('editBtn');
const dropZone = document.getElementById('dropZone');
const fileCount = document.getElementById('fileCount');
const editModal = document.getElementById('editModal');
const previewContent = document.getElementById('previewContent');

let lastExtractedText = "";
let consolidatedData = [];
let currentEditingIndex = -1;
let pageImages = [];
let sourceFiles = []; 
const MAX_FILES = 14;

fileInput.addEventListener('change', handleFiles);
copyBtn.addEventListener('click', copyToClipboard);
debugBtn.addEventListener('click', toggleDebug);
forceOcrBtn.addEventListener('click', forceOCRProcessing);
clearBtn.addEventListener('click', clearAll);
editBtn.addEventListener('click', openEditModal);

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-color)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
});

function handleFiles(e) { processFiles(e.target.files); }

function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}

async function processFiles(files) {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) return showStatus('Nenhum arquivo PDF selecionado.', 'error');
    if (pdfFiles.length > MAX_FILES) return showStatus(`Máximo de ${MAX_FILES} arquivos permitido.`, 'error');

    selectBtn.disabled = true; copyBtn.disabled = true; debugBtn.disabled = true;
    forceOcrBtn.disabled = true; clearBtn.disabled = true; editBtn.disabled = true;
    progressContainer.style.display = 'block';

    showStatus(`Inicializando motor de leitura...`, 'info');
    
    const worker = await Tesseract.createWorker('eng');

    for (let idx = 0; idx < pdfFiles.length; idx++) {
        const file = pdfFiles[idx];
        
        try {
            showStatus(`Lendo ${file.name} (${idx + 1}/${pdfFiles.length})...`, 'info');
            
            const res = await extractAndProcessPDF(file, worker);
            
            if (res) {
                consolidatedData.push(res.data);
                pageImages.push(res.image); 
                sourceFiles.push(res.file);
                lastExtractedText = res.text;
                
                renderTable();
            }
            
            const progress = Math.round(((idx + 1) / pdfFiles.length) * 100);
            progressFill.style.width = progress + '%';
            progressFill.textContent = progress + '%';
            
        } catch (error) {
            console.error("Erro no arquivo " + file.name, error);
            showStatus(`Erro ao processar ${file.name}`, 'error');
        }
    }

    await worker.terminate();
    
    progressContainer.style.display = 'none';
    fileCount.textContent = `${consolidatedData.length} arquivo(s)`;
    showStatus(`Processamento concluído com sucesso!`, 'success');
    
    selectBtn.disabled = false;
    if (consolidatedData.length > 0) {
        copyBtn.disabled = false; debugBtn.disabled = false;
        forceOcrBtn.disabled = false; clearBtn.disabled = false; editBtn.disabled = false;
    }
}

async function extractAndProcessPDF(file, worker) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const textContent = await page.getTextContent();
    let text = "";
    let lastY = -1;
    textContent.items.forEach(item => {
        if (lastY !== item.transform[5] && lastY !== -1) text += '\n';
        text += item.str + ' ';
        lastY = item.transform[5];
    });
    
    let imageData = null;
    
    if (text.trim().length < 50) {
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        imageData = canvas.toDataURL('image/png');
        
        const ocrResult = await worker.recognize(imageData);
        text = ocrResult.data.text;
    }
    
    const data = parseCASATextAdvanced(text, file.name);
    return { data, image: imageData, file, text }; 
}

// --- FUNÇÃO INTELIGENTE DE NÚMEROS APLICADA A TUDO AGORA ---
function cleanDecimalValue(value) {
    let val = value.replace(/[^0-9.,]/g, '');
    if (!val.includes('.') && !val.includes(',')) {
        if (val.length >= 3) {
            val = val.slice(0, val.length - 2) + ',' + val.slice(val.length - 2);
        } else if (val.length > 0) {
            val = val + ',00';
        }
    }
    return val.replace(/\./g, ',');
}

function parseCASATextAdvanced(text, fileName) {
    const data = {
        id: "N/A", donor: "N/A", file: fileName,
        tm: "", pm: "", fm: "", sm: "", lm: "", cm: "", im: "",
        vcl: "", vsl: "", vap: "", dcl: "", dsl: "", dap: "", alh: "", bcf: "", hac: "", lin: "", str: ""
    };

    let cleanedText = text.replace(/[■●◆◇★☆♦♣♠♥]/g, ' ').replace(/[@©®™]/g, ' ');
    cleanedText = cleanedText.replace(/(\d)\s*([.,])\s*(\d)/g, '$1$2$3');
    cleanedText = cleanedText.replace(/(\d)\s*([.,])\s*(\d)/g, '$1$2$3');

    const idMatch = cleanedText.match(/ID:\s*([\w.-]+)/i);
    if (idMatch) data.id = idMatch[1].trim();

    const donorMatch = cleanedText.match(/Donor:\s*([\w.-]+)/i);
    if (donorMatch) data.donor = donorMatch[1].trim();

    const lines = cleanedText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (!line.includes("[=") && !line.includes("[o]") && !line.includes("[0]") && !line.includes("[a]")) {
            // Regra Blindada: Pega o último número, mesmo que tenha lixo ou caracteres invisíveis depois
            const lastNumberMatch = line.match(/([\d.,]+)[^\d]*$/);
            if (lastNumberMatch) {
                const val = cleanDecimalValue(lastNumberMatch[1]);
                
                if (/Total\s*moti/i.test(line)) data.tm = val;
                else if (/Progressive\s*moti/i.test(line)) data.pm = val;
                else if (/Fast\s*moti/i.test(line)) data.fm = val;
                else if (/Slow\s*moti/i.test(line)) data.sm = val;
                else if (/Circle\s*moti/i.test(line)) data.cm = val;
                else if (/Local\s*moti/i.test(line)) data.lm = val;
                else if (/Immotile/i.test(line)) data.im = val;
            }
        }

        if (line.includes("Total motility") && (line.includes("[=") || line.includes("="))) {
            const numbers = line.match(/[\d.,]+/g);
            if (numbers && numbers.length >= 11) {
                const params = numbers.slice(-11);
                // Aplicando a função inteligente (cleanDecimalValue) na tabela cinemática também!
                data.vcl = cleanDecimalValue(params[0]);
                data.vsl = cleanDecimalValue(params[1]);
                data.vap = cleanDecimalValue(params[2]);
                data.dcl = cleanDecimalValue(params[3]);
                data.dsl = cleanDecimalValue(params[4]);
                data.dap = cleanDecimalValue(params[5]);
                data.alh = cleanDecimalValue(params[6]);
                data.bcf = cleanDecimalValue(params[7]);
                data.hac = cleanDecimalValue(params[8]);
                data.lin = cleanDecimalValue(params[9]);
                data.str = cleanDecimalValue(params[10]);
            }
        }
    }
    return data;
}

function renderTable() {
    tableBody.innerHTML = "";
    consolidatedData.forEach((data, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(data.id)}</td><td>${escapeHtml(data.donor)}</td><td>${escapeHtml(data.file)}</td>
            <td>${data.tm}</td><td>${data.pm}</td><td>${data.fm}</td><td>${data.sm}</td>
            <td>${data.lm}</td><td>${data.cm}</td><td>${data.im}</td><td>${data.vcl}</td>
            <td>${data.vsl}</td><td>${data.vap}</td><td>${data.dcl}</td><td>${data.dsl}</td>
            <td>${data.dap}</td><td>${data.alh}</td><td>${data.bcf}</td><td>${data.hac}</td>
            <td>${data.lin}</td><td>${data.str}</td>
        `;
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => {
            currentEditingIndex = idx;
            showPreview(idx);
            openEditModal();
        });
        tableBody.appendChild(tr);
    });
}

async function showPreview(idx) {
    const data = consolidatedData[idx];
    let html = `
        <div class="preview-item"><div class="preview-label">ID</div><div class="preview-value">${escapeHtml(data.id)}</div></div>
        <div class="preview-item"><div class="preview-label">DONOR</div><div class="preview-value">${escapeHtml(data.donor)}</div></div>
    `;
    const motilityFields = ['tm', 'pm', 'fm', 'sm', 'lm', 'cm', 'im'];
    for (let field of motilityFields) {
        html += `<div class="preview-item"><div class="preview-label">${field.toUpperCase()}</div><div class="preview-value">${data[field] || 'N/A'}</div></div>`;
    }
    
    previewContent.innerHTML = html + `<div id="imgLoader" style="margin-top:15px; color:#0056b3; font-size:11px; font-weight:bold;">Gerando pré-visualização...</div>`;

    if (pageImages[idx]) {
        document.getElementById('imgLoader').outerHTML = `<img src="${pageImages[idx]}" class="preview-image" alt="Preview">`;
    } else {
        try {
            const file = sourceFiles[idx];
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width; canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const imgUrl = canvas.toDataURL('image/png');
            pageImages[idx] = imgUrl; 
            document.getElementById('imgLoader').outerHTML = `<img src="${imgUrl}" class="preview-image" alt="Preview">`;
        } catch (e) {
            document.getElementById('imgLoader').innerHTML = "Erro ao gerar imagem.";
        }
    }
}

function openEditModal() {
    if (currentEditingIndex === -1 && consolidatedData.length > 0) currentEditingIndex = 0;
    if (currentEditingIndex === -1) return alert("Nenhum dado para editar.");
    
    const data = consolidatedData[currentEditingIndex];
    const formContainer = document.getElementById('editFormContainer');
    let formHTML = '<form><div class="form-grid">';
    const fields = ['id', 'donor', 'file', 'tm', 'pm', 'fm', 'sm', 'lm', 'cm', 'im', 'vcl', 'vsl', 'vap', 'dcl', 'dsl', 'dap', 'alh', 'bcf', 'hac', 'lin', 'str'];
    
    for (let key of fields) {
        formHTML += `<div class="form-group"><label for="${key}">${key.toUpperCase()}:</label><input type="text" id="${key}" value="${escapeHtml(data[key])}" /></div>`;
    }
    formHTML += '</div></form>';
    formContainer.innerHTML = formHTML;
    editModal.style.display = 'block';
}

function closeEditModal() { editModal.style.display = 'none'; currentEditingIndex = -1; }

function saveEditedData() {
    if (currentEditingIndex === -1) return;
    const data = consolidatedData[currentEditingIndex];
    const fields = ['id', 'donor', 'file', 'tm', 'pm', 'fm', 'sm', 'lm', 'cm', 'im', 'vcl', 'vsl', 'vap', 'dcl', 'dsl', 'dap', 'alh', 'bcf', 'hac', 'lin', 'str'];
    for (let key of fields) {
        const input = document.getElementById(key);
        if (input) data[key] = input.value;
    }
    renderTable();
    closeEditModal();
    showStatus("Dados atualizados!", 'success');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard() {
    if (consolidatedData.length === 0) return alert("Não há dados para copiar.");
    let content = "ID\tDonor\tArquivo\tTM\tPM\tFM\tSM\tLM\tCM\tIM\tVCL\tVSL\tVAP\tDCL\tDSL\tDAP\tALH\tBCF\tHAC\tLIN\tSTR\n";
    consolidatedData.forEach(d => {
        content += `${d.id}\t${d.donor}\t${d.file}\t${d.tm}\t${d.pm}\t${d.fm}\t${d.sm}\t${d.lm}\t${d.cm}\t${d.im}\t${d.vcl}\t${d.vsl}\t${d.vap}\t${d.dcl}\t${d.dsl}\t${d.dap}\t${d.alh}\t${d.bcf}\t${d.hac}\t${d.lin}\t${d.str}\n`;
    });
    navigator.clipboard.writeText(content).then(() => alert("Copiado para Excel!")).catch(err => console.error('Erro:', err));
}

function toggleDebug() {
    if (debugArea.style.display === 'none' || debugArea.style.display === '') {
        debugArea.textContent = lastExtractedText || "Nenhum PDF processado.";
        debugArea.style.display = 'block';
        debugBtn.textContent = "Ocultar OCR";
    } else {
        debugArea.style.display = 'none';
        debugBtn.textContent = "Mostrar OCR";
    }
}

function forceOCRProcessing() {
    if (consolidatedData.length === 0) return;
    showStatus("Reprocessando dados do texto já extraído...", 'warning');
    const currentData = consolidatedData[currentEditingIndex === -1 ? 0 : currentEditingIndex];
    if(lastExtractedText) {
       const newData = parseCASATextAdvanced(lastExtractedText, currentData.file);
       consolidatedData[currentEditingIndex === -1 ? 0 : currentEditingIndex] = newData;
       renderTable();
    }
    setTimeout(() => showStatus("Reprocessado com as regras atuais!", 'success'), 500);
}

function clearAll() {
    if (confirm("Limpar todos os dados?")) {
        consolidatedData = []; pageImages = []; sourceFiles = []; lastExtractedText = "";
        renderTable();
        debugArea.textContent = ""; debugArea.style.display = 'none';
        fileCount.textContent = "0 arquivos";
        previewContent.innerHTML = '<p style="color: #999; font-size: 12px;">Clique em uma linha para visualizar</p>';
        showStatus("Dados limpos.", 'success');
        fileInput.value = "";
        selectBtn.disabled = false; copyBtn.disabled = true; debugBtn.disabled = true;
        forceOcrBtn.disabled = true; clearBtn.disabled = true; editBtn.disabled = true;
    }
}

window.addEventListener('click', (event) => {
    if (event.target === editModal) closeEditModal();
});