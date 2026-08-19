// State
let petsList = [];
let activePetId = 'luna';
let activePet = null;
let activeTab = 'dashboard';

// DOM Elements
const petSwitcher = document.getElementById('petSwitcher');
const mainContent = document.getElementById('mainContent');
const sidebarAlertCount = document.getElementById('sidebarAlertCount');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalContent = document.getElementById('modalContent');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const addPetBtn = document.getElementById('addPetBtn');
const quickAddBtn = document.getElementById('quickAddBtn');
const mobileFab = document.getElementById('mobileFab');

// Theme Management
function initTheme() {
  const saved = localStorage.getItem('sania_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggleBtn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sania_theme', next);
  themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
});

// Navigation Handlers
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  renderCurrentView();
}

// API Calls
async function loadPets() {
  try {
    const res = await fetch('/api/pets');
    if (!res.ok) throw new Error('Error cargando mascotas');
    petsList = await res.json();
    if (petsList.length > 0) {
      if (!petsList.some(p => p.id === activePetId)) {
        activePetId = petsList[0].id;
      }
    }
    renderPetSwitcher();
    await loadActivePet(activePetId);
  } catch (err) {
    console.error(err);
    mainContent.innerHTML = `<div class="card"><p style="color:var(--danger)">Error al conectar con la API: ${err.message}</p></div>`;
  }
}

async function loadActivePet(petId) {
  activePetId = petId;
  renderPetSwitcher();
  try {
    const res = await fetch(`/api/pets/${petId}`);
    if (!res.ok) throw new Error('Error al obtener ficha de la mascota');
    activePet = await res.json();
    updateAlertBadges();
    renderCurrentView();
  } catch (err) {
    console.error(err);
  }
}

function updateAlertBadges() {
  if (!activePet || !activePet.alertas) return;
  const activeAlerts = activePet.alertas.filter(a => !a.estado || a.estado === 'activa');
  if (activeAlerts.length > 0) {
    sidebarAlertCount.style.display = 'inline-block';
    sidebarAlertCount.textContent = activeAlerts.length;
  } else {
    sidebarAlertCount.style.display = 'none';
  }
}

// Render Pet Switcher Pills
function renderPetSwitcher() {
  petSwitcher.innerHTML = petsList.map(p => `
    <button class="pet-pill ${p.id === activePetId ? 'active' : ''}" onclick="loadActivePet('${p.id}')">
      <img src="${p.foto}" alt="${p.nombre}" class="pet-pill-avatar" onerror="this.src='/static/favicon.svg'">
      <span>${escapeHtml(p.nombre)}</span>
    </button>
  `).join('');
}

