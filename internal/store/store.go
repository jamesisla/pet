package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"saniv2/internal/model"
)

type PetStore struct {
	mu       sync.RWMutex
	filePath string
	pets     map[string]model.Pet
}

func New(dataDir string) (*PetStore, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	fp := filepath.Join(dataDir, "pets.json")
	s := &PetStore{
		filePath: fp,
		pets:     make(map[string]model.Pet),
	}

	if err := s.loadOrSeed(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *PetStore) loadOrSeed() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, err := os.Stat(s.filePath); err == nil {
		data, err := os.ReadFile(s.filePath)
		if err == nil && len(data) > 0 {
			var list []model.Pet
			if err := json.Unmarshal(data, &list); err == nil && len(list) > 0 {
				for _, pet := range list {
					s.pets[pet.ID] = pet
				}
				return nil
			}
		}
	}

	s.pets = defaultPetsSeed()
	return s.saveUnsafe()
}

func (s *PetStore) saveUnsafe() error {
	list := make([]model.Pet, 0, len(s.pets))
	for _, pet := range s.pets {
		list = append(list, pet)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	tmpFile := s.filePath + ".tmp"
	if err := os.WriteFile(tmpFile, data, 0644); err != nil {
		return err
	}

	return os.Rename(tmpFile, s.filePath)
}

// GetAllSummary returns a list of summary cards for all pets
func (s *PetStore) GetAllSummary() []model.PetSummary {
	s.mu.RLock()
	defer s.mu.RUnlock()

	summaries := make([]model.PetSummary, 0, len(s.pets))
	for _, p := range s.pets {
		summaries = append(summaries, model.PetSummary{
			ID:         p.ID,
			Nombre:     p.Nombre,
			Especie:    p.Especie,
			Raza:       p.Raza,
			Edad:       p.Edad,
			PesoActual: p.PesoActual,
			Foto:       p.Foto,
		})
	}
	return summaries
}

// GetByID returns the full medical record of a pet
func (s *PetStore) GetByID(id string) (model.Pet, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, ok := s.pets[id]
	return p, ok
}

// CreatePet adds a new pet to the database
func (s *PetStore) CreatePet(req model.PetCreateRequest) (model.Pet, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("pet_%d", time.Now().UnixNano()%1000000)
	foto := req.Foto
	if foto == "" {
		if req.Especie == "Gato" {
			foto = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300"
		} else {
			foto = "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=300&h=300"
		}
	}

	pet := model.Pet{
		ID:                id,
		Nombre:            req.Nombre,
		Especie:           req.Especie,
		Raza:              req.Raza,
		Edad:              req.Edad,
		Sexo:              req.Sexo,
		PesoActual:        req.PesoActual,
		FechaNacimiento:   req.FechaNacimiento,
		Microchip:         req.Microchip,
		Foto:              foto,
		Seguro:            req.Seguro,
		ClinicaFrecuente:  req.ClinicaFrecuente,
		Propietario:       req.Propietario,
		Alertas:           make([]model.Alerta, 0),
		Diagnosticos:      make([]model.Diagnostico, 0),
		Vacunas:           make([]model.Vacuna, 0),
		Desparasitaciones: make([]model.Desparasitacion, 0),
		Medicamentos:      make([]model.Medicamento, 0),
		Laboratorios:      make([]model.Laboratorio, 0),
		Imagenes:          make([]model.ImagenMedica, 0),
		PesoHistorial:     make([]model.PesoRegistro, 0),
		Diario:            make([]model.DiarioRegistro, 0),
	}

	s.pets[id] = pet
	if err := s.saveUnsafe(); err != nil {
		return pet, err
	}

	return pet, nil
}

// UpdatePet updates general pet attributes
func (s *PetStore) UpdatePet(id string, req model.PetUpdateRequest) (model.Pet, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[id]
	if !ok {
		return pet, false, nil
	}

	pet.Nombre = req.Nombre
	pet.Especie = req.Especie
	pet.Raza = req.Raza
	pet.Edad = req.Edad
	pet.Sexo = req.Sexo
	pet.FechaNacimiento = req.FechaNacimiento
	pet.Microchip = req.Microchip
	if req.Foto != "" {
		pet.Foto = req.Foto
	}
	pet.Seguro = req.Seguro
	pet.ClinicaFrecuente = req.ClinicaFrecuente

	s.pets[id] = pet
	if err := s.saveUnsafe(); err != nil {
		return pet, true, err
	}

	return pet, true, nil
}

// DeletePet removes a pet
func (s *PetStore) DeletePet(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.pets[id]; !ok {
		return false
	}

	delete(s.pets, id)
	_ = s.saveUnsafe()
	return true
}

// UpdateOwner updates owner details
func (s *PetStore) UpdateOwner(petID string, req model.OwnerUpdateRequest) (model.Propietario, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Propietario{}, false, nil
	}

	pet.Propietario = model.Propietario{
		Nombre:    req.Nombre,
		Rut:       req.Rut,
		Telefono:  req.Telefono,
		Email:     req.Email,
		Direccion: req.Direccion,
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return pet.Propietario, true, err
	}

	return pet.Propietario, true, nil
}

// --- Alertas ---

