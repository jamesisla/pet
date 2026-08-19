package model

// Propietario representa los datos del dueño de la mascota
type Propietario struct {
	Nombre    string `json:"nombre"`
	Rut       string `json:"rut"`
	Telefono  string `json:"telefono"`
	Email     string `json:"email"`
	Direccion string `json:"direccion"`
}

// Alerta representa alertas de salud, riesgos o recordatorios
type Alerta struct {
	ID          string `json:"id"`
	Fecha       string `json:"fecha,omitempty"`
	Tipo        string `json:"tipo"` // 'critica' | 'preventiva'
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion"`
	Estado      string `json:"estado"` // 'activa' | 'pospuesta' | 'solucionada' | 'olvidada'
}

// Diagnostico representa una consulta médica o diagnóstico clínico
type Diagnostico struct {
	ID          int    `json:"id"`
	Fecha       string `json:"fecha"`
	Tipo        string `json:"tipo"`
	Descripcion string `json:"descripcion"`
	Doctor      string `json:"doctor"`
	Estado      string `json:"estado"`
	EstadoColor string `json:"estado_color,omitempty"`
	TipoColor   string `json:"tipo_color,omitempty"`
	Clinica     string `json:"clinica"`
}

// Vacuna representa el registro de inmunización
type Vacuna struct {
	ID           int    `json:"id"`
	Fecha        string `json:"fecha"`
	Nombre       string `json:"nombre"`
	Lote         string `json:"lote"`
	Veterinario  string `json:"veterinario"`
	ProximaFecha string `json:"proxima_fecha"`
	Estado       string `json:"estado"`
	EstadoColor  string `json:"estado_color,omitempty"`
}

// Desparasitacion representa el control antiparasitario interno y externo
type Desparasitacion struct {
	ID           int    `json:"id"`
	Fecha        string `json:"fecha"`
	Tipo         string `json:"tipo"` // 'Interna' | 'Externa'
	Producto     string `json:"producto"`
	PesoMascota  string `json:"peso_mascota"`
	Dosis        string `json:"dosis"`
	ProximaFecha string `json:"proxima_fecha"`
	Veterinario  string `json:"veterinario"`
}

// Medicamento representa tratamientos y prescripciones farmacológicas
type Medicamento struct {
	ID          int    `json:"id"`
	Nombre      string `json:"nombre"`
	Dosis       string `json:"dosis"`
	Frecuencia  string `json:"frecuencia"`
	Duracion    string `json:"duracion"`
	FechaInicio string `json:"fecha_inicio"`
	Veterinario string `json:"veterinario"`
	Estado      string `json:"estado"` // 'Activo' | 'Completado'
}

// LabResult representa un parámetro individual dentro de un examen de laboratorio
type LabResult struct {
	ID              int    `json:"id"`
	Nombre          string `json:"nombre"`
	Resultado       string `json:"resultado"`
	Unidad          string `json:"unidad"`
	RangoReferencia string `json:"rango_referencia"`
	Estado          string `json:"estado"` // 'Normal' | 'Alto' | 'Bajo'
}

// Laboratorio representa un examen de laboratorio completo
type Laboratorio struct {
	ID              string      `json:"id"`
	Fecha           string      `json:"fecha"`
	Examen          string      `json:"examen"`
	Laboratorio     string      `json:"laboratorio"`
	Telefono        string      `json:"telefono"`
	SitioWeb        string      `json:"sitio_web"`
	Direccion       string      `json:"direccion"`
	Convenio        string      `json:"convenio"`
	DirectorTecnico string      `json:"director_tecnico"`
	NotasGenerales  string      `json:"notas_generales"`
	Resultados      []LabResult `json:"resultados"`
}

// ImagenMedica representa radiografías, ecografías y otros estudios imagenológicos
type ImagenMedica struct {
	ID         int    `json:"id"`
	Fecha      string `json:"fecha"`
	Tipo       string `json:"tipo"` // 'Radiografía' | 'Ecografía' | 'Tomografía'
	Nombre     string `json:"nombre"`
	Indicacion string `json:"indicacion"`
	Informe    string `json:"informe"`
	Doctor     string `json:"doctor"`
	ImagenURL  string `json:"imagen_url"`
}

// PesoRegistro representa el historial de pesaje
type PesoRegistro struct {
	ID    int     `json:"id"`
	Fecha string  `json:"fecha"`
	Peso  float64 `json:"peso"`
}

// DiarioRegistro representa una entrada en el diario de síntomas y conducta
type DiarioRegistro struct {
	ID      int    `json:"id"`
	Fecha   string `json:"fecha"`
	Sintoma string `json:"sintoma"`
	Estado  string `json:"estado"` // 'Normal' | 'Atención' | 'Grave'
	Nota    string `json:"nota"`
}

// Pet representa la ficha clínica completa de una mascota
type Pet struct {
	ID                string            `json:"id"`
	Nombre            string            `json:"nombre"`
	Especie           string            `json:"especie"`
	Raza              string            `json:"raza"`
	Edad              string            `json:"edad"`
	Sexo              string            `json:"sexo"`
	PesoActual        string            `json:"peso_actual"`
	FechaNacimiento   string            `json:"fecha_nacimiento"`
	Microchip         string            `json:"microchip"`
	Foto              string            `json:"foto"`
	Seguro            string            `json:"seguro"`
	ClinicaFrecuente  string            `json:"clinica_frecuente"`
	Propietario       Propietario       `json:"propietario"`
	Alertas           []Alerta          `json:"alertas"`
	Diagnosticos      []Diagnostico     `json:"diagnosticos"`
	Vacunas           []Vacuna          `json:"vacunas"`
	Desparasitaciones []Desparasitacion `json:"desparasitaciones"`
	Medicamentos      []Medicamento     `json:"medicamentos"`
	Laboratorios      []Laboratorio     `json:"laboratorios"`
	Imagenes          []ImagenMedica    `json:"imagenes"`
	PesoHistorial     []PesoRegistro    `json:"peso_historial"`
	Diario            []DiarioRegistro  `json:"diario"`
}