// Render Active View
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
  const activeMeds = (p.medicamentos || []).filter(m => m.estado === 'Activo');

  mainContent.innerHTML = `
    <!-- Pet Hero Card -->
    <div class="pet-hero-card">
      <div class="pet-hero-main">
        <img src="${p.foto}" alt="${p.nombre}" class="pet-hero-img" onerror="this.src='/static/favicon.svg'">
        <div>
          <h1 class="pet-hero-name">${escapeHtml(p.nombre)}</h1>
          <div class="pet-hero-meta">
            <span class="hero-pill">${escapeHtml(p.especie)} • ${escapeHtml(p.raza)}</span>
            <span class="hero-pill">${escapeHtml(p.edad)}</span>
            <span class="hero-pill">${escapeHtml(p.sexo)}</span>
          </div>
        </div>
      </div>
      <div class="pet-hero-stats">
        <div class="hero-stat-box">
          <span class="hero-stat-label">Peso Actual</span>
          <span class="hero-stat-val">${escapeHtml(p.peso_actual || '-')}</span>
        </div>
        <div class="hero-stat-box">
          <span class="hero-stat-label">Microchip</span>
          <span class="hero-stat-val" style="font-size:1rem;">${escapeHtml(p.microchip || 'No registrado')}</span>
        </div>
      </div>
    </div>

    <!-- Active Alerts Banner -->
    ${activeAlerts.length > 0 ? `
      <div class="card" style="border-left: 5px solid var(--danger); background: var(--danger-bg);">
        <div class="card-header" style="margin-bottom:0.75rem;">
          <div class="card-header-title" style="color:var(--danger);">
            <span>🚨</span>
            <span>Alertas y Riesgos Activos (${activeAlerts.length})</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="switchTab('alertas')">Ver todas</button>
        </div>
        <div>
          ${activeAlerts.map(a => `
            <div class="alert-card ${a.tipo}" onclick="openAlertActionModal('${a.id}')">
              <div class="alert-icon">${a.tipo === 'critica' ? '⚠️' : '🔔'}</div>
              <div class="alert-body">
                <h4>${escapeHtml(a.titulo)}</h4>
                <p>${escapeHtml(a.descripcion)}</p>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">👉 Clic para gestionar (Solucionar / Posponer)</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Quick Stats Grid -->
    <div class="grid-2">
      <!-- Próximas Inmunizaciones -->
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <span>💉</span>
            <span>Inmunización & Vacunas</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="switchTab('vacunas')">Gestionar</button>
        </div>
        <div>
          ${(p.vacunas && p.vacunas.length > 0) ? p.vacunas.slice(0, 3).map(v => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border-color);">
              <div>
                <strong style="font-size:0.9rem;">${escapeHtml(v.nombre)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Próxima: ${escapeHtml(v.proxima_fecha || 'N/A')}</div>
              </div>
              <span class="badge ${v.estado === 'Aplicada' ? 'badge-success' : 'badge-danger'}">${escapeHtml(v.estado)}</span>
            </div>
          `).join('') : '<p style="color:var(--text-muted); font-size:0.85rem;">Sin vacunas registradas.</p>'}
        </div>
      </div>

      <!-- Medicamentos Activos -->
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <span>💊</span>
            <span>Tratamientos Activos</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="switchTab('medicamentos')">Gestionar</button>
        </div>
        <div>
          ${activeMeds.length > 0 ? activeMeds.map(m => `
            <div style="padding:0.6rem 0; border-bottom:1px solid var(--border-color);">
              <div style="display:flex; justify-content:space-between;">
                <strong style="font-size:0.9rem;">${escapeHtml(m.nombre)}</strong>
                <span class="badge badge-success">Activo</span>
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">
                ${escapeHtml(m.dosis)} • ${escapeHtml(m.frecuencia)}
              </div>
            </div>
          `).join('') : '<p style="color:var(--text-muted); font-size:0.85rem;">Sin tratamientos activos actualmente.</p>'}
        </div>
      </div>
    </div>

    <!-- Weight Preview Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>⚖️</span>
          <span>Curva de Peso</span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="switchTab('peso')">Ver Historial Completo</button>
      </div>
      <div class="weight-chart-container">
        ${renderSVGChart(p.peso_historial)}
      </div>
    </div>
  `;
}

// 2. Consultas & Diagnosticos
function renderConsultas() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>🩺</span>
          <span>Consultas & Diagnósticos Clínicos</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('diagnostico')">+ Registrar Consulta</button>
      </div>
      <div class="grid-2">
        ${(p.diagnosticos && p.diagnosticos.length > 0) ? p.diagnosticos.map(d => `
          <div class="record-card">
            <div class="record-top">
              <span class="badge badge-info">${escapeHtml(d.tipo)}</span>
              <span class="record-date">${escapeHtml(d.fecha)}</span>
            </div>
            <div class="record-desc" style="font-weight:700; color:var(--text-main); margin-top:0.4rem;">
              ${escapeHtml(d.descripcion)}
            </div>
            <div class="record-meta">
              <span class="record-meta-item">👨‍⚕️ ${escapeHtml(d.doctor || 'Médico Veterinario')}</span>
              <span class="record-meta-item">🏥 ${escapeHtml(d.clinica || 'Hospital Veterinario')}</span>
              <span class="badge badge-success" style="margin-left:auto;">${escapeHtml(d.estado || 'Resuelto')}</span>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.5rem;">
              <button class="btn btn-outline btn-sm" onclick="openEditRecordModal('diagnostico', ${d.ID})">✏️ Editar</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('diagnostico', ${d.ID})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay consultas registradas aún.</p>'}
      </div>
    </div>
  `;
}

// 3. Vacunas
function renderVacunas() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>💉</span>
          <span>Vacunación & Inmunización</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('vacuna')">+ Registrar Vacuna</button>
      </div>
      <div class="grid-2">
        ${(p.vacunas && p.vacunas.length > 0) ? p.vacunas.map(v => `
          <div class="record-card">
            <div class="record-top">
              <strong class="record-title">${escapeHtml(v.nombre)}</strong>
              <span class="badge ${v.estado === 'Aplicada' ? 'badge-success' : 'badge-danger'}">${escapeHtml(v.estado)}</span>
            </div>
            <div class="record-meta" style="border-top:none; padding-top:0;">
              <div>📅 <strong>Aplicada:</strong> ${escapeHtml(v.fecha)}</div>
              <div>🎯 <strong>Próxima dosis:</strong> ${escapeHtml(v.proxima_fecha || 'N/A')}</div>
              <div>🏷️ <strong>Lote:</strong> ${escapeHtml(v.lote || 'N/A')}</div>
              <div>👨‍⚕️ <strong>Veterinario:</strong> ${escapeHtml(v.veterinario || 'N/A')}</div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.5rem;">
              <button class="btn btn-outline btn-sm" onclick="openEditRecordModal('vacuna', ${v.ID})">✏️ Editar</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('vacuna', ${v.ID})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay vacunas registradas.</p>'}
      </div>
    </div>
  `;
}

// 4. Desparasitaciones
function renderDesparasitaciones() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>🪱</span>
          <span>Desparasitación Interna y Externa</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('desparasitacion')">+ Registrar Desparasitación</button>
      </div>
      <div class="grid-2">
        ${(p.desparasitaciones && p.desparasitaciones.length > 0) ? p.desparasitaciones.map(d => `
          <div class="record-card">
            <div class="record-top">
              <strong class="record-title">${escapeHtml(d.producto)}</strong>
              <span class="badge badge-info">${escapeHtml(d.tipo)}</span>
            </div>
            <div class="record-meta" style="border-top:none; padding-top:0;">
              <div>📅 <strong>Fecha:</strong> ${escapeHtml(d.fecha)}</div>
              <div>🎯 <strong>Próxima:</strong> ${escapeHtml(d.proxima_fecha || 'N/A')}</div>
              <div>💊 <strong>Dosis:</strong> ${escapeHtml(d.dosis || 'N/A')} (Peso: ${escapeHtml(d.peso_mascota || '-')})</div>
              <div>👤 <strong>Aplicado por:</strong> ${escapeHtml(d.veterinario || 'N/A')}</div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.5rem;">
              <button class="btn btn-outline btn-sm" onclick="openEditRecordModal('desparasitacion', ${d.ID})">✏️ Editar</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('desparasitacion', ${d.ID})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay desparasitaciones registradas.</p>'}
      </div>
    </div>
  `;
}

// 5. Medicamentos
function renderMedicamentos() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>💊</span>
          <span>Medicamentos & Prescripciones</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('medicamento')">+ Registrar Medicamento</button>
      </div>
      <div class="grid-2">
        ${(p.medicamentos && p.medicamentos.length > 0) ? p.medicamentos.map(m => `
          <div class="record-card">
            <div class="record-top">
              <strong class="record-title">${escapeHtml(m.nombre)}</strong>
              <span class="badge ${m.estado === 'Activo' ? 'badge-success' : 'badge-info'}">${escapeHtml(m.estado)}</span>
            </div>
            <div class="record-meta" style="border-top:none; padding-top:0;">
              <div>💊 <strong>Dosis:</strong> ${escapeHtml(m.dosis)}</div>
              <div>⏰ <strong>Frecuencia:</strong> ${escapeHtml(m.frecuencia)}</div>
              <div>⏳ <strong>Duración:</strong> ${escapeHtml(m.duracion)}</div>
              <div>👨‍⚕️ <strong>Prescrito por:</strong> ${escapeHtml(m.veterinario || 'Veterinario')}</div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.5rem;">
              <button class="btn btn-outline btn-sm" onclick="openEditRecordModal('medicamento', ${m.ID})">✏️ Editar</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('medicamento', ${m.ID})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay medicamentos registrados.</p>'}
      </div>
    </div>
  `;
}

// 6. Laboratorios
function renderLaboratorios() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>🧪</span>
          <span>Exámenes de Laboratorio</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('laboratorio')">+ Registrar Examen</button>
      </div>
      <div class="grid-2">
        ${(p.laboratorios && p.laboratorios.length > 0) ? p.laboratorios.map(lab => `
          <div class="record-card" style="cursor:pointer;" onclick="openLabDetailsModal('${lab.id}')">
            <div class="record-top">
              <strong class="record-title">${escapeHtml(lab.examen)}</strong>
              <span class="record-date">${escapeHtml(lab.fecha)}</span>
            </div>
            <div class="record-desc">${escapeHtml(lab.laboratorio || 'Laboratorio Clínico')}</div>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
              ${lab.resultados ? lab.resultados.length : 0} parámetros analizados • ${escapeHtml(lab.convenio || 'Particular')}
            </p>
            <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-top:0.5rem;">
              👉 Ver resultados y desglose completo
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay exámenes de laboratorio registrados.</p>'}
      </div>
    </div>
  `;
}

// 7. Imagenes Medicas
function renderImagenes() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>🩻</span>
          <span>Imágenes Médicas (Radiografías & Ecografías)</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('imagen')">+ Registrar Estudio</button>
      </div>
      <div class="grid-2">
        ${(p.imagenes && p.imagenes.length > 0) ? p.imagenes.map(img => `
          <div class="record-card" style="cursor:pointer;" onclick="openImageDetailsModal(${img.ID})">
            <div class="record-top">
              <span class="badge badge-info">${escapeHtml(img.tipo)}</span>
              <span class="record-date">${escapeHtml(img.fecha)}</span>
            </div>
            <strong class="record-title" style="margin-top:0.35rem;">${escapeHtml(img.nombre)}</strong>
            <p class="record-desc">${escapeHtml(img.indicacion || 'Estudio de control')}</p>
            <div style="margin-top:0.5rem; height:120px; border-radius:var(--radius-sm); overflow:hidden; background:#000;">
              <img src="${img.imagen_url}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/static/favicon.svg'">
            </div>
            <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-top:0.5rem;">
              👉 Ver informe radiológico completo
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay estudios de imagen registrados.</p>'}
      </div>
    </div>
  `;
}

// 8. Diario de Salud
function renderDiario() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>📖</span>
          <span>Diario de Salud & Síntomas</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('sintoma')">+ Registrar Síntoma</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        ${(p.diario && p.diario.length > 0) ? p.diario.map(d => `
          <div class="record-card">
            <div class="record-top">
              <strong class="record-title">${escapeHtml(d.sintoma)}</strong>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="badge ${d.estado === 'Normal' ? 'badge-success' : d.estado === 'Atención' ? 'badge-warning' : 'badge-danger'}">${escapeHtml(d.estado)}</span>
                <span class="record-date">${escapeHtml(d.fecha)}</span>
              </div>
            </div>
            <p class="record-desc">${escapeHtml(d.nota || 'Sin observaciones')}</p>
            <div style="display:flex; justify-content:flex-end; gap:0.35rem; margin-top:0.35rem;">
              <button class="btn btn-outline btn-sm" onclick="openEditRecordModal('sintoma', ${d.ID})">✏️ Editar</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('sintoma', ${d.ID})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay síntomas registrados en el diario.</p>'}
      </div>
    </div>
  `;
}

// 9. Historial de Peso
function renderPeso() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>⚖️</span>
          <span>Historial de Peso & Curva de Crecimiento</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('peso')">+ Registrar Peso</button>
      </div>

      <div class="weight-chart-container" style="height:220px;">
        ${renderSVGChart(p.peso_historial)}
      </div>

      <div class="table-wrap" style="margin-top:1.5rem;">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Fecha de Pesaje</th>
              <th>Peso (kg)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${(p.peso_historial && p.peso_historial.length > 0) ? p.peso_historial.map(reg => `
              <tr>
                <td><strong>${escapeHtml(reg.fecha)}</strong></td>
                <td><span style="font-family:var(--font-mono); font-weight:800; color:var(--primary); font-size:1.05rem;">${reg.peso} kg</span></td>
                <td>
                  <button class="btn-icon-action btn-icon-danger" onclick="deleteRecord('peso', ${reg.ID})" title="Eliminar">🗑️</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Sin registros de peso.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 10. Alertas