func (s *PetStore) AddAlerta(petID string, req model.AlertaCreateRequest) (model.Alerta, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Alerta{}, false, nil
	}

	alerta := model.Alerta{
		ID:          fmt.Sprintf("al_%d", time.Now().UnixNano()%1000000),
		Fecha:       req.Fecha,
		Tipo:        req.Tipo,
		Titulo:      req.Titulo,
		Descripcion: req.Descripcion,
		Estado:      "activa",
	}

	pet.Alertas = append([]model.Alerta{alerta}, pet.Alertas...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return alerta, true, err
	}

	return alerta, true, nil
}

func (s *PetStore) ActionAlerta(petID, alertaID, action string) (model.Alerta, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// If petID is given, search in that pet; otherwise search in all pets
	for pID, pet := range s.pets {
		if petID != "" && pID != petID {
			continue
		}
		for i, a := range pet.Alertas {
			if a.ID == alertaID {
				switch action {
				case "posponer":
					pet.Alertas[i].Estado = "pospuesta"
				case "solucionar":
					pet.Alertas[i].Estado = "solucionada"
				case "olvidar":
					pet.Alertas[i].Estado = "olvidada"
				default:
					pet.Alertas[i].Estado = action
				}
				updatedAlert := pet.Alertas[i]
				s.pets[pID] = pet
				if err := s.saveUnsafe(); err != nil {
					return updatedAlert, true, err
				}
				return updatedAlert, true, nil
			}
		}
	}
	return model.Alerta{}, false, nil
}

// --- Diagnosticos / Consultas ---

