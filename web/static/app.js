// State Management
let petsList = [];
let activePetId = 'luna';
let activePet = null;
let activeTab = 'dashboard';

// Search filter state
let searchQueries = {
  consultas: '',
  vacunas: '',
  desparasitaciones: '',
  medicamentos: '',
  diario: ''
};

// DOM Elements
const headerPetAvatar = document.getElementById('headerPetAvatar');
const headerPetName = document.getElementById('headerPetName');
const mainContent = document.getElementById('mainContent');
const bottomAlertBadge = document.getElementById('bottomAlertBadge');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCard = document.getElementById('modalCard');
const toastContainer = document.getElementById('toastContainer');

// ----------------------------------------------------
// UX Enhancement 1: Non-Blocking Toast Notifications
// ----------------------------------------------------
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  
  let icon = '✓';
  if (type === 'danger') icon = '✕';
  if (type === 'info') icon = 'ℹ';

  toast.innerHTML = `
    <span style="font-size:16px; font-weight:900;">${icon}</span>
    <span>${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ----------------------------------------------------
// UX Enhancement 2: Sleek In-App Confirm Dialog
// ----------------------------------------------------
function showConfirmDialog({ title, message, confirmText = 'Eliminar', onConfirm }) {
  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <div class="confirm-box">
      <div class="confirm-icon">🗑️</div>
      <h3 class="confirm-title">${escapeHtml(title)}</h3>
      <p class="confirm-msg">${escapeHtml(message)}</p>
      <div class="confirm-actions">
        <button class="btn-action-primary" style="background:var(--bg-surface); color:var(--text-main);" onclick="closeModal()">
          Cancelar
        </button>
        <button class="btn-action-primary" style="background:var(--danger);" id="confirmModalBtn">
          ${escapeHtml(confirmText)}
        </button>
      </div>
    </div>
  `;
  modalBackdrop.style.display = 'flex';

  document.getElementById('confirmModalBtn').addEventListener('click', async () => {
    closeModal();
    if (onConfirm) await onConfirm();
  });
}

// ----------------------------------------------------
// UX Enhancement 3: Dynamic Relative Time Calculation
// ----------------------------------------------------
function getRelativeTimeBadge(dateStr) {
  if (!dateStr || dateStr === 'N/A') return '';
  
  // Format expectation: DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return `<span class="expiry-pill expiry-green">${escapeHtml(dateStr)}</span>`;

  const targetDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    if (daysAgo > 30) {
      const months = Math.floor(daysAgo / 30);
      return `<span class="expiry-pill expiry-red">⚠️ Vencida hace ${months} ${months === 1 ? 'mes' : 'meses'}</span>`;
    }
    return `<span class="expiry-pill expiry-red">⚠️ Vencida hace ${daysAgo} d</span>`;
  } else if (diffDays === 0) {
    return `<span class="expiry-pill expiry-amber">⏰ Vence hoy</span>`;
  } else if (diffDays <= 15) {
    return `<span class="expiry-pill expiry-amber">⏰ Vence en ${diffDays} días</span>`;
  } else if (diffDays <= 45) {
    return `<span class="expiry-pill expiry-green">🗓️ En 1 mes</span>`;
  } else {
    const months = Math.round(diffDays / 30);
    return `<span class="expiry-pill expiry-green">✓ En ${months} meses</span>`;
  }
}