function renderAlertas() {
  const p = activePet;
  mainContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <span>🔔</span>
          <span>Gestión de Alertas de Salud</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal('alerta')">+ Nueva Alerta</button>
      </div>
      <div>
        ${(p.alertas && p.alertas.length > 0) ? p.alertas.map(a => `
          <div class="alert-card ${a.tipo}" onclick="openAlertActionModal('${a.id}')">
            <div class="alert-icon">${a.tipo === 'critica' ? '⚠️' : '🔔'}</div>
            <div class="alert-body" style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4>${escapeHtml(a.titulo)}</h4>
                <span class="badge ${a.estado === 'solucionada' ? 'badge-success' : a.estado === 'pospuesta' ? 'badge-warning' : 'badge-danger'}">
                  ${escapeHtml(a.estado || 'Activa')}
                </span>
              </div>
              <p>${escapeHtml(a.descripcion)}</p>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">👉 Clic para cambiar estado (Solucionar / Posponer / Olvidar)</div>
            </div>
          </div>
        `).join('') : '<p style="color:var(--text-muted);">No hay alertas registradas.</p>'}
      </div>
    </div>
  `;
}

// 11. Perfil & Propietario
function renderPerfil() {
  const p = activePet;
  const owner = p.propietario || {};
  mainContent.innerHTML = `
    <div class="grid-2">
      <!-- Pet Profile -->
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <span>🐾</span>
            <span>Identificación de la Mascota</span>
          </div>
        </div>
        <form id="petProfileForm" onsubmit="handleUpdatePetProfile(event)">
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
              <label class="form-label">Fecha Nacimiento</label>
              <input type="text" class="form-input" id="pFechaNac" value="${escapeHtml(p.fecha_nacimiento || '')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Microchip</label>
            <input type="text" class="form-input" id="pMicrochip" value="${escapeHtml(p.microchip || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Seguro Veterinario</label>
            <input type="text" class="form-input" id="pSeguro" value="${escapeHtml(p.seguro || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Clínica Frecuente</label>
            <input type="text" class="form-input" id="pClinica" value="${escapeHtml(p.clinica_frecuente || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">URL Foto</label>
            <input type="text" class="form-input" id="pFoto" value="${escapeHtml(p.foto || '')}">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Guardar Datos Mascota</button>
        </form>
      </div>

      <!-- Owner Profile -->
      <div class="card">
        <div class="card-header">
          <div class="card-header-title">
            <span>👤</span>
            <span>Datos del Propietario / Tutor</span>
          </div>
        </div>
        <form id="ownerProfileForm" onsubmit="handleUpdateOwner(event)">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-input" id="oNombre" value="${escapeHtml(owner.nombre || '')}" required>
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">RUT / DNI</label>
              <input type="text" class="form-input" id="oRut" value="${escapeHtml(owner.rut || '')}">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono de Contacto</label>
              <input type="text" class="form-input" id="oTelefono" value="${escapeHtml(owner.telefono || '')}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" class="form-input" id="oEmail" value="${escapeHtml(owner.email || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Dirección / Residencia</label>
            <input type="text" class="form-input" id="oDireccion" value="${escapeHtml(owner.direccion || '')}">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Guardar Datos Propietario</button>
        </form>
      </div>
    </div>
  `;
}

// Lightweight SVG Chart Renderer
function renderSVGChart(history) {
  if (!history || history.length === 0) {
    return '<div style="color:var(--text-muted); font-size:0.85rem;">Sin datos suficientes para graficar.</div>';
  }

  const weights = history.map(h => h.peso);
  const minW = Math.min(...weights) * 0.9;
  const maxW = Math.max(...weights) * 1.1;
  const range = maxW - minW || 1;

  const width = 600;
  const height = 150;
  const padX = 40;
  const padY = 20;

  const points = history.map((item, idx) => {
    const x = padX + (idx / (history.length - 1 || 1)) * (width - padX * 2);
    const y = height - padY - ((item.peso - minW) / range) * (height - padY * 2);
    return { x, y, peso: item.peso, fecha: item.fecha };
  });

  const pathD = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length-1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

  return `
    <svg viewBox="0 0 ${width} ${height}" class="svg-chart">
      <defs>
        <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00AEEF" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#1A5AD7" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <!-- Grid line -->
      <line x1="${padX}" y1="${height-padY}" x2="${width-padX}" y2="${height-padY}" stroke="var(--border-color)" stroke-width="1" />
      <!-- Area fill -->
      <path d="${areaD}" fill="url(#gradWeight)" />
      <!-- Line path -->
      <path d="${pathD}" fill="none" stroke="#1A5AD7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Dots & Labels -->
      ${points.map(pt => `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="5" fill="#00AEEF" stroke="#ffffff" stroke-width="2" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--text-main)">${pt.peso}kg</text>
        <text x="${pt.x.toFixed(1)}" y="${height - 4}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${pt.fecha}</text>
      `).join('')}
    </svg>
  `;
}

// Modals Handling
function closeModal() {
  modalBackdrop.style.display = 'none';
  modalContent.innerHTML = '';
}

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// Quick Add Menu Modal
function openQuickAddMenu() {
  modalContent.innerHTML = `
    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
    <h3 class="modal-title">Registrar Información Clínica</h3>
    <p class="modal-subtitle">Selecciona el tipo de evento o registro médico para ${escapeHtml(activePet.nombre)}:</p>
    <div class="add-options-grid">
      <button class="add-option-btn" onclick="openAddRecordModal('diagnostico')">
        <span class="add-option-icon">🩺</span>
        <span>Consulta / Diagnóstico</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('vacuna')">
        <span class="add-option-icon">💉</span>
        <span>Vacuna</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('desparasitacion')">
        <span class="add-option-icon">🪱</span>
        <span>Desparasitación</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('medicamento')">
        <span class="add-option-icon">💊</span>
        <span>Medicamento</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('laboratorio')">
        <span class="add-option-icon">🧪</span>
        <span>Laboratorio</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('imagen')">
        <span class="add-option-icon">🩻</span>
        <span>Imagen Médica</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('sintoma')">
        <span class="add-option-icon">📖</span>
        <span>Síntoma / Diario</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('peso')">
        <span class="add-option-icon">⚖️</span>
        <span>Control de Peso</span>
      </button>
      <button class="add-option-btn" onclick="openAddRecordModal('alerta')">
        <span class="add-option-icon">🔔</span>
        <span>Alerta o Recordatorio</span>
      </button>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

quickAddBtn.addEventListener('click', openQuickAddMenu);
mobileFab.addEventListener('click', openQuickAddMenu);

// Add Pet Modal
addPetBtn.addEventListener('click', () => {
  modalContent.innerHTML = `
    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
    <h3 class="modal-title">Registrar Nueva Mascota</h3>
    <p class="modal-subtitle">Crea una ficha médica clínica independiente:</p>
    <form onsubmit="handleCreatePet(event)">
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-input" id="newPetNombre" placeholder="Ej: Rocky" required>
        </div>
        <div class="form-group">
          <label class="form-label">Especie</label>
          <select class="form-select" id="newPetEspecie">
            <option value="Perro">Perro</option>
            <option value="Gato">Gato</option>
            <option value="Conejo">Conejo</option>
            <option value="Ave">Ave</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Raza</label>
          <input type="text" class="form-input" id="newPetRaza" placeholder="Ej: Golden Retriever">
        </div>
        <div class="form-group">
          <label class="form-label">Edad</label>
          <input type="text" class="form-input" id="newPetEdad" placeholder="Ej: 2 años">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Sexo</label>
          <input type="text" class="form-input" id="newPetSexo" placeholder="Ej: Macho (Castrado)">
        </div>
        <div class="form-group">
          <label class="form-label">Peso Inicial</label>
          <input type="text" class="form-input" id="newPetPeso" placeholder="Ej: 8.5 kg">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre del Tutor/Dueño</label>
        <input type="text" class="form-input" id="newPetOwner" placeholder="Ej: María González">
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">+ Crear Ficha Médica</button>
    </form>
  `;
  modalBackdrop.style.display = 'flex';
});

async function handleCreatePet(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('newPetNombre').value.trim(),
    especie: document.getElementById('newPetEspecie').value,
    raza: document.getElementById('newPetRaza').value.trim(),
    edad: document.getElementById('newPetEdad').value.trim(),
    sexo: document.getElementById('newPetSexo').value.trim(),
    peso_actual: document.getElementById('newPetPeso').value.trim(),
    propietario: {
      nombre: document.getElementById('newPetOwner').value.trim()
    }
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
      await loadPets();
      await loadActivePet(created.id);
    }
  } catch (err) {
    alert('Error al registrar mascota: ' + err.message);
  }
}