func (s *PetStore) AddDiagnostico(petID string, req model.DiagnosticoCreateRequest) (model.Diagnostico, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Diagnostico{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	diag := model.Diagnostico{
		ID:          id,
		Fecha:       req.Fecha,
		Tipo:        req.Tipo,
		TipoColor:   req.TipoColor,
		Descripcion: req.Descripcion,
		Doctor:      req.Doctor,
		Estado:      req.Estado,
		EstadoColor: req.EstadoColor,
		Clinica:     req.Clinica,
	}

	pet.Diagnosticos = append([]model.Diagnostico{diag}, pet.Diagnosticos...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return diag, true, err
	}

	return diag, true, nil
}

func (s *PetStore) UpdateDiagnostico(petID string, id int, req model.DiagnosticoCreateRequest) (model.Diagnostico, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Diagnostico{}, false, nil
	}

	found := false
	var updated model.Diagnostico
	for i, d := range pet.Diagnosticos {
		if d.ID == id {
			pet.Diagnosticos[i].Fecha = req.Fecha
			pet.Diagnosticos[i].Tipo = req.Tipo
			pet.Diagnosticos[i].TipoColor = req.TipoColor
			pet.Diagnosticos[i].Descripcion = req.Descripcion
			pet.Diagnosticos[i].Doctor = req.Doctor
			pet.Diagnosticos[i].Estado = req.Estado
			pet.Diagnosticos[i].EstadoColor = req.EstadoColor
			pet.Diagnosticos[i].Clinica = req.Clinica
			updated = pet.Diagnosticos[i]
			found = true
			break
		}
	}

	if !found {
		return model.Diagnostico{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteDiagnostico(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.Diagnostico, 0, len(pet.Diagnosticos))
	deleted := false
	for _, d := range pet.Diagnosticos {
		if d.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, d)
	}

	if !deleted {
		return false
	}

	pet.Diagnosticos = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Vacunas ---

func (s *PetStore) AddVacuna(petID string, req model.VacunaCreateRequest) (model.Vacuna, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Vacuna{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	vac := model.Vacuna{
		ID:           id,
		Fecha:        req.Fecha,
		Nombre:       req.Nombre,
		Lote:         req.Lote,
		Veterinario:  req.Veterinario,
		ProximaFecha: req.ProximaFecha,
		Estado:       req.Estado,
		EstadoColor:  req.EstadoColor,
	}

	pet.Vacunas = append([]model.Vacuna{vac}, pet.Vacunas...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return vac, true, err
	}

	return vac, true, nil
}

func (s *PetStore) UpdateVacuna(petID string, id int, req model.VacunaCreateRequest) (model.Vacuna, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Vacuna{}, false, nil
	}

	found := false
	var updated model.Vacuna
	for i, v := range pet.Vacunas {
		if v.ID == id {
			pet.Vacunas[i].Fecha = req.Fecha
			pet.Vacunas[i].Nombre = req.Nombre
			pet.Vacunas[i].Lote = req.Lote
			pet.Vacunas[i].Veterinario = req.Veterinario
			pet.Vacunas[i].ProximaFecha = req.ProximaFecha
			pet.Vacunas[i].Estado = req.Estado
			pet.Vacunas[i].EstadoColor = req.EstadoColor
			updated = pet.Vacunas[i]
			found = true
			break
		}
	}

	if !found {
		return model.Vacuna{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteVacuna(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.Vacuna, 0, len(pet.Vacunas))
	deleted := false
	for _, v := range pet.Vacunas {
		if v.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, v)
	}

	if !deleted {
		return false
	}

	pet.Vacunas = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Desparasitaciones ---

func (s *PetStore) AddDesparasitacion(petID string, req model.DesparasitacionCreateRequest) (model.Desparasitacion, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Desparasitacion{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	desp := model.Desparasitacion{
		ID:           id,
		Fecha:        req.Fecha,
		Tipo:         req.Tipo,
		Producto:     req.Producto,
		PesoMascota:  req.PesoMascota,
		Dosis:        req.Dosis,
		ProximaFecha: req.ProximaFecha,
		Veterinario:  req.Veterinario,
	}

	pet.Desparasitaciones = append([]model.Desparasitacion{desp}, pet.Desparasitaciones...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return desp, true, err
	}

	return desp, true, nil
}

func (s *PetStore) UpdateDesparasitacion(petID string, id int, req model.DesparasitacionCreateRequest) (model.Desparasitacion, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Desparasitacion{}, false, nil
	}

	found := false
	var updated model.Desparasitacion
	for i, d := range pet.Desparasitaciones {
		if d.ID == id {
			pet.Desparasitaciones[i].Fecha = req.Fecha
			pet.Desparasitaciones[i].Tipo = req.Tipo
			pet.Desparasitaciones[i].Producto = req.Producto
			pet.Desparasitaciones[i].PesoMascota = req.PesoMascota
			pet.Desparasitaciones[i].Dosis = req.Dosis
			pet.Desparasitaciones[i].ProximaFecha = req.ProximaFecha
			pet.Desparasitaciones[i].Veterinario = req.Veterinario
			updated = pet.Desparasitaciones[i]
			found = true
			break
		}
	}

	if !found {
		return model.Desparasitacion{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteDesparasitacion(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.Desparasitacion, 0, len(pet.Desparasitaciones))
	deleted := false
	for _, d := range pet.Desparasitaciones {
		if d.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, d)
	}

	if !deleted {
		return false
	}

	pet.Desparasitaciones = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Medicamentos ---

func (s *PetStore) AddMedicamento(petID string, req model.MedicamentoCreateRequest) (model.Medicamento, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Medicamento{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	med := model.Medicamento{
		ID:          id,
		Nombre:      req.Nombre,
		Dosis:       req.Dosis,
		Frecuencia:  req.Frecuencia,
		Duracion:    req.Duracion,
		FechaInicio: req.FechaInicio,
		Veterinario: req.Veterinario,
		Estado:      req.Estado,
	}

	pet.Medicamentos = append([]model.Medicamento{med}, pet.Medicamentos...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return med, true, err
	}

	return med, true, nil
}

func (s *PetStore) UpdateMedicamento(petID string, id int, req model.MedicamentoCreateRequest) (model.Medicamento, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Medicamento{}, false, nil
	}

	found := false
	var updated model.Medicamento
	for i, m := range pet.Medicamentos {
		if m.ID == id {
			pet.Medicamentos[i].Nombre = req.Nombre
			pet.Medicamentos[i].Dosis = req.Dosis
			pet.Medicamentos[i].Frecuencia = req.Frecuencia
			pet.Medicamentos[i].Duracion = req.Duracion
			pet.Medicamentos[i].FechaInicio = req.FechaInicio
			pet.Medicamentos[i].Veterinario = req.Veterinario
			pet.Medicamentos[i].Estado = req.Estado
			updated = pet.Medicamentos[i]
			found = true
			break
		}
	}

	if !found {
		return model.Medicamento{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteMedicamento(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.Medicamento, 0, len(pet.Medicamentos))
	deleted := false
	for _, m := range pet.Medicamentos {
		if m.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, m)
	}

	if !deleted {
		return false
	}

	pet.Medicamentos = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Laboratorios ---

func (s *PetStore) AddLaboratorio(petID string, req model.LaboratorioCreateRequest) (model.Laboratorio, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Laboratorio{}, false, nil
	}

	id := fmt.Sprintf("%d-%02d-%03d", time.Now().Year(), time.Now().Month(), time.Now().UnixNano()%1000)
	results := req.Resultados
	if results == nil {
		results = make([]model.LabResult, 0)
	}

	lab := model.Laboratorio{
		ID:              id,
		Fecha:           req.Fecha,
		Examen:          req.Examen,
		Laboratorio:     req.Laboratorio,
		Telefono:        req.Telefono,
		SitioWeb:        req.SitioWeb,
		Direccion:       req.Direccion,
		Convenio:        req.Convenio,
		DirectorTecnico: req.DirectorTecnico,
		NotasGenerales:  req.NotasGenerales,
		Resultados:      results,
	}

	pet.Laboratorios = append([]model.Laboratorio{lab}, pet.Laboratorios...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return lab, true, err
	}

	return lab, true, nil
}

func (s *PetStore) UpdateLaboratorio(petID string, id string, req model.LaboratorioCreateRequest) (model.Laboratorio, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.Laboratorio{}, false, nil
	}

	found := false
	var updated model.Laboratorio
	for i, l := range pet.Laboratorios {
		if l.ID == id {
			pet.Laboratorios[i].Fecha = req.Fecha
			pet.Laboratorios[i].Examen = req.Examen
			pet.Laboratorios[i].Laboratorio = req.Laboratorio
			pet.Laboratorios[i].Telefono = req.Telefono
			pet.Laboratorios[i].SitioWeb = req.SitioWeb
			pet.Laboratorios[i].Direccion = req.Direccion
			pet.Laboratorios[i].Convenio = req.Convenio
			pet.Laboratorios[i].DirectorTecnico = req.DirectorTecnico
			pet.Laboratorios[i].NotasGenerales = req.NotasGenerales
			if req.Resultados != nil {
				pet.Laboratorios[i].Resultados = req.Resultados
			}
			updated = pet.Laboratorios[i]
			found = true
			break
		}
	}

	if !found {
		return model.Laboratorio{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteLaboratorio(petID string, id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.Laboratorio, 0, len(pet.Laboratorios))
	deleted := false
	for _, l := range pet.Laboratorios {
		if l.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, l)
	}

	if !deleted {
		return false
	}

	pet.Laboratorios = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Imagenes Medicas ---

func (s *PetStore) AddImagenMedica(petID string, req model.ImagenMedicaCreateRequest) (model.ImagenMedica, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.ImagenMedica{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	imgURL := req.ImagenURL
	if imgURL == "" {
		imgURL = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300"
	}

	img := model.ImagenMedica{
		ID:         id,
		Fecha:      req.Fecha,
		Tipo:       req.Tipo,
		Nombre:     req.Nombre,
		Indicacion: req.Indicacion,
		Informe:    req.Informe,
		Doctor:     req.Doctor,
		ImagenURL:  imgURL,
	}

	pet.Imagenes = append([]model.ImagenMedica{img}, pet.Imagenes...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return img, true, err
	}

	return img, true, nil
}

func (s *PetStore) UpdateImagenMedica(petID string, id int, req model.ImagenMedicaCreateRequest) (model.ImagenMedica, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.ImagenMedica{}, false, nil
	}

	found := false
	var updated model.ImagenMedica
	for i, img := range pet.Imagenes {
		if img.ID == id {
			pet.Imagenes[i].Fecha = req.Fecha
			pet.Imagenes[i].Tipo = req.Tipo
			pet.Imagenes[i].Nombre = req.Nombre
			pet.Imagenes[i].Indicacion = req.Indicacion
			pet.Imagenes[i].Informe = req.Informe
			pet.Imagenes[i].Doctor = req.Doctor
			if req.ImagenURL != "" {
				pet.Imagenes[i].ImagenURL = req.ImagenURL
			}
			updated = pet.Imagenes[i]
			found = true
			break
		}
	}

	if !found {
		return model.ImagenMedica{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteImagenMedica(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.ImagenMedica, 0, len(pet.Imagenes))
	deleted := false
	for _, img := range pet.Imagenes {
		if img.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, img)
	}

	if !deleted {
		return false
	}

	pet.Imagenes = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Peso ---

func (s *PetStore) AddPeso(petID string, req model.PesoCreateRequest) (model.PesoRegistro, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.PesoRegistro{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	registro := model.PesoRegistro{
		ID:    id,
		Fecha: req.Fecha,
		Peso:  req.Peso,
	}

	pet.PesoHistorial = append(pet.PesoHistorial, registro)
	pet.PesoActual = fmt.Sprintf("%.1f kg", req.Peso)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return registro, true, err
	}

	return registro, true, nil
}

func (s *PetStore) DeletePeso(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.PesoRegistro, 0, len(pet.PesoHistorial))
	deleted := false
	for _, p := range pet.PesoHistorial {
		if p.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, p)
	}

	if !deleted {
		return false
	}

	pet.PesoHistorial = newList
	if len(newList) > 0 {
		pet.PesoActual = fmt.Sprintf("%.1f kg", newList[len(newList)-1].Peso)
	}
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// --- Diario / Sintomas ---

func (s *PetStore) AddDiario(petID string, req model.DiarioCreateRequest) (model.DiarioRegistro, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.DiarioRegistro{}, false, nil
	}

	id := int(time.Now().UnixNano() % 1000000)
	registro := model.DiarioRegistro{
		ID:      id,
		Fecha:   req.Fecha,
		Sintoma: req.Sintoma,
		Estado:  req.Estado,
		Nota:    req.Nota,
	}

	pet.Diario = append([]model.DiarioRegistro{registro}, pet.Diario...)
	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return registro, true, err
	}

	return registro, true, nil
}

func (s *PetStore) UpdateDiario(petID string, id int, req model.DiarioCreateRequest) (model.DiarioRegistro, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return model.DiarioRegistro{}, false, nil
	}

	found := false
	var updated model.DiarioRegistro
	for i, d := range pet.Diario {
		if d.ID == id {
			pet.Diario[i].Fecha = req.Fecha
			pet.Diario[i].Sintoma = req.Sintoma
			pet.Diario[i].Estado = req.Estado
			pet.Diario[i].Nota = req.Nota
			updated = pet.Diario[i]
			found = true
			break
		}
	}

	if !found {
		return model.DiarioRegistro{}, false, nil
	}

	s.pets[petID] = pet
	if err := s.saveUnsafe(); err != nil {
		return updated, true, err
	}

	return updated, true, nil
}

func (s *PetStore) DeleteDiario(petID string, id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	pet, ok := s.pets[petID]
	if !ok {
		return false
	}

	newList := make([]model.DiarioRegistro, 0, len(pet.Diario))
	deleted := false
	for _, d := range pet.Diario {
		if d.ID == id {
			deleted = true
			continue
		}
		newList = append(newList, d)
	}

	if !deleted {
		return false
	}

	pet.Diario = newList
	s.pets[petID] = pet
	_ = s.saveUnsafe()
	return true
}

// defaultPetsSeed builds Luna and Max initial clinical data
func defaultPetsSeed() map[string]model.Pet {
	m := make(map[string]model.Pet)

	luna := model.Pet{
		ID:               "luna",
		Nombre:           "Luna",
		Especie:          "Perro",
		Raza:             "Beagle",
		Edad:             "3 años",
		Sexo:             "Hembra (Esterilizada)",
		PesoActual:       "12.4 kg",
		FechaNacimiento:  "12/03/2023",
		Microchip:        "981022300456123",
		Foto:             "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=300&h=300",
		Seguro:           "PetPlan Gold (80% Cobertura)",
		ClinicaFrecuente: "Hospital Veterinario Sania Pet",
		Propietario: model.Propietario{
			Nombre:    "Jota Robles",
			Rut:       "17.654.321-K",
			Telefono:  "+56 9 8765 4321",
			Email:     "jota.robles@saniapet.cl",
			Direccion: "Av. Providencia 1234, Santiago",
		},
		Alertas: []model.Alerta{
			{
				ID:          "al1",
				Tipo:        "critica",
				Titulo:      "ALERGIA A LA IVERMECTINA",
				Descripcion: "Mutación del gen MDR1 confirmada. No administrar antiparasitarios con esta droga.",
				Estado:      "activa",
			},
			{
				ID:          "al2",
				Tipo:        "preventiva",
				Titulo:      "VACUNA ANTIRRÁBICA PRÓXIMA A VENCER",
				Descripcion: "Vence el 15/07/2026. Agendar hora de renovación.",
				Estado:      "activa",
			},
		},
		Diagnosticos: []model.Diagnostico{
			{
				ID:          1,
				Fecha:       "10/05/2026",
				Tipo:        "Consulta General",
				TipoColor:   "bg-blue-100 text-blue-700 border-blue-200",
				Descripcion: "Control sano anual y chequeo de peso.",
				Doctor:      "Dra. Sandra Valenzuela",
				Estado:      "Resuelto",
				EstadoColor: "bg-green-100 text-green-700",
				Clinica:     "Hospital Veterinario Sania Pet",
			},
			{
				ID:          2,
				Fecha:       "24/03/2026",
				Tipo:        "Urgencia",
				TipoColor:   "bg-red-100 text-red-700 border-red-200",
				Descripcion: "Gastroenteritis aguda alimentaria. Ingesta de restos en la calle.",
				Doctor:      "Dr. Roberto Cáceres",
				Estado:      "Resuelto",
				EstadoColor: "bg-green-100 text-green-700",
				Clinica:     "Urgencias Sania Pet 24/7",
			},
			{
				ID:          3,
				Fecha:       "15/01/2026",
				Tipo:        "Especialidad",
				TipoColor:   "bg-purple-100 text-purple-700 border-purple-200",
				Descripcion: "Otitis externa bilateral por hongos. Tratamiento ótico indicado.",
				Doctor:      "Dra. María Paz Gómez (Dermatología)",
				Estado:      "Controlado",
				EstadoColor: "bg-blue-100 text-blue-700",
				Clinica:     "Hospital Veterinario Sania Pet",
			},
		},
		Vacunas: []model.Vacuna{
			{
				ID:           1,
				Fecha:        "15/07/2025",
				Nombre:       "Antirrábica (Rabigen)",
				Lote:         "RAB-9923B",
				Veterinario:  "Dra. Sandra Valenzuela",
				ProximaFecha: "15/07/2026",
				Estado:       "Aplicada",
				EstadoColor:  "bg-green-100 text-green-700",
			},
			{
				ID:           2,
				Fecha:        "12/03/2026",
				Nombre:       "Séxtuple Canina (Defensor 6)",
				Lote:         "SEX-8840A",
				Veterinario:  "Dra. Sandra Valenzuela",
				ProximaFecha: "12/03/2027",
				Estado:       "Aplicada",
				EstadoColor:  "bg-green-100 text-green-700",
			},
			{
				ID:           3,
				Fecha:        "05/11/2025",
				Nombre:       "KC Bronchicine (Tos de las perreras)",
				Lote:         "KC-7721C",
				Veterinario:  "Dr. Roberto Cáceres",
				ProximaFecha: "05/11/2026",
				Estado:       "Aplicada",
				EstadoColor:  "bg-green-100 text-green-700",
			},
			{
				ID:           4,
				Fecha:        "Pendiente",
				Nombre:       "Refuerzo Antirrábica",
				Lote:         "N/A",
				Veterinario:  "Por designar",
				ProximaFecha: "15/07/2026",
				Estado:       "Vencida",
				EstadoColor:  "bg-red-100 text-red-700",
			},
		},
		Desparasitaciones: []model.Desparasitacion{
			{
				ID:           1,
				Fecha:        "10/06/2026",
				Tipo:         "Externa",
				Producto:     "NexGard Spectra M",
				PesoMascota:  "12.4 kg",
				Dosis:        "1 tableta masticable (15-30 mg)",
				ProximaFecha: "10/07/2026",
				Veterinario:  "Dueño (Auto-administrado)",
			},
			{
				ID:           2,
				Fecha:        "12/03/2026",
				Tipo:         "Interna",
				Producto:     "Drontal Plus Perros",
				PesoMascota:  "12.1 kg",
				Dosis:        "1 tableta y cuarto",
				ProximaFecha: "12/06/2026",
				Veterinario:  "Dra. Sandra Valenzuela",
			},
			{
				ID:           3,
				Fecha:        "10/03/2026",
				Tipo:         "Externa",
				Producto:     "Bravecto Perros Medianos",
				PesoMascota:  "12.0 kg",
				Dosis:        "1 tableta (500 mg)",
				ProximaFecha: "10/06/2026",
				Veterinario:  "Dueño (Auto-administrado)",
			},
		},
		Medicamentos: []model.Medicamento{
			{
				ID:          1,
				Nombre:      "Prednisona 5mg (Comprimidos)",
				Dosis:       "1/2 tableta",
				Frecuencia:  "Cada 24 horas",
				Duracion:    "Terminado el 20/05/2026",
				FechaInicio: "15/05/2026",
				Veterinario: "Dra. Sandra Valenzuela",
				Estado:      "Completado",
			},
			{
				ID:          2,
				Nombre:      "Glandulex Sacs (Suplemento de fibra)",
				Dosis:       "1 croqueta masticable",
				Frecuencia:  "Cada 24 horas (Con alimento)",
				Duracion:    "Uso continuo preventivo",
				FechaInicio: "10/05/2026",
				Veterinario: "Dra. Sandra Valenzuela",
				Estado:      "Activo",
			},
		},
		Laboratorios: []model.Laboratorio{
			{
				ID:              "2026-05-883",
				Fecha:           "10/05/2026",
				Examen:          "Hemograma Completo Automatizado",
				Laboratorio:     "Veterinary Diagnostics Lab Sania",
				Telefono:        "+56 2 2987 6543",
				SitioWeb:        "lab.saniapet.cl",
				Direccion:       "Av. Vitacura 5400, Santiago",
				Convenio:        "PetPlan Seguro Veterinario",
				DirectorTecnico: "Dr. Fernando Leyton (Patólogo Clínico)",
				NotasGenerales:  "Todos los parámetros hematológicos se encuentran dentro de los rangos de referencia para la especie canina. Serie roja y plaquetaria normales. Sin presencia de parásitos hemáticos.",
				Resultados: []model.LabResult{
					{ID: 1, Nombre: "Hematocrito", Resultado: "45.2", Unidad: "%", RangoReferencia: "37.0 - 55.0", Estado: "Normal"},
					{ID: 2, Nombre: "Hemoglobina", Resultado: "15.6", Unidad: "g/dL", RangoReferencia: "12.0 - 18.0", Estado: "Normal"},
					{ID: 3, Nombre: "Eritrocitos", Resultado: "6.8", Unidad: "x10^6/uL", RangoReferencia: "5.5 - 8.5", Estado: "Normal"},
					{ID: 4, Nombre: "Leucocitos Totales", Resultado: "10.4", Unidad: "x10^3/uL", RangoReferencia: "6.0 - 17.0", Estado: "Normal"},
					{ID: 5, Nombre: "Segmentados (Neutrófilos)", Resultado: "7.2", Unidad: "x10^3/uL", RangoReferencia: "3.0 - 11.5", Estado: "Normal"},
					{ID: 6, Nombre: "Linfocitos", Resultado: "2.1", Unidad: "x10^3/uL", RangoReferencia: "1.0 - 4.8", Estado: "Normal"},
					{ID: 7, Nombre: "Plaquetas", Resultado: "320", Unidad: "x10^3/uL", RangoReferencia: "150 - 500", Estado: "Normal"},
				},
			},
			{
				ID:              "2026-03-412",
				Fecha:           "24/03/2026",
				Examen:          "Perfil Bioquímico Sanguíneo Básico",
				Laboratorio:     "Veterinary Diagnostics Lab Sania",
				Telefono:        "+56 2 2987 6543",
				SitioWeb:        "lab.saniapet.cl",
				Direccion:       "Av. Vitacura 5400, Santiago",
				Convenio:        "Particular",
				DirectorTecnico: "Dr. Fernando Leyton (Patólogo Clínico)",
				NotasGenerales:  "Elevación discreta de GPT/ALT y Amilasa debido a la gastroenteritis aguda de la paciente. Glucosa y función renal óptimas.",
				Resultados: []model.LabResult{
					{ID: 8, Nombre: "Glucosa", Resultado: "95", Unidad: "mg/dL", RangoReferencia: "70 - 110", Estado: "Normal"},
					{ID: 9, Nombre: "Urea", Resultado: "25", Unidad: "mg/dL", RangoReferencia: "10 - 45", Estado: "Normal"},
					{ID: 10, Nombre: "Creatinina", Resultado: "0.9", Unidad: "mg/dL", RangoReferencia: "0.5 - 1.5", Estado: "Normal"},
					{ID: 11, Nombre: "Proteínas Totales", Resultado: "6.4", Unidad: "g/dL", RangoReferencia: "5.4 - 7.5", Estado: "Normal"},
					{ID: 12, Nombre: "GPT / ALT (Hepático)", Resultado: "92", Unidad: "U/L", RangoReferencia: "10 - 80", Estado: "Alto"},
					{ID: 13, Nombre: "Fosfatasa Alcalina", Resultado: "68", Unidad: "U/L", RangoReferencia: "20 - 150", Estado: "Normal"},
				},
			},
		},
		Imagenes: []model.ImagenMedica{
			{
				ID:         1,
				Fecha:      "24/03/2026",
				Tipo:       "Radiografía",
				Nombre:     "Radiografía de Abdomen Simple (Lateral/Ventrodorsal)",
				Indicacion: "Evaluar presencia de cuerpos extraños por gastroenteritis aguda.",
				Doctor:     "Dr. Ignacio Valdivia (Radiólogo)",
				Informe:    "Se observan estómago y asas intestinales con moderada acumulación de gas. No se visualizan imágenes radiopacas compatibles con cuerpos extraños obstructivos metálicos ni óseos. Estructura hepática y silueta vesical dentro de límites normales.",
				ImagenURL:  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300",
			},
		},
		PesoHistorial: []model.PesoRegistro{
			{ID: 1, Fecha: "Oct 25", Peso: 11.5},
			{ID: 2, Fecha: "Nov 25", Peso: 11.8},
			{ID: 3, Fecha: "Dic 25", Peso: 11.9},
			{ID: 4, Fecha: "Ene 26", Peso: 12.0},
			{ID: 5, Fecha: "Mar 26", Peso: 12.1},
			{ID: 6, Fecha: "May 26", Peso: 12.4},
		},
		Diario: []model.DiarioRegistro{
			{
				ID:      1,
				Fecha:   "22/06/2026",
				Sintoma: "Buen apetito",
				Estado:  "Normal",
				Nota:    "Comió todo su alimento habitual y anduvo con bastante energía.",
			},
			{
				ID:      2,
				Fecha:   "18/06/2026",
				Sintoma: "Prurito leve en oreja derecha",
				Estado:  "Atención",
				Nota:    "Se rascó un par de veces por la tarde, pero el canal auditivo se ve limpio y seco.",
			},
		},
	}

	maxPet := model.Pet{
		ID:               "max",
		Nombre:           "Max",
		Especie:          "Gato",
		Raza:             "Persa",
		Edad:             "5 años",
		Sexo:             "Macho (Castrado)",
		PesoActual:       "4.8 kg",
		FechaNacimiento:  "08/09/2021",
		Microchip:        "981022300456987",
		Foto:             "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300",
		Seguro:           "Sura Pets Plan Base (60% Cobertura)",
		ClinicaFrecuente: "Hospital Veterinario Sania Pet",
		Propietario: model.Propietario{
			Nombre:    "Jota Robles",
			Rut:       "17.654.321-K",
			Telefono:  "+56 9 8765 4321",
			Email:     "jota.robles@saniapet.cl",
			Direccion: "Av. Providencia 1234, Santiago",
		},
		Alertas: []model.Alerta{
			{
				ID:          "al3",
				Tipo:        "critica",
				Titulo:      "SÍNDROME URINARIO FELINO (FLUTD)",
				Descripcion: "Antecedentes de obstrucción uretral. Monitorear micción diaria y mantener alimento húmedo medicado.",
				Estado:      "activa",
			},
		},
		Diagnosticos: []model.Diagnostico{
			{
				ID:          4,
				Fecha:       "18/04/2026",
				Tipo:        "Consulta General",
				TipoColor:   "bg-blue-100 text-blue-700 border-blue-200",
				Descripcion: "Control renal preventivo y revisión odontológica general.",
				Doctor:      "Dr. Francisco Muñoz (Medicina Felina)",
				Estado:      "En control",
				EstadoColor: "bg-blue-100 text-blue-700",
				Clinica:     "Hospital Veterinario Sania Pet",
			},
			{
				ID:          5,
				Fecha:       "05/12/2025",
				Tipo:        "Urgencia",
				TipoColor:   "bg-red-100 text-red-700 border-red-200",
				Descripcion: "Dificultad al orinar (Disuria). Arenilla vesical detectada mediante ecografía.",
				Doctor:      "Dra. Sandra Valenzuela",
				Estado:      "Resuelto",
				EstadoColor: "bg-green-100 text-green-700",
				Clinica:     "Hospital Veterinario Sania Pet",
			},
		},
		Vacunas: []model.Vacuna{
			{
				ID:           5,
				Fecha:        "10/09/2025",
				Nombre:       "Triple Felina (Feline Vax 3)",
				Lote:         "TF-2212E",
				Veterinario:  "Dr. Francisco Muñoz",
				ProximaFecha: "10/09/2026",
				Estado:       "Aplicada",
				EstadoColor:  "bg-green-100 text-green-700",
			},
			{
				ID:           6,
				Fecha:        "10/09/2025",
				Nombre:       "Antirrábica Felina",
				Lote:         "RAB-FEL-92A",
				Veterinario:  "Dr. Francisco Muñoz",
				ProximaFecha: "10/09/2026",
				Estado:       "Aplicada",
				EstadoColor:  "bg-green-100 text-green-700",
			},
			{
				ID:           7,
				Fecha:        "15/10/2024",
				Nombre:       "Leucemia Felina (Leukocell 2)",
				Lote:         "LF-3401D",
				Veterinario:  "Dra. Sandra Valenzuela",
				ProximaFecha: "15/10/2025",
				Estado:       "Vencida",
				EstadoColor:  "bg-red-100 text-red-700",
			},
		},
		Desparasitaciones: []model.Desparasitacion{
			{
				ID:           4,
				Fecha:        "20/05/2026",
				Tipo:         "Externa",
				Producto:     "Bravecto Plus Gatos (Pipeta)",
				PesoMascota:  "4.8 kg",
				Dosis:        "1 pipeta aplicación tópica (112.5 mg)",
				ProximaFecha: "20/08/2026",
				Veterinario:  "Dueño (Auto-administrado)",
			},
			{
				ID:           5,
				Fecha:        "10/03/2026",
				Tipo:         "Interna",
				Producto:     "Milbemax Gatos",
				PesoMascota:  "4.7 kg",
				Dosis:        "1 tableta",
				ProximaFecha: "10/06/2026",
				Veterinario:  "Dr. Francisco Muñoz",
			},
		},
		Medicamentos: []model.Medicamento{
			{
				ID:          3,
				Nombre:      "Royal Canin Urinary S/O Wet (Alimento Húmedo)",
				Dosis:       "1 sobre al día",
				Frecuencia:  "Cada 24 horas",
				Duracion:    "Permanente",
				FechaInicio: "06/12/2025",
				Veterinario: "Dr. Francisco Muñoz",
				Estado:      "Activo",
			},
		},
		Laboratorios: []model.Laboratorio{
			{
				ID:              "2026-04-102",
				Fecha:           "18/04/2026",
				Examen:          "Perfil Bioquímico Felino y Urianálisis",
				Laboratorio:     "Veterinary Diagnostics Lab Sania",
				Telefono:        "+56 2 2987 6543",
				SitioWeb:        "lab.saniapet.cl",
				Direccion:       "Av. Vitacura 5400, Santiago",
				Convenio:        "Particular",
				DirectorTecnico: "Dr. Fernando Leyton (Patólogo Clínico)",
				NotasGenerales:  "El perfil renal muestra valores de SDMA, Creatinina y BUN estables. El examen de orina indica un pH de 6.2 con ausencia de cristales de estruvita. Continuar con dieta Urinary S/O.",
				Resultados: []model.LabResult{
					{ID: 14, Nombre: "Glucosa", Resultado: "88", Unidad: "mg/dL", RangoReferencia: "70 - 150", Estado: "Normal"},
					{ID: 15, Nombre: "BUN (Nitrógeno Ureico)", Resultado: "22", Unidad: "mg/dL", RangoReferencia: "15 - 34", Estado: "Normal"},
					{ID: 16, Nombre: "Creatinina Sérica", Resultado: "1.3", Unidad: "mg/dL", RangoReferencia: "0.8 - 2.0", Estado: "Normal"},
					{ID: 17, Nombre: "SDMA (Marcador Precoz)", Resultado: "11", Unidad: "ug/dL", RangoReferencia: "0 - 14", Estado: "Normal"},
					{ID: 18, Nombre: "Densidad Urinaria", Resultado: "1.045", Unidad: "g/ml", RangoReferencia: "> 1.035", Estado: "Normal"},
					{ID: 19, Nombre: "pH Orina", Resultado: "6.2", Unidad: "pH", RangoReferencia: "6.0 - 7.0", Estado: "Normal"},
				},
			},
		},
		Imagenes: []model.ImagenMedica{
			{
				ID:         2,
				Fecha:      "05/12/2025",
				Tipo:       "Ecografía",
				Nombre:     "Ecografía de Vías Urinarias y Vejiga",
				Indicacion: "Descartar urolitos vesicales u obstrucción renal por disuria severa.",
				Doctor:     "Dra. Elena Pastene (Ecografista)",
				Informe:    "Vejiga con pared levemente engrosada (cistitis). Presencia de abundante sedimento urinario en suspensión compatible con arenilla/microcristales. No se aprecian cálculos de gran tamaño productores de sombra acústica. Riñones conservan adecuada relación cortico-medular.",
				ImagenURL:  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&h=300",
			},
		},
		PesoHistorial: []model.PesoRegistro{
			{ID: 7, Fecha: "Oct 25", Peso: 4.5},
			{ID: 8, Fecha: "Nov 25", Peso: 4.6},
			{ID: 9, Fecha: "Dic 25", Peso: 4.4},
			{ID: 10, Fecha: "Feb 26", Peso: 4.6},
			{ID: 11, Fecha: "Abr 26", Peso: 4.8},
		},
		Diario: []model.DiarioRegistro{
			{
				ID:      3,
				Fecha:   "22/06/2026",
				Sintoma: "Micción normal",
				Estado:  "Normal",
				Nota:    "Fue a su caja de arena dos veces, orinando volumen normal sin quejarse.",
			},
			{
				ID:      4,
				Fecha:   "21/06/2026",
				Sintoma: "Apetito caprichoso",
				Estado:  "Atención",
				Nota:    "No se comió todo el alimento húmedo por la mañana, pero terminó el seco de noche.",
			},
		},
	}

	m[luna.ID] = luna
	m[maxPet.ID] = maxPet
	return m
}