// Theme Management
function initTheme() {
  const saved = localStorage.getItem('sania_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sania_theme', next);
  showToast(`Tema ${next === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info');
}

// Navigation & Tab Switching
function switchTab(tab) {
  activeTab = tab;
  
  // Update desktop sidebar active state
  document.querySelectorAll('.desktop-sidebar .sidebar-link').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });

  // Update mobile bottom bar active state
  document.querySelectorAll('.mobile-bottom-bar .bar-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });

  renderCurrentView();
}

// Smart Contextual Action Click
function handleSmartActionClick() {
  switch (activeTab) {
    case 'vacunas':
      openAddRecordModal('vacuna');
      break;
    case 'consultas':
      openAddRecordModal('diagnostico');
      break;
    case 'desparasitaciones':
      openAddRecordModal('desparasitacion');
      break;
    case 'medicamentos':
      openAddRecordModal('medicamento');
      break;
    case 'diario':
      openAddRecordModal('sintoma');
      break;
    case 'peso':
      openAddRecordModal('peso');
      break;
    case 'laboratorios':
      openAddRecordModal('laboratorio');
      break;
    case 'imagenes':
      openAddRecordModal('imagen');
      break;
    case 'alertas':
      openAddRecordModal('alerta');
      break;
    case 'perfil':
      openAddPetModal();
      break;
    case 'dashboard':
    default:
      openBottomSheetMenu();
      break;
  }
}

// API Calls
async function loadPets() {
  try {
    const res = await fetch('/api/pets');
    if (!res.ok) throw new Error('Error al cargar mascotas');
    petsList = await res.json();
    if (petsList.length > 0) {
      if (!petsList.some(p => p.id === activePetId)) {
        activePetId = petsList[0].id;
      }
    }
    await loadActivePet(activePetId);
  } catch (err) {
    console.error(err);
    mainContent.innerHTML = `<div class="card-section"><p style="color:var(--danger)">Error al conectar con la API: ${err.message}</p></div>`;
  }
}

async function loadActivePet(petId) {
  activePetId = petId;
  try {
    const res = await fetch(`/api/pets/${petId}`);
    if (!res.ok) throw new Error('Error al obtener ficha clínica');
    activePet = await res.json();
    
    // Update Header
    headerPetAvatar.src = activePet.foto || '/static/favicon.svg';
    headerPetName.textContent = `${activePet.nombre} (${activePet.especie})`;
    
    // Update Alert Badge in Bottom Nav
    const activeAlerts = (activePet.alertas || []).filter(a => !a.estado || a.estado === 'activa');
    if (activeAlerts.length > 0) {
      bottomAlertBadge.style.display = 'flex';
      bottomAlertBadge.textContent = activeAlerts.length;
    } else {
      bottomAlertBadge.style.display = 'none';
    }

    renderCurrentView();
  } catch (err) {
    console.error(err);
  }
}

// Render Main View according to Active Tab
function renderCurrentView() {
  if (!activePet) return;

  switch (activeTab) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'consultas':
      renderConsultas();
      break;
    case 'vacunas':
      renderVacunas();
      break;
    case 'desparasitaciones':
      renderDesparasitaciones();
      break;
    case 'medicamentos':
      renderMedicamentos();
      break;
    case 'laboratorios':
      renderLaboratorios();
      break;
    case 'imagenes':
      renderImagenes();
      break;
    case 'diario':
      renderDiario();
      break;
    case 'peso':
      renderPeso();
      break;
    case 'alertas':
      renderAlertas();
      break;
    case 'perfil':
      renderPerfil();
      break;
    default:
      renderDashboard();
  }
}

// 1. Dashboard View
function renderDashboard() {
  const p = activePet;
  const activeAlerts = (p.alertas || []).filter(a => !a.estado || a.estado === 'activa');

  mainContent.innerHTML = `
    <!-- Ultra-Compact Active Alerts Container (Minimum Vertical Space) -->
    ${activeAlerts.length > 0 ? `
      <div class="alerts-compact-container">
        ${activeAlerts.map(a => `
          <div class="alert-compact-row ${a.tipo}" onclick="openAlertActionModal('${a.id}')" title="Clic para gestionar alerta">
            <div class="alert-compact-left">
              <div class="alert-compact-icon">
                <span>${a.tipo === 'critica' ? '⚠️' : '🔔'}</span>
              </div>
              <span class="alert-compact-title">${escapeHtml(a.titulo)}</span>
            </div>
            <span class="alert-compact-tag">ALERTA</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Blue Gradient Ficha Médica Card (Matching 1.png) -->
    <div class="ficha-medica-card">
      <div class="ficha-top-row">
        <span class="ficha-badge">Ficha Médica</span>
        <div class="ficha-top-actions">
          <button class="ficha-action-btn" onclick="openDigitalPassportModal()" title="Carnet Digital / Código QR">🪪</button>
          <button class="ficha-action-btn" onclick="switchTab('perfil')" title="Ver Perfil Completo">›</button>
        </div>
      </div>

      <div class="ficha-pet-name">${escapeHtml(p.nombre)}</div>
      <div class="ficha-pet-breed">${escapeHtml(p.raza || 'Mascota')} • ${escapeHtml(p.edad || '3 años')}</div>

      <div class="ficha-grid-2x2">
        <div>
          <div class="ficha-field-label">Microchip</div>
          <div class="ficha-field-val">${escapeHtml(p.microchip || '981022300456123')}</div>
        </div>
        <div>
          <div class="ficha-field-label">Seguro Médico</div>
          <div class="ficha-field-val">${escapeHtml(p.seguro || 'PetPlan Gold (80%...)')}</div>
        </div>
        <div>
          <div class="ficha-field-label">Sexo</div>
          <div class="ficha-field-val">${escapeHtml(p.sexo || 'Hembra (Esterilizada)')}</div>
        </div>
        <div>
          <div class="ficha-field-label">Clínica Frecuente</div>
          <a href="tel:+56912345678" class="ficha-field-val clickable" title="Llamar a la clínica">
            📞 ${escapeHtml(p.clinica_frecuente || 'Hospital Veterinario...')}
          </a>
        </div>
      </div>
    </div>

    <!-- Section Title: Historial Médico -->
    <div class="section-title-wrap">
      <span class="section-pulse-icon">⚡</span>
      <h2 class="section-title">Historial Médico</h2>
    </div>

    <!-- 2x2 Feature Menu Grid (Matching 1.png) -->
    <div class="features-grid-2x2">
      <!-- Consultas -->
      <div class="feature-menu-card" onclick="switchTab('consultas')">
        <div class="feature-icon-squircle feature-icon-blue">🩺</div>
        <div class="feature-card-name">Consultas</div>
        <div class="feature-card-desc">Historial clínico</div>
      </div>

      <!-- Vacunas -->
      <div class="feature-menu-card" onclick="switchTab('vacunas')">
        <div class="feature-icon-squircle feature-icon-green">🛡️</div>
        <div class="feature-card-name">Vacunas</div>
        <div class="feature-card-desc">Próximas y aplicadas</div>
      </div>

      <!-- Desparasitaciones -->
      <div class="feature-menu-card" onclick="switchTab('desparasitaciones')">
        <div class="feature-icon-squircle feature-icon-orange">🪲</div>
        <div class="feature-card-name">Desparasitaciones</div>
        <div class="feature-card-desc">Control interno y externo</div>
      </div>

      <!-- Tratamientos / Medicamentos -->
      <div class="feature-menu-card" onclick="switchTab('medicamentos')">
        <div class="feature-icon-squircle feature-icon-purple">💊</div>
        <div class="feature-card-name">Tratamientos</div>
        <div class="feature-card-desc">Prescripción o suplemento</div>
      </div>

      <!-- Laboratorios -->
      <div class="feature-menu-card" onclick="switchTab('laboratorios')">
        <div class="feature-icon-squircle feature-icon-pink">🧪</div>
        <div class="feature-card-name">Laboratorios</div>
        <div class="feature-card-desc">Exámenes y análisis</div>
      </div>

      <!-- Imágenes Médicas -->
      <div class="feature-menu-card" onclick="switchTab('imagenes')">
        <div class="feature-icon-squircle feature-icon-teal">🩻</div>
        <div class="feature-card-name">Imágenes</div>
        <div class="feature-card-desc">Ecografías y rayos X</div>
      </div>
    </div>
  `;
}

// 2. Consultas View (With Back button & live filter)
function renderConsultas() {
  const p = activePet;
  const q = searchQueries.consultas.toLowerCase();
  const list = (p.diagnosticos || []).filter(d => 
    !q || d.descripcion.toLowerCase().includes(q) || d.tipo.toLowerCase().includes(q) || (d.doctor && d.doctor.toLowerCase().includes(q))
  );

  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">🩺 Consultas</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('diagnostico')">+ Registrar</button>
    </div>

    <div class="search-filter-wrap">
      <span class="search-filter-icon">🔍</span>
      <input type="text" class="search-filter-input" placeholder="Buscar consultas o diagnósticos..." value="${escapeHtml(searchQueries.consultas)}" oninput="handleSearchFilter('consultas', this.value)">
    </div>

    <div class="card-section">
      ${list.length > 0 ? list.map(d => `
        <div class="clinical-record-card">
          <div class="clinical-record-top">
            <span class="badge-tag badge-blue">${escapeHtml(d.tipo)}</span>
            <span style="font-size:12px; color:var(--text-light); font-weight:700;">${escapeHtml(d.fecha)}</span>
          </div>
          <div style="font-size:14px; font-weight:800; color:var(--text-main); margin-top:4px;">
            ${escapeHtml(d.descripcion)}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); margin-top:6px; border-top:1px solid var(--border-light); padding-top:6px;">
            <span>👨‍⚕️ ${escapeHtml(d.doctor || 'Médico')} • ${escapeHtml(d.clinica || 'Clínica')}</span>
            <button style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:14px;" onclick="deleteRecord('diagnostico', ${d.ID})">🗑️</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">No se encontraron consultas registradas.</p>'}
    </div>
  `;
}

// 3. Vacunas View (With relative time badges)
function renderVacunas() {
  const p = activePet;
  const q = searchQueries.vacunas.toLowerCase();
  const list = (p.vacunas || []).filter(v => 
    !q || v.nombre.toLowerCase().includes(q) || (v.lote && v.lote.toLowerCase().includes(q))
  );

  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">🛡️ Vacunas</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('vacuna')">+ Registrar</button>
    </div>

    <div class="search-filter-wrap">
      <span class="search-filter-icon">🔍</span>
      <input type="text" class="search-filter-input" placeholder="Buscar vacuna o lote..." value="${escapeHtml(searchQueries.vacunas)}" oninput="handleSearchFilter('vacunas', this.value)">
    </div>

    <div class="card-section">
      ${list.length > 0 ? list.map(v => `
        <div class="clinical-record-card">
          <div class="clinical-record-top">
            <strong style="font-size:15px; color:var(--text-main);">${escapeHtml(v.nombre)}</strong>
            ${getRelativeTimeBadge(v.proxima_fecha)}
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); line-height:1.5; margin-top:4px;">
            <div>📅 <strong>Aplicada:</strong> ${escapeHtml(v.fecha)}</div>
            <div>🎯 <strong>Próxima renovación:</strong> ${escapeHtml(v.proxima_fecha || 'N/A')}</div>
            <div>🏷️ <strong>Lote:</strong> ${escapeHtml(v.lote || 'N/A')}</div>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px; border-top:1px solid var(--border-light); padding-top:6px;">
            <button style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:13px; font-weight:700;" onclick="deleteRecord('vacuna', ${v.ID})">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">No se encontraron vacunas.</p>'}
    </div>
  `;
}

// 4. Desparasitaciones View
function renderDesparasitaciones() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">🪲 Desparasitaciones</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('desparasitacion')">+ Registrar</button>
    </div>

    <div class="card-section">
      ${(p.desparasitaciones && p.desparasitaciones.length > 0) ? p.desparasitaciones.map(d => `
        <div class="clinical-record-card">
          <div class="clinical-record-top">
            <strong style="font-size:15px; color:var(--text-main);">${escapeHtml(d.producto)}</strong>
            <span class="badge-tag badge-amber">${escapeHtml(d.tipo)}</span>
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); line-height:1.5; margin-top:4px;">
            <div>📅 <strong>Fecha:</strong> ${escapeHtml(d.fecha)} • 🎯 <strong>Próxima:</strong> ${escapeHtml(d.proxima_fecha || 'N/A')}</div>
            <div>💊 <strong>Dosis:</strong> ${escapeHtml(d.dosis || '1 dosis')} (Peso: ${escapeHtml(d.peso_mascota || '-')})</div>
            <div style="margin-top:2px;">${getRelativeTimeBadge(d.proxima_fecha)}</div>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px; border-top:1px solid var(--border-light); padding-top:6px;">
            <button style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:13px; font-weight:700;" onclick="deleteRecord('desparasitacion', ${d.ID})">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">Sin desparasitaciones registradas.</p>'}
    </div>
  `;
}

// 5. Medicamentos View
function renderMedicamentos() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">💊 Tratamientos</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('medicamento')">+ Registrar</button>
    </div>

    <div class="card-section">
      ${(p.medicamentos && p.medicamentos.length > 0) ? p.medicamentos.map(m => `
        <div class="clinical-record-card">
          <div class="clinical-record-top">
            <strong style="font-size:15px; color:var(--text-main);">${escapeHtml(m.nombre)}</strong>
            <span class="badge-tag ${m.estado === 'Activo' ? 'badge-green' : 'badge-blue'}">${escapeHtml(m.estado)}</span>
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); line-height:1.5; margin-top:4px;">
            <div>💊 <strong>Dosis:</strong> ${escapeHtml(m.dosis)} • ⏰ ${escapeHtml(m.frecuencia)}</div>
            <div>⏳ <strong>Duración:</strong> ${escapeHtml(m.duracion)}</div>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px; border-top:1px solid var(--border-light); padding-top:6px;">
            <button style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:13px; font-weight:700;" onclick="deleteRecord('medicamento', ${m.ID})">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">Sin tratamientos registrados.</p>'}
    </div>
  `;
}

// 6. Laboratorios View
function renderLaboratorios() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">🧪 Laboratorios</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('laboratorio')">+ Registrar</button>
    </div>

    <div class="card-section">
      ${(p.laboratorios && p.laboratorios.length > 0) ? p.laboratorios.map(lab => `
        <div class="clinical-record-card" style="cursor:pointer;" onclick="openLabDetailsModal('${lab.id}')">
          <div class="clinical-record-top">
            <strong style="font-size:15px; color:var(--text-main);">${escapeHtml(lab.examen)}</strong>
            <span style="font-size:12px; color:var(--text-light); font-weight:700;">${escapeHtml(lab.fecha)}</span>
          </div>
          <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px;">${escapeHtml(lab.laboratorio)}</p>
          <div style="font-size:12px; color:var(--secondary); font-weight:800; margin-top:4px;">
            👉 Ver desglose de ${lab.resultados ? lab.resultados.length : 0} parámetros analizados
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">Sin exámenes de laboratorio.</p>'}
    </div>
  `;
}

// 7. Imagenes Medicas View
function renderImagenes() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">🩻 Imágenes</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('imagen')">+ Registrar</button>
    </div>

    <div class="card-section">
      ${(p.imagenes && p.imagenes.length > 0) ? p.imagenes.map(img => `
        <div class="clinical-record-card" style="cursor:pointer;" onclick="openImageDetailsModal(${img.ID})">
          <div class="clinical-record-top">
            <span class="badge-tag badge-blue">${escapeHtml(img.tipo)}</span>
            <span style="font-size:12px; color:var(--text-light); font-weight:700;">${escapeHtml(img.fecha)}</span>
          </div>
          <strong style="font-size:15px; color:var(--text-main); margin-top:4px;">${escapeHtml(img.nombre)}</strong>
          <p style="font-size:12.5px; color:var(--text-muted);">${escapeHtml(img.indicacion || 'Estudio de control')}</p>
          <div style="font-size:12px; color:var(--secondary); font-weight:800; margin-top:4px;">
            👉 Ver radiografía e informe radiológico
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">Sin imágenes registradas.</p>'}
    </div>
  `;
}

// 8. Diario de Salud View
function renderDiario() {
  const p = activePet;
  const q = searchQueries.diario.toLowerCase();
  const list = (p.diario || []).filter(d => 
    !q || d.sintoma.toLowerCase().includes(q) || (d.nota && d.nota.toLowerCase().includes(q))
  );

  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">📋 Diario de Salud</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('sintoma')">+ Registrar</button>
    </div>

    <div class="search-filter-wrap">
      <span class="search-filter-icon">🔍</span>
      <input type="text" class="search-filter-input" placeholder="Buscar síntomas o notas..." value="${escapeHtml(searchQueries.diario)}" oninput="handleSearchFilter('diario', this.value)">
    </div>

    <div class="card-section">
      ${list.length > 0 ? list.map(d => `
        <div class="clinical-record-card">
          <div class="clinical-record-top">
            <strong style="font-size:15px; color:var(--text-main);">${escapeHtml(d.sintoma)}</strong>
            <span class="badge-tag ${d.estado === 'Normal' ? 'badge-green' : d.estado === 'Atención' ? 'badge-amber' : 'badge-red'}">${escapeHtml(d.estado)}</span>
          </div>
          <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">${escapeHtml(d.nota || 'Sin observaciones')}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:var(--text-light); border-top:1px solid var(--border-light); padding-top:6px; margin-top:4px;">
            <span>📅 ${escapeHtml(d.fecha)}</span>
            <button style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:13px; font-weight:700;" onclick="deleteRecord('sintoma', ${d.ID})">🗑️ Eliminar</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">No se encontraron síntomas anotados.</p>'}
    </div>
  `;
}

// 9. Historial de Peso View
function renderPeso() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">⚖️ Control de Peso</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('peso')">+ Registrar</button>
    </div>

    <div class="card-section">
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        ${(p.peso_historial && p.peso_historial.length > 0) ? p.peso_historial.map(reg => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 0.85rem; background:var(--bg-surface); border-radius:var(--radius-sm);">
            <div>
              <strong style="font-size:14px;">${escapeHtml(reg.fecha)}</strong>
            </div>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span style="font-family:var(--font-mono); font-weight:900; color:var(--primary); font-size:15px;">${reg.peso} kg</span>
              <button style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:14px;" onclick="deleteRecord('peso', ${reg.ID})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">Sin pesajes registrados.</p>'}
      </div>
    </div>
  `;
}