// PetSummary es una vista resumida para listados y selectores
type PetSummary struct {
	ID         string `json:"id"`
	Nombre     string `json:"nombre"`
	Especie    string `json:"especie"`
	Raza       string `json:"raza"`
	Edad       string `json:"edad"`
	PesoActual string `json:"peso_actual"`
	Foto       string `json:"foto"`
}

// --- Request DTOs ---

type PetCreateRequest struct {
	Nombre           string      `json:"nombre"`
	Especie          string      `json:"especie"`
	Raza             string      `json:"raza"`
	Edad             string      `json:"edad"`
	Sexo             string      `json:"sexo"`
	PesoActual       string      `json:"peso_actual"`
	FechaNacimiento  string      `json:"fecha_nacimiento"`
	Microchip        string      `json:"microchip"`
	Foto             string      `json:"foto"`
	Seguro           string      `json:"seguro"`
	ClinicaFrecuente string      `json:"clinica_frecuente"`
	Propietario      Propietario `json:"propietario"`
}

type PetUpdateRequest struct {
	Nombre           string `json:"nombre"`
	Especie          string `json:"especie"`
	Raza             string `json:"raza"`
	Edad             string `json:"edad"`
	Sexo             string `json:"sexo"`
	FechaNacimiento  string `json:"fecha_nacimiento"`
	Microchip        string `json:"microchip"`
	Foto             string `json:"foto"`
	Seguro           string `json:"seguro"`
	ClinicaFrecuente string `json:"clinica_frecuente"`
}

type OwnerUpdateRequest struct {
	Nombre    string `json:"nombre"`
	Rut       string `json:"rut"`
	Telefono  string `json:"telefono"`
	Email     string `json:"email"`
	Direccion string `json:"direccion"`
}

type AlertaCreateRequest struct {
	Fecha       string `json:"fecha,omitempty"`
	Tipo        string `json:"tipo"`
	Titulo      string `json:"titulo"`
	Descripcion string `json:"descripcion"`
}

type AlertaActionRequest struct {
	Action string `json:"action"` // 'posponer' | 'solucionar' | 'olvidar'
}

type DiagnosticoCreateRequest struct {
	Fecha       string `json:"fecha"`
	Tipo        string `json:"tipo"`
	TipoColor   string `json:"tipo_color,omitempty"`
	Descripcion string `json:"descripcion"`
	Doctor      string `json:"doctor"`
	Estado      string `json:"estado"`
	EstadoColor string `json:"estado_color,omitempty"`
	Clinica     string `json:"clinica"`
}

type VacunaCreateRequest struct {
	Fecha        string `json:"fecha"`
	Nombre       string `json:"nombre"`
	Lote         string `json:"lote"`
	Veterinario  string `json:"veterinario"`
	ProximaFecha string `json:"proxima_fecha"`
	Estado       string `json:"estado"`
	EstadoColor  string `json:"estado_color,omitempty"`
}

type DesparasitacionCreateRequest struct {
	Fecha        string `json:"fecha"`
	Tipo         string `json:"tipo"`
	Producto     string `json:"producto"`
	PesoMascota  string `json:"peso_mascota"`
	Dosis        string `json:"dosis"`
	ProximaFecha string `json:"proxima_fecha"`
	Veterinario  string `json:"veterinario"`
}

type MedicamentoCreateRequest struct {
	Nombre      string `json:"nombre"`
	Dosis       string `json:"dosis"`
	Frecuencia  string `json:"frecuencia"`
	Duracion    string `json:"duracion"`
	FechaInicio string `json:"fecha_inicio"`
	Veterinario string `json:"veterinario"`
	Estado      string `json:"estado"`
}

type LaboratorioCreateRequest struct {
	Fecha           string      `json:"fecha"`
	Examen          string      `json:"examen"`
	Laboratorio     string      `json:"laboratorio"`
	Telefono        string      `json:"telefono"`
	SitioWeb        string      `json:"sitio_web"`
	Direccion       string      `json:"direccion"`
	Convenio        string      `json:"convenio"`
	DirectorTecnico string      `json:"director_tecnico"`
	NotasGenerales  string      `json:"notas_generales"`
	Resultados      []LabResult `json:"resultados"`
}

type ImagenMedicaCreateRequest struct {
	Fecha      string `json:"fecha"`
	Tipo       string `json:"tipo"`
	Nombre     string `json:"nombre"`
	Indicacion string `json:"indicacion"`
	Informe    string `json:"informe"`
	Doctor     string `json:"doctor"`
	ImagenURL  string `json:"imagen_url"`
}

type PesoCreateRequest struct {
	Fecha string  `json:"fecha"`
	Peso  float64 `json:"peso"`
}

type DiarioCreateRequest struct {
	Fecha   string `json:"fecha"`
	Sintoma string `json:"sintoma"`
	Estado  string `json:"estado"`
	Nota    string `json:"nota"`
}