// Add Record Modal
function openAddRecordModal(type) {
  let fieldsHTML = '';
  const now = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (type === 'diagnostico') {
    fieldsHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Consulta</label>
          <select class="form-select" id="fTipo">
            <option value="Consulta General">Consulta General</option>
            <option value="Urgencia">Urgencia</option>
            <option value="Especialidad">Especialidad</option>
            <option value="Control Sano">Control Sano</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción / Diagnóstico</label>
        <textarea class="form-textarea" id="fDesc" placeholder="Detalle clínico de la consulta..." required></textarea>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Veterinario Tratante</label>
          <input type="text" class="form-input" id="fDoctor" placeholder="Dra. Sandra Valenzuela">
        </div>
        <div class="form-group">
          <label class="form-label">Clínica</label>
          <input type="text" class="form-input" id="fClinica" placeholder="Hospital Veterinario Sania Pet">
        </div>
      </div>
    `;
  } else if (type === 'vacuna') {
    fieldsHTML = `
      <div class="form-group">
        <label class="form-label">Nombre de la Vacuna</label>
        <input type="text" class="form-input" id="fNombre" placeholder="Ej: Antirrábica, Séxtuple Canina..." required>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha de Aplicación</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Próxima Dosis / Renovación</label>
          <input type="text" class="form-input" id="fProxFecha" placeholder="DD/MM/AAAA">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Lote</label>
          <input type="text" class="form-input" id="fLote" placeholder="Lote del frasco">
        </div>
        <div class="form-group">
          <label class="form-label">Veterinario</label>
          <input type="text" class="form-input" id="fVet" placeholder="Nombre profesional">
        </div>
      </div>
    `;
  } else if (type === 'desparasitacion') {
    fieldsHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select class="form-select" id="fTipo">
            <option value="Externa">Externa (Pulgas/Garrapatas)</option>
            <option value="Interna">Interna (Lombrices/Gastrointestinal)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Producto / Fármaco</label>
          <input type="text" class="form-input" id="fProducto" placeholder="Ej: NexGard, Bravecto, Drontal..." required>
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
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Dosis</label>
          <input type="text" class="form-input" id="fDosis" placeholder="1 tableta, pipeta...">
        </div>
        <div class="form-group">
          <label class="form-label">Peso Mascota</label>
          <input type="text" class="form-input" id="fPeso" value="${activePet.peso_actual || ''}">
        </div>
      </div>
    `;
  } else if (type === 'medicamento') {
    fieldsHTML = `
      <div class="form-group">
        <label class="form-label">Nombre del Medicamento</label>
        <input type="text" class="form-input" id="fNombre" placeholder="Ej: Prednisona 5mg, Amoxicilina..." required>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Dosis</label>
          <input type="text" class="form-input" id="fDosis" placeholder="Ej: 1 comprimido, 5ml..." required>
        </div>
        <div class="form-group">
          <label class="form-label">Frecuencia</label>
          <input type="text" class="form-input" id="fFrec" placeholder="Ej: Cada 12 horas" required>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Duración</label>
          <input type="text" class="form-input" id="fDuracion" placeholder="Ej: 7 días, Permanente">
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select class="form-select" id="fEstado">
            <option value="Activo">Activo</option>
            <option value="Completado">Completado</option>
          </select>
        </div>
      </div>
    `;
  } else if (type === 'sintoma') {
    fieldsHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Estado / Gravedad</label>
          <select class="form-select" id="fEstado">
            <option value="Normal">Normal</option>
            <option value="Atención">Atención</option>
            <option value="Grave">Grave</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Síntoma o Conducta</label>
        <input type="text" class="form-input" id="fSintoma" placeholder="Ej: Apetito disminuido, tos, vómito..." required>
      </div>
      <div class="form-group">
        <label class="form-label">Observaciones / Notas</label>
        <textarea class="form-textarea" id="fNota" placeholder="Detalles de lo observado..."></textarea>
      </div>
    `;
  } else if (type === 'peso') {
    fieldsHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Peso (kg)</label>
          <input type="number" step="0.1" class="form-input" id="fPesoNum" placeholder="Ej: 12.5" required>
        </div>
      </div>
    `;
  } else if (type === 'alerta') {
    fieldsHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Tipo de Alerta</label>
          <select class="form-select" id="fTipo">
            <option value="critica">Alerta Crítica / Alergia Severa</option>
            <option value="preventiva">Recordatorio Preventivo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Título de la Alerta</label>
        <input type="text" class="form-input" id="fTitulo" placeholder="Ej: ALERGIA A LA IVERMECTINA" required>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-textarea" id="fDesc" placeholder="Instrucciones o advertencias..." required></textarea>
      </div>
    `;
  } else if (type === 'laboratorio') {
    fieldsHTML = `
      <div class="form-group">
        <label class="form-label">Nombre del Examen</label>
        <input type="text" class="form-input" id="fExamen" placeholder="Ej: Hemograma Completo, Perfil Renal..." required>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Laboratorio</label>
          <input type="text" class="form-input" id="fLab" placeholder="Veterinary Diagnostics Lab">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notas Generales / Interpretación</label>
        <textarea class="form-textarea" id="fNotas" placeholder="Resumen de resultados del patólogo..."></textarea>
      </div>
    `;
  } else if (type === 'imagen') {
    fieldsHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">Tipo de Estudio</label>
          <select class="form-select" id="fTipo">
            <option value="Radiografía">Radiografía</option>
            <option value="Ecografía">Ecografía</option>
            <option value="Tomografía">Tomografía</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="text" class="form-input" id="fFecha" value="${now}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nombre del Estudio</label>
        <input type="text" class="form-input" id="fNombre" placeholder="Ej: Radiografía de Abdomen Lateral" required>
      </div>
      <div class="form-group">
        <label class="form-label">Informe Radiológico</label>
        <textarea class="form-textarea" id="fInforme" placeholder="Conclusiones diagnósticas..." required></textarea>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
    <h3 class="modal-title">Agregar Registro: ${type.toUpperCase()}</h3>
    <form onsubmit="handleSaveRecord(event, '${type}')">
      ${fieldsHTML}
      <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">+ Guardar Registro</button>
    </form>
  `;
  modalBackdrop.style.display = 'flex';
}

async function handleSaveRecord(e, type) {
  e.preventDefault();
  let url = `/api/pets/${activePetId}/`;
  let payload = {};

  if (type === 'diagnostico') {
    url += 'diagnosticos';
    payload = {
      fecha: document.getElementById('fFecha').value,
      tipo: document.getElementById('fTipo').value,
      descripcion: document.getElementById('fDesc').value,
      doctor: document.getElementById('fDoctor').value,
      clinica: document.getElementById('fClinica').value,
      estado: 'Resuelto'
    };
  } else if (type === 'vacuna') {
    url += 'vacunas';
    payload = {
      nombre: document.getElementById('fNombre').value,
      fecha: document.getElementById('fFecha').value,
      proxima_fecha: document.getElementById('fProxFecha').value,
      lote: document.getElementById('fLote').value,
      veterinario: document.getElementById('fVet').value,
      estado: 'Aplicada'
    };
  } else if (type === 'desparasitacion') {
    url += 'desparasitaciones';
    payload = {
      tipo: document.getElementById('fTipo').value,
      producto: document.getElementById('fProducto').value,
      fecha: document.getElementById('fFecha').value,
      proxima_fecha: document.getElementById('fProxFecha').value,
      dosis: document.getElementById('fDosis').value,
      peso_mascota: document.getElementById('fPeso').value
    };
  } else if (type === 'medicamento') {
    url += 'medicamentos';
    payload = {
      nombre: document.getElementById('fNombre').value,
      dosis: document.getElementById('fDosis').value,
      frecuencia: document.getElementById('fFrec').value,
      duracion: document.getElementById('fDuracion').value,
      estado: document.getElementById('fEstado').value
    };
  } else if (type === 'sintoma') {
    url += 'sintomas';
    payload = {
      fecha: document.getElementById('fFecha').value,
      sintoma: document.getElementById('fSintoma').value,
      estado: document.getElementById('fEstado').value,
      nota: document.getElementById('fNota').value
    };
  } else if (type === 'peso') {
    url += 'peso';
    payload = {
      fecha: document.getElementById('fFecha').value,
      peso: parseFloat(document.getElementById('fPesoNum').value)
    };
  } else if (type === 'alerta') {
    url += 'alertas';
    payload = {
      tipo: document.getElementById('fTipo').value,
      fecha: document.getElementById('fFecha').value,
      titulo: document.getElementById('fTitulo').value.toUpperCase(),
      descripcion: document.getElementById('fDesc').value
    };
  } else if (type === 'laboratorio') {
    url += 'laboratorios';
    payload = {
      examen: document.getElementById('fExamen').value,
      fecha: document.getElementById('fFecha').value,
      laboratorio: document.getElementById('fLab').value,
      notas_generales: document.getElementById('fNotas').value
    };
  } else if (type === 'imagen') {
    url += 'imagenes';
    payload = {
      tipo: document.getElementById('fTipo').value,
      nombre: document.getElementById('fNombre').value,
      fecha: document.getElementById('fFecha').value,
      informe: document.getElementById('fInforme').value,
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
      await loadActivePet(activePetId);
    }
  } catch (err) {
    alert('Error al guardar: ' + err.message);
  }
}

// Delete Record Generic
async function deleteRecord(type, id) {
  if (!confirm('¿Estás seguro de eliminar este registro?')) return;
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
      await loadActivePet(activePetId);
    }
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

// Alert Action Modal
function openAlertActionModal(alertId) {
  const alertItem = (activePet.alertas || []).find(a => a.id === alertId);
  if (!alertItem) return;

  modalContent.innerHTML = `
    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
    <div style="display:flex; align-items:center; gap:0.5rem; color:var(--danger); margin-bottom:0.5rem;">
      <span style="font-size:1.5rem;">⚠️</span>
      <h3 class="modal-title" style="margin:0;">${escapeHtml(alertItem.titulo)}</h3>
    </div>
    <p style="background:var(--bg-surface); padding:1rem; border-radius:var(--radius-md); font-size:0.875rem; color:var(--text-main); margin-bottom:1.5rem;">
      ${escapeHtml(alertItem.descripcion)}
    </p>
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <button class="btn btn-primary" onclick="handleAlertAction('${alertId}', 'solucionar')">
        ✅ Marcar como Solucionado
      </button>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
        <button class="btn btn-outline" onclick="handleAlertAction('${alertId}', 'posponer')">
          ⏰ Posponer
        </button>
        <button class="btn btn-outline" style="color:var(--danger);" onclick="handleAlertAction('${alertId}', 'olvidar')">
          🗑️ Descartar
        </button>
      </div>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

async function handleAlertAction(alertId, action) {
  try {
    const res = await fetch(`/api/alertas/${alertId}/action?action=${action}`, { method: 'POST' });
    if (res.ok) {
      closeModal();
      await loadActivePet(activePetId);
    }
  } catch (err) {
    console.error(err);
  }
}

// Lab Details Modal Viewer
function openLabDetailsModal(labId) {
  const lab = (activePet.laboratorios || []).find(l => l.id === labId);
  if (!lab) return;

  modalContent.innerHTML = `
    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
    <h3 class="modal-title">${escapeHtml(lab.examen)}</h3>
    <p class="modal-subtitle">Fecha: ${escapeHtml(lab.fecha)} • ${escapeHtml(lab.laboratorio)}</p>
    
    <div class="table-wrap" style="margin-bottom:1.25rem;">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Parámetro</th>
            <th>Resultado</th>
            <th>Rango Ref.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${(lab.resultados && lab.resultados.length > 0) ? lab.resultados.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.nombre)}</strong></td>
              <td><span style="font-family:var(--font-mono); font-weight:800;">${escapeHtml(r.resultado)} ${escapeHtml(r.unidad)}</span></td>
              <td style="color:var(--text-muted); font-size:0.8rem;">${escapeHtml(r.rango_referencia)}</td>
              <td>
                <span class="badge ${r.estado === 'Normal' ? 'badge-success' : 'badge-danger'}">${escapeHtml(r.estado)}</span>
              </td>
            </tr>
          `).join('') : '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Sin parámetros específicos cargados.</td></tr>'}
        </tbody>
      </table>
    </div>

    ${lab.notas_generales ? `
      <div style="background:var(--bg-surface); padding:1rem; border-radius:var(--radius-md); font-size:0.85rem;">
        <strong>Notas del Patólogo:</strong>
        <p style="margin-top:0.35rem; color:var(--text-muted);">${escapeHtml(lab.notas_generales)}</p>
      </div>
    ` : ''}
    <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
      <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('laboratorio', '${lab.id}')">🗑️ Eliminar Examen</button>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

// Medical Image Viewer Modal
function openImageDetailsModal(imgId) {
  const img = (activePet.imagenes || []).find(i => i.ID === imgId);
  if (!img) return;

  modalContent.innerHTML = `
    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
    <h3 class="modal-title">${escapeHtml(img.nombre)}</h3>
    <p class="modal-subtitle">Estudio: ${escapeHtml(img.tipo)} • Fecha: ${escapeHtml(img.fecha)}</p>
    
    <div style="width:100%; max-height:260px; border-radius:var(--radius-md); overflow:hidden; margin-bottom:1rem; background:#000;">
      <img src="${img.imagen_url}" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='/static/favicon.svg'">
    </div>

    <div style="background:var(--bg-surface); padding:1rem; border-radius:var(--radius-md); font-size:0.875rem; line-height:1.6;">
      <strong>Informe Diagnóstico:</strong>
      <p style="margin-top:0.35rem; color:var(--text-main);">${escapeHtml(img.informe)}</p>
      <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-muted);">
        👨‍⚕️ <strong>Médico Radiólogo:</strong> ${escapeHtml(img.doctor || 'Especialista')}
      </div>
    </div>
    <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
      <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="deleteRecord('imagen', ${img.ID})">🗑️ Eliminar Estudio</button>
    </div>
  `;
  modalBackdrop.style.display = 'flex';
}

// Update Profile Form Handlers
async function handleUpdatePetProfile(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('pNombre').value.trim(),
    especie: document.getElementById('pEspecie').value.trim(),
    raza: document.getElementById('pRaza').value.trim(),
    edad: document.getElementById('pEdad').value.trim(),
    sexo: document.getElementById('pSexo').value.trim(),
    fecha_nacimiento: document.getElementById('pFechaNac').value.trim(),
    microchip: document.getElementById('pMicrochip').value.trim(),
    seguro: document.getElementById('pSeguro').value.trim(),
    clinica_frecuente: document.getElementById('pClinica').value.trim(),
    foto: document.getElementById('pFoto').value.trim()
  };

  try {
    const res = await fetch(`/api/pets/${activePetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('¡Perfil de la mascota actualizado!');
      await loadPets();
      await loadActivePet(activePetId);
    }
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

async function handleUpdateOwner(e) {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('oNombre').value.trim(),
    rut: document.getElementById('oRut').value.trim(),
    telefono: document.getElementById('oTelefono').value.trim(),
    email: document.getElementById('oEmail').value.trim(),
    direccion: document.getElementById('oDireccion').value.trim()
  };

  try {
    const res = await fetch(`/api/pets/${activePetId}/propietario`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('¡Datos del propietario actualizados!');
      await loadActivePet(activePetId);
    }
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

// Utility
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initialize
initTheme();
setupNavigation();
loadPets();