// 10. Alertas View
function renderAlertas() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">🔔 Alertas</span>
      <button class="btn-action-primary" onclick="openAddRecordModal('alerta')">+ Nueva</button>
    </div>

    <div class="card-section">
      ${(p.alertas && p.alertas.length > 0) ? p.alertas.map(a => `
        <div class="alert-compact-row ${a.tipo}" onclick="openAlertActionModal('${a.id}')" style="margin-bottom:0.65rem;">
          <div class="alert-compact-left">
            <div class="alert-compact-icon">
              <span>${a.tipo === 'critica' ? '⚠️' : '🔔'}</span>
            </div>
            <div>
              <div class="alert-compact-title">${escapeHtml(a.titulo)}</div>
              <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${escapeHtml(a.descripcion)}</div>
            </div>
          </div>
          <span class="alert-compact-tag">${escapeHtml(a.estado || 'Activa')}</span>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding:1rem 0;">Sin alertas registradas.</p>'}
    </div>
  `;
}

// 11. Perfil View
function renderPerfil() {
  const p = activePet;
  const owner = p.propietario || {};
  mainContent.innerHTML = `
    <div class="subview-nav-header">
      <button class="btn-back-link" onclick="switchTab('dashboard')">‹ Volver al Inicio</button>
      <span class="subview-title">👤 Perfil & Tutor</span>
      <span></span>
    </div>

    <div class="card-section">
      <div class="card-section-header">
        <div class="card-section-title">
          <span>🐾</span>
          <span>Ficha de Identificación</span>
        </div>
      </div>
      <form onsubmit="handleSavePetProfile(event)">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-input" id="pNombre" value="${escapeHtml(p.nombre)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Especie</label>
            <input type="text" class="form-input" id="pEspecie" value="${escapeHtml(p.especie)}" required>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Raza</label>
            <input type="text" class="form-input" id="pRaza" value="${escapeHtml(p.raza || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Edad</label>
            <input type="text" class="form-input" id="pEdad" value="${escapeHtml(p.edad || '')}">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Sexo</label>
            <input type="text" class="form-input" id="pSexo" value="${escapeHtml(p.sexo || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Microchip</label>
            <input type="text" class="form-input" id="pMicrochip" value="${escapeHtml(p.microchip || '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Seguro Médico</label>
          <input type="text" class="form-input" id="pSeguro" value="${escapeHtml(p.seguro || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Clínica Frecuente</label>
          <input type="text" class="form-input" id="pClinica" value="${escapeHtml(p.clinica_frecuente || '')}">
        </div>
        <button type="submit" class="btn-action-primary" style="width:100%; padding:0.75rem;">Guardar Cambios Mascota</button>
      </form>
    </div>

    <div class="card-section">
      <div class="card-section-header">
        <div class="card-section-title">
          <span>👤</span>
          <span>Datos del Tutor / Dueño</span>
        </div>
      </div>
      <form onsubmit="handleSaveOwnerProfile(event)">
        <div class="form-group">
          <label class="form-label">Nombre del Tutor</label>
          <input type="text" class="form-input" id="oNombre" value="${escapeHtml(owner.nombre || '')}" required>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="text" class="form-input" id="oTelefono" value="${escapeHtml(owner.telefono || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="oEmail" value="${escapeHtml(owner.email || '')}">
          </div>
        </div>
        <button type="submit" class="btn-action-primary" style="width:100%; padding:0.75rem;">Guardar Datos Dueño</button>
      </form>
    </div>
  `;
}

// Live Search Filter Handler
function handleSearchFilter(key, query) {
  searchQueries[key] = query;
  if (key === 'consultas') renderConsultas();
  if (key === 'vacunas') renderVacunas();
  if (key === 'diario') renderDiario();
}

// ----------------------------------------------------
// Modals & Bottom Sheets (Matching 2.png)
// ----------------------------------------------------

function closeModal() {
  modalBackdrop.style.display = 'none';
  modalCard.innerHTML = '';
}

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// Bottom Sheet Option Menu (Exact 2.png)
function openBottomSheetMenu() {
  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">¿Qué deseas registrar?</h3>

    <div class="sheet-options-list">
      <!-- 1. Sintoma -->
      <button class="sheet-option-row" onclick="openAddRecordModal('sintoma')">
        <div class="sheet-option-icon" style="background:#eff6ff; color:#2563eb;">📋</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Síntoma</span>
          <span class="sheet-option-sub">Anotar observaciones cotidianas</span>
        </div>
      </button>

      <!-- 2. Peso -->
      <button class="sheet-option-row" onclick="openAddRecordModal('peso')">
        <div class="sheet-option-icon" style="background:#fff7ed; color:#ea580c;">⚖️</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Peso</span>
          <span class="sheet-option-sub">Controlar peso y crecimiento</span>
        </div>
      </button>

      <!-- 3. Vacuna -->
      <button class="sheet-option-row" onclick="openAddRecordModal('vacuna')">
        <div class="sheet-option-icon" style="background:#ecfdf5; color:#10b981;">💉</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Vacuna</span>
          <span class="sheet-option-sub">Historial de inmunizaciones</span>
        </div>
      </button>

      <!-- 4. Recordatorio -->
      <button class="sheet-option-row" onclick="openAddRecordModal('alerta')">
        <div class="sheet-option-icon" style="background:#eef2ff; color:#6366f1;">🔔</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Agendar Recordatorio</span>
          <span class="sheet-option-sub">Alertas y citas próximas</span>
        </div>
      </button>

      <!-- 5. Tratamiento -->
      <button class="sheet-option-row" onclick="openAddRecordModal('medicamento')">
        <div class="sheet-option-icon" style="background:#faf5ff; color:#9333ea;">💊</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Tratamiento</span>
          <span class="sheet-option-sub">Prescripción o suplemento</span>
        </div>
      </button>

      <!-- 6. Consulta -->
      <button class="sheet-option-row" onclick="openAddRecordModal('diagnostico')">
        <div class="sheet-option-icon" style="background:#f0fdfa; color:#0d9488;">🩺</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Consulta</span>
          <span class="sheet-option-sub">Historial y diagnóstico clínico</span>
        </div>
      </button>

      <!-- 7. Desparasitacion -->
      <button class="sheet-option-row" onclick="openAddRecordModal('desparasitacion')">
        <div class="sheet-option-icon" style="background:#fffbeb; color:#d97706;">🪱</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Desparasitación</span>
          <span class="sheet-option-sub">Control interno o externo</span>
        </div>
      </button>

      <!-- 8. Laboratorio -->
      <button class="sheet-option-row" onclick="openAddRecordModal('laboratorio')">
        <div class="sheet-option-icon" style="background:#fdf2f8; color:#db2777;">🧪</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Laboratorio</span>
          <span class="sheet-option-sub">Exámenes y análisis clínicos</span>
        </div>
      </button>

      <!-- 9. Imagen -->
      <button class="sheet-option-row" onclick="openAddRecordModal('imagen')">
        <div class="sheet-option-icon" style="background:#ecfeff; color:#0891b2;">🩻</div>
        <div class="sheet-option-text">
          <span class="sheet-option-title">Registrar Imagen</span>
          <span class="sheet-option-sub">Ecografías y radiografías</span>
        </div>
      </button>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

// Add Record Modal
function openAddRecordModal(type) {
  const now = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  let fields = '';
  let title = 'Nuevo Registro';

  if (type === 'vacuna') {
    title = 'Registrar Vacuna';
    fields = `
      <div class="form-group">
        <label class="form-label">Nombre de la Vacuna</label>
        <input type="text" class="form-input" id="fNombre" placeholder="Ej: Antirrábica, Séxtuple..." required>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha Aplicación</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Próxima Renovación</label>
          <input type="text" class="form-input" id="fProxFecha" placeholder="DD/MM/AAAA">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Lote del Fabricante</label>
        <input type="text" class="form-input" id="fLote" placeholder="Lote...">
      </div>
    `;
  } else if (type === 'diagnostico') {
    title = 'Registrar Consulta Médica';
    fields = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-select" id="fTipo">
            <option value="Consulta General">Consulta General</option>
            <option value="Urgencia">Urgencia</option>
            <option value="Especialidad">Especialidad</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Diagnóstico / Motivo</label>
        <textarea class="form-textarea" id="fDesc" placeholder="Observaciones y diagnóstico clínico..." required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Veterinario</label>
        <input type="text" class="form-input" id="fDoctor" placeholder="Dra. Sandra Valenzuela">
      </div>
    `;
  } else if (type === 'desparasitacion') {
    title = 'Registrar Desparasitación';
    fields = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-select" id="fTipo">
            <option value="Externa">Externa</option>
            <option value="Interna">Interna</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Producto</label>
          <input type="text" class="form-input" id="fProducto" placeholder="NexGard, Bravecto..." required>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Próxima Fecha</label>
          <input type="text" class="form-input" id="fProxFecha" placeholder="DD/MM/AAAA">
        </div>
      </div>
    `;
  } else if (type === 'medicamento') {
    title = 'Registrar Tratamiento';
    fields = `
      <div class="form-group">
        <label class="form-label">Fármaco / Medicamento</label>
        <input type="text" class="form-input" id="fNombre" placeholder="Ej: Prednisona 5mg" required>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Dosis</label>
          <input type="text" class="form-input" id="fDosis" placeholder="1 tableta" required>
        </div>
        <div class="form-group">
          <label class="form-label">Frecuencia</label>
          <input type="text" class="form-input" id="fFrec" placeholder="Cada 24 horas" required>
        </div>
      </div>
    `;
  } else if (type === 'sintoma') {
    title = 'Registrar Síntoma';
    fields = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Gravedad</label>
          <select class="form-select" id="fEstado">
            <option value="Normal">Normal</option>
            <option value="Atención">Atención</option>
            <option value="Grave">Grave</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Síntoma o Conducta</label>
        <input type="text" class="form-input" id="fSintoma" placeholder="Apetito, vómito, tos..." required>
      </div>
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea class="form-textarea" id="fNota" placeholder="Detalle..."></textarea>
      </div>
    `;
  } else if (type === 'peso') {
    title = 'Registrar Control de Peso';
    fields = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Peso (kg)</label>
          <input type="number" step="0.1" class="form-input" id="fPesoNum" placeholder="12.4" required>
        </div>
      </div>
    `;
  } else if (type === 'alerta') {
    title = 'Agendar Alerta / Recordatorio';
    fields = `
      <div class="form-group">
        <label class="form-label">Tipo de Alerta</label>
        <select class="form-select" id="fTipo">
          <option value="critica">Alerta Crítica / Alergia Severa</option>
          <option value="preventiva">Recordatorio Preventivo</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Título de la Alerta</label>
        <input type="text" class="form-input" id="fTitulo" placeholder="ALERGIA A LA IVERMECTINA" required>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-textarea" id="fDesc" placeholder="Detalle e instrucciones..." required></textarea>
      </div>
    `;
  } else if (type === 'laboratorio') {
    title = 'Registrar Examen de Laboratorio';
    fields = `
      <div class="form-group">
        <label class="form-label">Nombre del Examen</label>
        <input type="text" class="form-input" id="fExamen" placeholder="Hemograma Completo" required>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Laboratorio</label>
          <input type="text" class="form-input" id="fLab" placeholder="Veterinary Diagnostics">
        </div>
      </div>
    `;
  } else if (type === 'imagen') {
    title = 'Registrar Imagen Médica';
    fields = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-select" id="fTipo">
            <option value="Radiografía">Radiografía</option>
            <option value="Ecografía">Ecografía</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Estudio</label>
        <input type="text" class="form-input" id="fNombre" placeholder="Radiografía de Abdomen" required>
      </div>
      <div class="form-group">
        <label class="form-label">Informe Radiológico</label>
        <textarea class="form-textarea" id="fInforme" placeholder="Conclusiones diagnósticas..." required></textarea>
      </div>
    `;
  }

  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">${title}</h3>
    <form onsubmit="handleSaveRecord(event, '${type}')">
      ${fields}
      <button type="submit" class="btn-action-primary" style="width:100%; padding:0.8rem; margin-top:0.5rem;">+ Guardar Registro</button>
    </form>
  `;
  modalBackdrop.style.display = 'flex';
}

async function handleSaveRecord(e, type) {
  e.preventDefault();
  let url = `/api/pets/${activePetId}/`;
  let payload = {};

  if (type === 'vacuna') {
    url += 'vacunas';
    payload = {
      nombre: document.getElementById('fNombre').value.trim(),
      fecha: document.getElementById('fFecha').value.trim(),
      proxima_fecha: document.getElementById('fProxFecha').value.trim(),
      lote: document.getElementById('fLote').value.trim(),
      estado: 'Aplicada'
    };
  } else if (type === 'diagnostico') {
    url += 'diagnosticos';
    payload = {
      fecha: document.getElementById('fFecha').value.trim(),
      tipo: document.getElementById('fTipo').value,
      descripcion: document.getElementById('fDesc').value.trim(),
      doctor: document.getElementById('fDoctor').value.trim(),
      estado: 'Resuelto'
    };
  } else if (type === 'desparasitacion') {
    url += 'desparasitaciones';
    payload = {
      tipo: document.getElementById('fTipo').value,
      producto: document.getElementById('fProducto').value.trim(),
      fecha: document.getElementById('fFecha').value.trim(),
      proxima_fecha: document.getElementById('fProxFecha').value.trim()
    };
  } else if (type === 'medicamento') {
    url += 'medicamentos';
    payload = {
      nombre: document.getElementById('fNombre').value.trim(),
      dosis: document.getElementById('fDosis').value.trim(),
      frecuencia: document.getElementById('fFrec').value.trim(),
      estado: 'Activo'
    };
  } else if (type === 'sintoma') {
    url += 'sintomas';
    payload = {
      fecha: document.getElementById('fFecha').value.trim(),
      sintoma: document.getElementById('fSintoma').value.trim(),
      estado: document.getElementById('fEstado').value,
      nota: document.getElementById('fNota').value.trim()
    };
  } else if (type === 'peso') {
    url += 'peso';
    payload = {
      fecha: document.getElementById('fFecha').value.trim(),
      peso: parseFloat(document.getElementById('fPesoNum').value)
    };
  } else if (type === 'alerta') {
    url += 'alertas';
    payload = {
      tipo: document.getElementById('fTipo').value,
      titulo: document.getElementById('fTitulo').value.toUpperCase().trim(),
      descripcion: document.getElementById('fDesc').value.trim()
    };
  } else if (type === 'laboratorio') {
    url += 'laboratorios';
    payload = {
      examen: document.getElementById('fExamen').value.trim(),
      fecha: document.getElementById('fFecha').value.trim(),
      laboratorio: document.getElementById('fLab').value.trim()
    };
  } else if (type === 'imagen') {
    url += 'imagenes';
    payload = {
      tipo: document.getElementById('fTipo').value,
      nombre: document.getElementById('fNombre').value.trim(),
      fecha: document.getElementById('fFecha').value.trim(),
      informe: document.getElementById('fInforme').value.trim(),
      imagen_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300'
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal();
      showToast('Registro guardado exitosamente', 'success');
      await loadActivePet(activePetId);
    }
  } catch (err) {
    showToast('Error al guardar: ' + err.message, 'danger');
  }
}

// Delete Record with Smooth Confirm Dialog
function deleteRecord(type, id) {
  showConfirmDialog({
    title: '¿Eliminar registro?',
    message: 'Esta acción removerá el registro del historial clínico de la mascota.',
    confirmText: 'Sí, Eliminar',
    onConfirm: async () => {
      let url = `/api/pets/${activePetId}/`;
      if (type === 'diagnostico') url += `diagnosticos/${id}`;
      if (type === 'vacuna') url += `vacunas/${id}`;
      if (type === 'desparasitacion') url += `desparasitaciones/${id}`;
      if (type === 'medicamento') url += `medicamentos/${id}`;
      if (type === 'sintoma') url += `sintomas/${id}`;
      if (type === 'peso') url += `peso/${id}`;
      if (type === 'laboratorio') url += `laboratorios/${id}`;
      if (type === 'imagen') url += `imagenes/${id}`;

      try {
        const res = await fetch(url, { method: 'DELETE' });
        if (res.ok) {
          showToast('Registro eliminado', 'info');
          await loadActivePet(activePetId);
        }
      } catch (err) {
        showToast('Error al eliminar: ' + err.message, 'danger');
      }
    }
  });
}

// Digital Passport / Emergency QR Code Modal (UX Feature)
function openDigitalPassportModal() {
  const p = activePet;
  const owner = p.propietario || {};
  const activeAlerts = (p.alertas || []).filter(a => !a.estado || a.estado === 'activa');

  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">🪪 Carnet Digital de Emergencia</h3>
    
    <div class="passport-card">
      <div style="display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-bottom:0.5rem;">
        <img src="${p.foto}" style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid #00AEEF;" onerror="this.src='/static/favicon.svg'">
        <div style="text-align:left;">
          <h4 style="font-size:18px; font-weight:900; margin:0;">${escapeHtml(p.nombre)}</h4>
          <span style="font-size:12px; color:var(--text-muted);">${escapeHtml(p.especie)} • ${escapeHtml(p.raza)}</span>
        </div>
      </div>

      <!-- Pure SVG QR Code Representation -->
      <div class="passport-qr-wrap">
        <svg width="130" height="130" viewBox="0 0 25 25" style="display:block; margin:0 auto;">
          <rect width="25" height="25" fill="#ffffff"/>
          <path d="M2 2h7v7H2V2zm2 2v3h3V4H4zm6-2h1v1h-1V2zm2 0h2v1h-2V2zm3 0h1v1h-1V2zm2 0h4v7h-4V2zm2 2v3h2V4h-2zM2 11h2v1H2v-1zm3 0h1v1H5v-1zm2 0h1v1H7v-1zm4 0h1v2h-1v-2zm3 0h1v1h-1v-1zm3 0h1v2h-1v-2zm3 0h3v1h-3v-1zm-17 3h1v1H3v-1zm2 0h2v1H5v-1zm4 0h1v1H9v-1zm7 0h1v1h-1v-1zm3 0h2v1h-2v-1zm-17 2h7v7H2v-7zm2 2v3h3v-3H4zm7-2h2v1h-2v-1zm3 0h1v1h-1v-1zm3 0h2v2h-1v-1h-1v-1zm-5 2h1v1h-1v-1zm3 0h1v2h-1v-2zm-3 2h2v1h-2v-1zm4 0h2v2h-1v-1h-1v-1z" fill="#0f172a"/>
        </svg>
        <span style="font-size:10px; font-weight:800; color:var(--text-muted); display:block; margin-top:4px;">ESCANEAR FICHA MÉDICA</span>
      </div>

      <div style="text-align:left; font-size:12px; line-height:1.6; background:var(--bg-card); padding:0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-light);">
        <div>🏷️ <strong>Microchip:</strong> ${escapeHtml(p.microchip || 'No registrado')}</div>
        <div>👤 <strong>Tutor:</strong> ${escapeHtml(owner.nombre || 'Sin registrar')} (${escapeHtml(owner.telefono || 'Sin teléfono')})</div>
        <div>🏥 <strong>Clínica:</strong> ${escapeHtml(p.clinica_frecuente || 'Sin clínica asignada')}</div>
        ${activeAlerts.length > 0 ? `
          <div style="color:var(--danger); font-weight:800; margin-top:4px;">
            ⚠️ <strong>Alertas:</strong> ${activeAlerts.map(a => a.titulo).join(', ')}
          </div>
        ` : ''}
      </div>
    </div>

    <button class="btn-action-primary" style="width:100%; padding:0.75rem;" onclick="closeModal()">Cerrar Carnet</button>
  `;
  modalBackdrop.style.display = 'flex';
}

// Pet Switcher Dropdown Modal
function openPetSwitcherModal() {
  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">Mis Mascotas</h3>
    <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
      ${petsList.map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-radius:var(--radius-md); background:${p.id === activePetId ? '#e0f7fe' : 'var(--bg-surface)'}; cursor:pointer;" onclick="loadActivePet('${p.id}'); closeModal();">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${p.foto}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" onerror="this.src='/static/favicon.svg'">
            <div>
              <strong style="font-size:15px; color:${p.id === activePetId ? 'var(--secondary)' : 'var(--text-main)'};">${escapeHtml(p.nombre)}</strong>
              <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(p.especie)} • ${escapeHtml(p.raza)}</div>
            </div>
          </div>
          ${p.id === activePetId ? '<span style="color:var(--secondary); font-weight:900;">✓ Activa</span>' : ''}
        </div>
      `).join('')}
    </div>
    <button class="btn-action-primary" style="width:100%;" onclick="closeModal(); openAddPetModal();">+ Agregar Otra Mascota</button>
  `;
  modalBackdrop.style.display = 'flex';
}

// Add Pet Modal
function openAddPetModal() {
  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">Registrar Nueva Mascota</h3>
    <form onsubmit="handleCreateNewPet(event)">
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-input" id="npNombre" placeholder="Ej: Rocky" required>
        </div>
        <div class="form-group">
          <label class="form-label">Especie</label>
          <select class="form-select" id="npEspecie">
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Raza</label>
          <input type="text" class="form-input" id="npRaza" placeholder="Ej: Labrador">
        </div>
        <div class="form-group">
          <label class="form-label">Edad</label>
          <input type="text" class="form-input" id="npEdad" placeholder="Ej: 2 años">
        </div>
      </div>
      <button type="submit" class="btn-action-primary" style="width:100%; padding:0.8rem; margin-top:0.5rem;">+ Crear Ficha Clínica</button>
    </form>
  `;
  modalBackdrop.style.display = 'flex';
}

async function handleCreateNewPet(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('npNombre').value.trim(),
    especie: document.getElementById('npEspecie').value,
    raza: document.getElementById('npRaza').value.trim(),
    edad: document.getElementById('npEdad').value.trim(),
    sexo: 'Macho',
    peso_actual: '10 kg',
    propietario: { nombre: 'Tutor Sania Pet' }
  };

  try {
    const res = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const created = await res.json();
      closeModal();
      showToast(`¡Ficha de ${created.nombre} creada con éxito!`, 'success');
      await loadPets();
      await loadActivePet(created.id);
    }
  } catch (err) {
    showToast('Error al registrar: ' + err.message, 'danger');
  }
}

