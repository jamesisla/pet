# Sania Pet v0.1 (Estable) — Ficha Médica Veterinaria Inteligente

Aplicación monolítica ultraligera y de alto rendimiento para la gestión clínica completa de mascotas (perros, gatos, etc.), construida bajo el stack **Go 1.22+ + Fiber v2 + Web Vanilla Responsiva**. Versión estable **v0.1**.

---

## Características Principales

- **Alto Rendimiento & Mínimo Consumo**: Consume menos de **10 MB de RAM** y responde en menos de **2 milisegundos**.
- **Binario Único Autónomo**: No requiere Node.js, Python, FastAPI ni servidores Vite separados.
- **Diseño Adaptativo (Mobile & Desktop)**:
  - **Desktop**: Panel lateral completo, vista multisección, tablas enriquecidas, visor radiológico y gráfica de peso integrada.
  - **Mobile**: Barra de navegación inferior táctil, fichas interactivas y botón flotante de acción rápida (`+`).
- **Módulos Clínicos Integrados**:
  - **Identificación & Perfil**: Chip, seguro, clínica frecuente y datos del tutor/dueño.
  - **Alertas & Riesgos**: Detección de mutaciones (ej. MDR1), alergias medicamentosas y avisos de renovación.
  - **Consultas & Diagnósticos**: Historial médico de urgencias, revisiones generales y controles de especialidad.
  - **Vacunas & Inmunización**: Control de lotes, veterinarios aplicantes y fechas de revacunación.
  - **Desparasitaciones**: Tratamientos antiparasitarios internos y externos con control de dosis por peso.
  - **Medicamentos**: Tratamientos activos con posología, frecuencia y duración.
  - **Laboratorios Clínicos**: Desglose de parámetros hematológicos y bioquímicos con rangos de referencia.
  - **Imágenes Médicas**: Radiografías y ecografías con visor e informe radiológico.
  - **Curva de Peso**: Gráfico SVG reactivo sin dependencias externas.
  - **Diario de Salud**: Registro de síntomas y notas diarias de conducta.

---

## Estructura del Proyecto

```text
C:\CODE\SANV2\
├── .env.example              # Variables de configuración
├── .gitignore                # Reglas de exclusión para Git y Go
├── README.md                 # Documentación técnica
├── go.mod                    # Módulo Go ('saniv2')
├── go.sum                    # Checksums de dependencias
├── cmd/
│   └── app/
│       └── main.go           # Punto de entrada del servidor Go
├── data/
│   ├── .gitkeep              # Directorio de persistencia
│   └── pets.json             # Fichas clínicas persistidas en disco
├── internal/
│   ├── config/
│   │   └── config.go         # Carga de configuración (.env)
│   ├── handler/
│   │   ├── health.go         # Endpoint de salud /api/health
│   │   └── pet_handler.go    # Controladores REST de la ficha médica
│   ├── model/
│   │   └── pet.go            # Estructuras de datos clínicas completas
│   ├── server/
│   │   └── server.go         # Configuración del servidor Fiber y rutas
│   └── store/
│       └── store.go          # Almacén concurrente seguro en memoria + JSON
└── web/
    └── static/
        ├── favicon.svg       # Ícono oficial de Sania Pet
        ├── index.html        # Aplicación web responsiva adaptativa
        ├── style.css         # Estilos visuales modernos (Temas Claro / Oscuro)
        ├── app.js            # Lógica interactiva Vanilla JS ES6+
        └── uploads/
            └── .gitkeep      # Directorio para subida de imágenes
```

---

## Cómo Ejecutar

### 1. Iniciar en Desarrollo
```bash
go run cmd/app/main.go
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### 2. Compilar Binario de Producción
```bash
# Windows
go build -o bin/saniapet.exe cmd/app/main.go

# Linux / macOS
go build -o bin/saniapet cmd/app/main.go
```

---

## Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Aplicación Web Sania Pet |
| `GET` | `/api/health` | Estado del servidor y métricas de memoria |
| `GET` | `/api/pets` | Listado resumido de mascotas |
| `POST` | `/api/pets` | Crear nueva ficha de mascota |
| `GET` | `/api/pets/:id` | Ficha médica clínica completa |
| `PUT` | `/api/pets/:id` | Actualizar perfil de mascota |
| `DELETE` | `/api/pets/:id` | Eliminar mascota |
| `PUT` | `/api/pets/:id/propietario` | Actualizar datos del dueño |
| `POST` | `/api/pets/:id/alertas` | Crear alerta o recordatorio |
| `POST` | `/api/alertas/:alerta_id/action` | Gestionar alerta (solucionar/posponer/olvidar) |
| `POST` | `/api/pets/:id/diagnosticos` | Registrar consulta o diagnóstico |
| `PUT` | `/api/pets/:id/diagnosticos/:id` | Actualizar consulta |
| `DELETE` | `/api/pets/:id/diagnosticos/:id` | Eliminar consulta |
| `POST` | `/api/pets/:id/vacunas` | Registrar vacuna |
| `PUT` | `/api/pets/:id/vacunas/:id` | Actualizar vacuna |
| `DELETE` | `/api/pets/:id/vacunas/:id` | Eliminar vacuna |
| `POST` | `/api/pets/:id/desparasitaciones` | Registrar desparasitación |
| `PUT` | `/api/pets/:id/desparasitaciones/:id` | Actualizar desparasitación |
| `DELETE` | `/api/pets/:id/desparasitaciones/:id` | Eliminar desparasitación |
| `POST` | `/api/pets/:id/medicamentos` | Registrar medicamento |
| `PUT` | `/api/pets/:id/medicamentos/:id` | Actualizar medicamento |
| `DELETE` | `/api/pets/:id/medicamentos/:id` | Eliminar medicamento |
| `POST` | `/api/pets/:id/laboratorios` | Registrar examen de laboratorio |
| `PUT` | `/api/pets/:id/laboratorios/:id` | Actualizar examen |
| `DELETE` | `/api/pets/:id/laboratorios/:id` | Eliminar examen |
| `POST` | `/api/pets/:id/imagenes` | Registrar estudio de imagen |
| `PUT` | `/api/pets/:id/imagenes/:id` | Actualizar estudio de imagen |
| `DELETE` | `/api/pets/:id/imagenes/:id` | Eliminar estudio |
| `POST` | `/api/pets/:id/peso` | Registrar nuevo peso |
| `DELETE` | `/api/pets/:id/peso/:id` | Eliminar registro de peso |
| `POST` | `/api/pets/:id/sintomas` | Registrar entrada en diario de síntomas |
| `PUT` | `/api/pets/:id/sintomas/:id` | Actualizar entrada |
| `DELETE` | `/api/pets/:id/sintomas/:id` | Eliminar entrada |
