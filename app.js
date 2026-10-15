'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const styles = window.MESA_STYLES;
  let nextRef = 0;
  const defaults = index => styles[index].refs.map(ref => ({id: ++nextRef, url: window.MESA_ASSETS.references[ref], name: `referencia-${ref + 1}.png`, fidelity: 50, notes: '', local: false}));
  const state = {style: 0, generated: null, source: null, uploading: false, configs: styles.map((_, i) => ({refs: defaults(i), subjects: [], subjectEnabled: false}))};
  const config = () => state.configs[state.style];
  let uploadTarget = null;
  let toastTimer;
  const brief = () => JSON.stringify([$('headline').value, $('description').value, state.style, $('format').value, $('proposals').value, config()]);
  const stale = () => !!$('prompt').value.trim() && state.source !== null && state.source !== brief();
  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => {$('toast').hidden = true;}, 6000);
  }
  function buildPrompt() {
    const context = $('description').value.trim();
    const [width, height] = $('format').value.split('x').map(Number);
    return `Genera ${$('proposals').value} ${Number($('proposals').value) === 1 ? 'propuesta de ilustración editorial original' : 'propuestas de ilustración editorial originales y diferentes entre sí'} para esta noticia. Entrega cada propuesta como una imagen independiente, nunca como una cuadrícula o collage de alternativas.

TITULAR
${$('headline').value.trim()}${context ? '\n\nCONTEXTO DE LA NOTICIA\n' + context : ''}

DIRECCIÓN DE ARTE: ${styles[state.style].name}
${styles[state.style].rules}

${referencePrompt()}

FORMATO
${$('format').selectedOptions[0].textContent}. Dimensiones objetivo: ${width} × ${height} píxeles. Respeta la relación de aspecto. Si no puedes entregar esas dimensiones exactas, utiliza una resolución compatible con la misma proporción e indícalo fuera de la imagen. Deja márgenes de seguridad y un punto focal claro.

CRITERIO EDITORIAL
Identifica la tensión central de la noticia y resuélvela con una sola metáfora visual, una segunda lectura y el mínimo de elementos necesarios. Las referencias de estilo solo determinan el tratamiento plástico; las de sujeto determinan quién o qué se representa. Si entran en conflicto, conserva la identidad y geometría del sujeto según su fidelidad y adapta el estilo a esas restricciones. Los ejemplos de mecanismos visuales orientan el lenguaje, pero no debes copiarlos: crea una solución específica para este titular.
No añadas texto, titulares, logotipos ni marcas de agua dentro de la imagen. No inventes cifras ni hechos. La imagen debe leerse como una ilustración editorial, sin presentarse como fotografía documental de un suceso real.

RESULTADO
Crea exactamente ${$('proposals').value} ${Number($('proposals').value) === 1 ? 'imagen' : 'imágenes independientes'} con estas indicaciones. Mantén el estilo, los sujetos y sus fidelidades en todas las propuestas; varía la solución conceptual solo dentro de esas restricciones. Si la generación de imágenes no está disponible en este chat, indícalo claramente.`;
  }
  function sync() {
    const empty = !$('prompt').value.trim();
    $('promptCount').textContent = `${$('prompt').value.length.toLocaleString('es-ES')} caracteres`;
    $('staleNotice').hidden = !stale();
    $('copyBtn').disabled = empty || stale() || state.uploading;
    $('downloadBtn').disabled = empty || stale() || state.uploading;
    $('generateBtn').disabled = state.uploading;
    ['restoreBtn', 'addStyleBtn', 'addSubjectBtn', 'subjectEnabled'].forEach(id => $(id).disabled = state.uploading);
    document.querySelectorAll('.style-button').forEach(button => button.disabled = state.uploading);
    const count = config().refs.length + (config().subjectEnabled ? config().subjects.length : 0);
    $('attachmentNote').textContent = count ? `Adjunta ${count} referencia${count === 1 ? '' : 's'} en el chat nuevo, con los nombres indicados en el prompt. Copiar el texto no copia las imágenes.` : 'Sin imágenes de referencia activas: el prompt utilizará la descripción escrita del estilo.';
    $('promptState').textContent = empty ? 'POR CREAR' : stale() ? 'NOTICIA MODIFICADA' : $('prompt').value === state.generated ? 'LISTO PARA COPIAR' : 'EDITADO POR TI';
    $('generateBtn').textContent = empty ? 'Generar prompt ↗' : 'Regenerar con la noticia actual ↗';
  }
  function generatePrompt() {
    if (state.uploading) return false;
    const valid = !!$('headline').value.trim();
    $('headlineError').hidden = valid;
    $('headline').setAttribute('aria-invalid', String(!valid));
    if (!valid) {$('headline').focus(); return false;}
    $('prompt').value = buildPrompt();
    state.generated = $('prompt').value; state.source = brief(); sync();
    return true;
  }
  function changed() {
    if ($('headline').value.trim()) {$('headlineError').hidden = true; $('headline').setAttribute('aria-invalid', 'false');}
    if ($('prompt').value && $('prompt').value === state.generated && $('headline').value.trim()) generatePrompt();
    sync();
  }
  function fidelityText(value, subject) {
    const level = value < 34 ? 'Suave' : value < 67 ? 'Media' : 'Extrema';
    const rules = subject ? [
      'Mantén el sujeto reconocible y sus rasgos distintivos. Permite simplificar detalles secundarios al estilizar; conserva el gesto, la pose y la organización espacial esencial.',
      'Conserva con alta precisión identidad, rasgos, proporciones, gesto, pose, silueta y relaciones espaciales. En edificios o lugares, respeta su geometría y disposición reconocible. Limita la simplificación a detalles menores.',
      'Máxima fidelidad: conserva identidad, rasgos, expresión, gesto, pose, proporciones, punto de vista y posición relativa exacta de los elementos. En edificios y emplazamientos, conserva forma, estructura y distribución espacial. Cambia ÚNICAMENTE el estilo gráfico, textura, color e integración; no rediseñes, deformes, rejuvenezcas ni sustituyas el sujeto. Si no puedes alcanzar esta precisión, indícalo.'
    ] : [
      'Toma inspiración libre de la paleta, técnica y atmósfera; permite reinterpretar el lenguaje visual.',
      'Conserva claramente paleta, técnica, textura, tratamiento de formas y uso del espacio; crea una composición original.',
      'Sigue con máxima precisión la paleta, técnica, textura, contraste, trazo y lógica visual de esta referencia. Mantén una composición original para la noticia, sin copiar su escena ni convertir sus personajes en sujetos obligatorios.'
    ];
    return `${level} (${value}/100). ${rules[value < 34 ? 0 : value < 67 ? 1 : 2]}`;
  }
  const attachmentName = (kind, index, ref) => `${kind === 'refs' ? 'ESTILO' : 'SUJETO'}-${index + 1}-${ref.name}`;
  function referencePrompt() {
    const cfg = config();
    const lines = ['REFERENCIAS Y PRIORIDADES'];
    if (cfg.refs.length) {
      lines.push('Referencias de ESTILO: analiza los adjuntos siguientes como guías del lenguaje visual. Si la guía escrita y la imagen difieren, da prioridad a la imagen en proporción a su fidelidad.');
      cfg.refs.forEach((r, i) => lines.push(`${attachmentName('refs', i, r)} — Fidelidad de estilo: ${fidelityText(r.fidelity, false)}${r.notes.trim() ? ' Indicaciones: ' + r.notes.trim() : ''}`));
    } else lines.push('Sin referencias visuales de estilo: utiliza únicamente la dirección de arte escrita. No supongas imágenes ausentes.');
    if (cfg.subjectEnabled && cfg.subjects.length) {
      lines.push('Referencias de SUJETO: representan personas, objetos o lugares que deben aparecer reconocibles. No tomes su acabado fotográfico como estilo. Si varias imágenes muestran al mismo sujeto, úsalas como vistas complementarias; no lo dupliques. No inventes relaciones entre sujetos.');
      cfg.subjects.forEach((r, i) => lines.push(`${attachmentName('subjects', i, r)} — Fidelidad de sujeto: ${fidelityText(r.fidelity, true)}${r.notes.trim() ? ' Rasgos y posición que conservar: ' + r.notes.trim() : ''}`));
    } else lines.push('No se aportan referencias de sujeto. No atribuyas identidad concreta a personajes o lugares a partir de las referencias de estilo.');
    if (cfg.refs.length || (cfg.subjectEnabled && cfg.subjects.length)) lines.push('Los nombres anteriores identifican los archivos que adjunto junto a este prompt. Si falta algún adjunto, pídemelo antes de generar: no deduzcas su contenido del nombre. Si las referencias se contradicen, pide aclaración antes de sacrificar la fidelidad del sujeto.');
    return lines.join('\n\n');
  }
  function updateCards() {
    document.querySelectorAll('.style-button').forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === state.style));
      const strip = button.querySelector('.style-reference-strip'); strip.replaceChildren();
      const first = state.configs[i].refs[0];
      if (first) {const img = document.createElement('img'); img.src = first.url; img.alt = ''; strip.append(img);}
      else {const empty = document.createElement('span'); empty.textContent = 'Sin referencias · + Añadir'; strip.append(empty);}
    });
  }
  function removeRef(kind, id) {
    const list = config()[kind], index = list.findIndex(r => r.id === id);
    if (index < 0) return;
    const [removed] = list.splice(index, 1); if (removed.local) URL.revokeObjectURL(removed.url);
    renderEditor(); updateCards(); changed();
  }
  function restoreDefaults() {
    config().refs.forEach(r => {if (r.local) URL.revokeObjectURL(r.url);});
    config().refs = defaults(state.style); renderEditor(); updateCards(); changed();
    toast('Referencias de estilo originales recuperadas. Tus referencias de sujeto se conservan.');
  }
  function chooseFiles(kind, id = null) {
    if (state.uploading) return;
    uploadTarget = {style: state.style, kind, id};
    $('referenceUpload').multiple = id === null; $('referenceUpload').value = ''; $('referenceUpload').click();
  }
  async function readImage(file) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Usa imágenes PNG, JPEG o WebP.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Cada imagen debe ocupar como máximo 20 MB.');
    const url = URL.createObjectURL(file);
    try {await new Promise((resolve, reject) => {const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error('No se pudo leer la imagen. Elige un archivo válido.')); image.src = url;});}
    catch (err) {URL.revokeObjectURL(url); throw err;}
    return {id: ++nextRef, url, name: file.name, fidelity: 50, notes: '', local: true};
  }
  async function uploadFiles(files) {
    const target = uploadTarget; if (!target || !files.length) return;
    state.uploading = true; sync(); $('uploadError').hidden = true;
    const added = [];
    try {
      for (const file of (target.id === null ? files : files.slice(0, 1))) added.push(await readImage(file));
      const list = state.configs[target.style][target.kind];
      if (target.id !== null) {
        const index = list.findIndex(r => r.id === target.id);
        if (index < 0) throw new Error('La referencia ya no está disponible. Vuelve a añadir la imagen.');
        const previous = list[index];
        added[0].fidelity = previous.fidelity; added[0].notes = previous.notes;
        list.splice(index, 1, added[0]); if (previous.local) URL.revokeObjectURL(previous.url);
      } else list.push(...added);
      renderEditor(); updateCards(); toast('Referencias actualizadas para este ejercicio.');
    } catch (err) {added.forEach(r => URL.revokeObjectURL(r.url)); $('uploadError').textContent = err.message; $('uploadError').hidden = false;}
    finally {state.uploading = false; $('referenceUpload').value = ''; renderEditor(); changed();}
  }
  function renderReferences(kind, container) {
    container.replaceChildren();
    const list = config()[kind];
    if (!list.length) {const empty = document.createElement('p'); empty.className = 'field-note'; empty.textContent = 'No hay referencias. Añade una imagen para este ejercicio.'; container.append(empty);}
    list.forEach((ref, index) => {
      const item = document.createElement('div'); item.className = 'editable-ref';
      const visual = document.createElement('div'); visual.className = 'ref-visual';
      const image = document.createElement('img'); image.src = ref.url; image.alt = ref.name;
      const actions = document.createElement('div'); actions.className = 'ref-actions';
      const replace = document.createElement('button'); replace.type = 'button'; replace.textContent = '↻'; replace.title = replace.ariaLabel = `Reemplazar ${ref.name}`; replace.disabled = state.uploading; replace.addEventListener('click', () => chooseFiles(kind, ref.id));
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.title = remove.ariaLabel = `Eliminar ${ref.name}`; remove.disabled = state.uploading; remove.addEventListener('click', () => removeRef(kind, ref.id));
      actions.append(replace, remove); visual.append(image, actions);
      const name = document.createElement('a'); name.className = 'ref-download'; name.href = ref.url; name.download = attachmentName(kind, index, ref); name.textContent = `${name.download} ↓`;
      const label = document.createElement('label'); label.htmlFor = `fidelity-${ref.id}`; label.textContent = 'Fidelidad ';
      const output = document.createElement('output'); output.textContent = fidelityText(ref.fidelity, kind === 'subjects').split('.')[0]; label.append(output);
      const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.step = '1'; slider.value = ref.fidelity; slider.id = label.htmlFor;
      slider.addEventListener('input', () => {ref.fidelity = Number(slider.value); output.textContent = fidelityText(ref.fidelity, kind === 'subjects').split('.')[0]; changed();});
      const ticks = document.createElement('div'); ticks.className = 'fidelity-ticks'; ['Suave', 'Media', 'Extrema'].forEach(text => {const span = document.createElement('span'); span.textContent = text; ticks.append(span);});
      const notesLabel = document.createElement('label'); notesLabel.htmlFor = `notes-${ref.id}`; notesLabel.textContent = kind === 'subjects' ? 'Qué sujeto es y qué conservar' : 'Qué tomar de esta referencia';
      const notes = document.createElement('textarea'); notes.id = notesLabel.htmlFor; notes.rows = 2; notes.value = ref.notes; notes.placeholder = kind === 'subjects' ? 'Ej.: la misma persona, expresión y posición de las manos…' : 'Ej.: la paleta, el trazo o la textura…';
      notes.addEventListener('input', () => {ref.notes = notes.value; changed();});
      item.append(visual, name, label, slider, ticks, notesLabel, notes); container.append(item);
    });
  }
  function renderEditor() {
    $('editorTitle').textContent = `${state.style + 1}. ${styles[state.style].name} · Editar referencias`;
    $('subjectEnabled').checked = config().subjectEnabled; $('subjectPanel').hidden = !config().subjectEnabled;
    renderReferences('refs', $('styleRefs')); renderReferences('subjects', $('subjectRefs'));
  }
  function selectStyle(index, open = true) {
    state.style = index; updateCards();
    $('styleDescription').textContent = styles[index].description;
    $('styleTags').replaceChildren(...styles[index].tags.map(text => {const tag = document.createElement('span'); tag.textContent = text; return tag;}));
    renderEditor(); if (open) $('artEditor').open = true; changed();
  }
  async function copyPrompt() {
    if (!$('prompt').value.trim() || stale()) return;
    try {await navigator.clipboard.writeText($('prompt').value); toast('Prompt copiado. Abre un chat nuevo y pégalo allí.');}
    catch {$('prompt').focus(); $('prompt').select(); toast('Copia automática no disponible. Texto seleccionado: pulsa ⌘C o Ctrl+C.');}
  }
  function downloadPrompt() {
    if (!$('prompt').value.trim() || stale()) return;
    const blob = new Blob([$('prompt').value], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'promts-generator-rtve.txt'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function init() {
    styles.forEach((style, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'style-button';
      button.setAttribute('aria-label', `Estilo ${index + 1}: ${style.name}`);
      const strip = document.createElement('span'); strip.className = 'style-reference-strip';
      style.refs.forEach(ref => {const img = document.createElement('img'); img.src = window.MESA_ASSETS.references[ref]; img.alt = ''; strip.append(img);});
      const name = document.createElement('span'); name.className = 'style-title'; name.textContent = `${index + 1}. ${style.name}`;
      const subtitle = document.createElement('span'); subtitle.className = 'style-subtitle'; subtitle.textContent = style.short;
      button.append(strip, name, subtitle); button.addEventListener('click', () => selectStyle(index)); $('styles').append(button);
    });
    ['headline', 'description'].forEach(id => $(id).addEventListener('input', changed));
    $('format').addEventListener('change', changed);
    $('prompt').addEventListener('input', () => {if (state.source === null) state.source = brief(); sync();});
    $('generateBtn').addEventListener('click', () => {if (generatePrompt()) toast('Prompt preparado. Puedes editarlo antes de copiarlo.');});
    $('copyBtn').addEventListener('click', copyPrompt);
    $('downloadBtn').addEventListener('click', downloadPrompt);
    $('exampleBtn').addEventListener('click', () => {
      $('headline').value = 'La vivienda se aleja de los jóvenes';
      $('description').value = 'El aumento de los alquileres y la falta de oferta dificultan el acceso de los jóvenes a su primera vivienda.';
      changed(); toast('Noticia de ejemplo cargada.');
    });
    $('proposals').addEventListener('change', changed);
    $('clearPromptBtn').addEventListener('click', () => {$('prompt').value = ''; state.generated = null; state.source = null; sync(); $('prompt').focus(); toast('Texto limpio. La noticia y las referencias se conservan.');});
    $('restoreBtn').addEventListener('click', restoreDefaults);
    $('addStyleBtn').addEventListener('click', () => chooseFiles('refs'));
    $('addSubjectBtn').addEventListener('click', () => chooseFiles('subjects'));
    $('subjectEnabled').addEventListener('change', () => {config().subjectEnabled = $('subjectEnabled').checked; $('subjectPanel').hidden = !config().subjectEnabled; changed();});
    $('referenceUpload').addEventListener('change', event => uploadFiles(Array.from(event.target.files)));
    selectStyle(0, false); sync();
  }
  init();
})();