// Alert Action Modal
function openAlertActionModal(alertId) {
  const alertItem = (activePet.alertas || []).find(a => a.id === alertId);
  if (!alertItem) return;

  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <div style="text-align:center; margin-bottom:1rem;">
      <span style="font-size:32px;">⚠️</span>
      <h3 style="font-size:17px; font-weight:900; color:#991b1b; margin-top:0.25rem;">${escapeHtml(alertItem.titulo)}</h3>
      <p style="font-size:13px; color:var(--text-muted); margin-top:0.35rem;">${escapeHtml(alertItem.descripcion)}</p>
    </div>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <button class="btn-action-primary" style="background:#10b981;" onclick="handleAlertAction('${alertId}', 'solucionar')">
        ✓ Marcar como Solucionado
      </button>
      <button class="btn-action-primary" style="background:#f59e0b;" onclick="handleAlertAction('${alertId}', 'posponer')">
        ⏰ Posponer Alerta
      </button>
      <button class="btn-action-primary" style="background:var(--bg-surface); color:var(--text-main);" onclick="handleAlertAction('${alertId}', 'olvidar')">
        🗑️ Descartar
      </button>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

async function handleAlertAction(alertId, action) {
  try {
    const res = await fetch(`/api/alertas/${alertId}/action?action=${action}`, { method: 'POST' });
    if (res.ok) {
      closeModal();
      showToast(`Alerta ${action === 'solucionar' ? 'solucionada' : action === 'posponer' ? 'pospuesta' : 'descartada'}`, 'success');
      await loadActivePet(activePetId);
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'danger');
  }
}

// Lab Details Modal Viewer
function openLabDetailsModal(labId) {
  const lab = (activePet.laboratorios || []).find(l => l.id === labId);
  if (!lab) return;

  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">${escapeHtml(lab.examen)}</h3>
    <p style="font-size:12px; color:var(--text-light); text-align:center; margin-top:-0.75rem; margin-bottom:1rem;">
      ${escapeHtml(lab.fecha)} • ${escapeHtml(lab.laboratorio)}
    </p>

    <div style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1rem;">
      ${(lab.resultados && lab.resultados.length > 0) ? lab.resultados.map(r => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; background:var(--bg-surface); border-radius:var(--radius-sm);">
          <div>
            <strong style="font-size:13px;">${escapeHtml(r.nombre)}</strong>
            <div style="font-size:11px; color:var(--text-light);">Ref: ${escapeHtml(r.rango_referencia)}</div>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:14px;">${escapeHtml(r.resultado)} ${escapeHtml(r.unidad)}</strong>
            <div><span class="badge-tag ${r.estado === 'Normal' ? 'badge-green' : 'badge-red'}" style="font-size:9.5px;">${escapeHtml(r.estado)}</span></div>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted); font-size:13px;">Sin parámetros específicos.</p>'}
    </div>

    ${lab.notas_generales ? `
      <div style="background:var(--bg-surface); padding:0.85rem; border-radius:var(--radius-sm); font-size:12px; color:var(--text-muted); line-height:1.4; margin-bottom:0.75rem;">
        <strong>Notas:</strong> ${escapeHtml(lab.notas_generales)}
      </div>
    ` : ''}
  `;
  modalBackdrop.style.display = 'flex';
}

// Medical Image Viewer Modal
function openImageDetailsModal(imgId) {
  const img = (activePet.imagenes || []).find(i => i.ID === imgId);
  if (!img) return;

  modalCard.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <button class="sheet-close-btn" onclick="closeModal()">✕</button>
    <h3 class="sheet-title">${escapeHtml(img.nombre)}</h3>
    <p style="font-size:12px; color:var(--text-light); text-align:center; margin-top:-0.75rem; margin-bottom:1rem;">
      ${escapeHtml(img.tipo)} • ${escapeHtml(img.fecha)}
    </p>

    <div style="width:100%; height:200px; border-radius:var(--radius-md); overflow:hidden; background:#000; margin-bottom:1rem;">
      <img src="${img.imagen_url}" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='/static/favicon.svg'">
    </div>

    <div style="background:var(--bg-surface); padding:0.85rem; border-radius:var(--radius-sm); font-size:12.5px; line-height:1.4;">
      <strong>Informe Diagnóstico:</strong>
      <p style="margin-top:4px; color:var(--text-main);">${escapeHtml(img.informe)}</p>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

// Profile Save Handlers
async function handleSavePetProfile(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('pNombre').value.trim(),
    especie: document.getElementById('pEspecie').value.trim(),
    raza: document.getElementById('pRaza').value.trim(),
    edad: document.getElementById('pEdad').value.trim(),
    sexo: document.getElementById('pSexo').value.trim(),
    microchip: document.getElementById('pMicrochip').value.trim(),
    seguro: document.getElementById('pSeguro').value.trim(),
    clinica_frecuente: document.getElementById('pClinica').value.trim()
  };

  try {
    const res = await fetch(`/api/pets/${activePetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('¡Ficha médica actualizada!', 'success');
      await loadPets();
      await loadActivePet(activePetId);
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'danger');
  }
}

async function handleSaveOwnerProfile(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('oNombre').value.trim(),
    telefono: document.getElementById('oTelefono').value.trim(),
    email: document.getElementById('oEmail').value.trim()
  };

  try {
    const res = await fetch(`/api/pets/${activePetId}/propietario`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('¡Datos del tutor guardados!', 'success');
      await loadActivePet(activePetId);
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'danger');
  }
}

// Utility
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Boot Initialization
initTheme();
loadPets();
