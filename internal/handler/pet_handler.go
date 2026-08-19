package handler

import (
	"strconv"
	"strings"

	"saniv2/internal/model"
	"saniv2/internal/store"

	"github.com/gofiber/fiber/v2"
)

type PetHandler struct {
	store *store.PetStore
}

func NewPetHandler(s *store.PetStore) *PetHandler {
	return &PetHandler{store: s}
}

// ListPets returns summarized list of pets
func (h *PetHandler) ListPets(c *fiber.Ctx) error {
	pets := h.store.GetAllSummary()
	return c.JSON(pets)
}

// GetPet returns complete detail of a pet
func (h *PetHandler) GetPet(c *fiber.Ctx) error {
	id := c.Params("id")
	pet, ok := h.store.GetByID(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet medical profile not found",
		})
	}
	return c.JSON(pet)
}

// CreatePet creates a new pet
func (h *PetHandler) CreatePet(c *fiber.Ctx) error {
	var req model.PetCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	req.Nombre = strings.TrimSpace(req.Nombre)
	if req.Nombre == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "El nombre de la mascota es requerido",
		})
	}

	pet, err := h.store.CreatePet(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar la mascota",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(pet)
}

// UpdatePet updates pet profile
func (h *PetHandler) UpdatePet(c *fiber.Ctx) error {
	id := c.Params("id")
	var req model.PetUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	pet, found, err := h.store.UpdatePet(id, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar perfil de la mascota",
		})
	}

	return c.JSON(pet)
}

// DeletePet deletes a pet
func (h *PetHandler) DeletePet(c *fiber.Ctx) error {
	id := c.Params("id")
	if !h.store.DeletePet(id) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Pet deleted successfully",
	})
}

// UpdateOwner updates owner details
func (h *PetHandler) UpdateOwner(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.OwnerUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	owner, found, err := h.store.UpdateOwner(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Owner details not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar datos del propietario",
		})
	}

	return c.JSON(owner)
}

// --- Alertas ---

func (h *PetHandler) AddAlerta(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.AlertaCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	alerta, found, err := h.store.AddAlerta(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al crear la alerta",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(alerta)
}

func (h *PetHandler) ActionAlerta(c *fiber.Ctx) error {
	alertaID := c.Params("alerta_id")
	petID := c.Params("id") // might be empty if called on /api/alertas/:alerta_id/action

	action := c.Query("action")
	if action == "" {
		var req model.AlertaActionRequest
		_ = c.BodyParser(&req)
		action = req.Action
	}

	if action == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Action parameter is required",
		})
	}

	alerta, found, err := h.store.ActionAlerta(petID, alertaID, action)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Alert not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al procesar la acción de la alerta",
		})
	}

	return c.JSON(alerta)
}

// --- Diagnosticos ---

func (h *PetHandler) AddDiagnostico(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.DiagnosticoCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	diag, found, err := h.store.AddDiagnostico(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al guardar el diagnóstico",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(diag)
}

func (h *PetHandler) UpdateDiagnostico(c *fiber.Ctx) error {
	petID := c.Params("id")
	diagID, _ := strconv.Atoi(c.Params("diagnostico_id"))
	var req model.DiagnosticoCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	diag, found, err := h.store.UpdateDiagnostico(petID, diagID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Diagnosis record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar el diagnóstico",
		})
	}

	return c.JSON(diag)
}

func (h *PetHandler) DeleteDiagnostico(c *fiber.Ctx) error {
	petID := c.Params("id")
	diagID, _ := strconv.Atoi(c.Params("diagnostico_id"))
	if !h.store.DeleteDiagnostico(petID, diagID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Diagnosis record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Diagnosis record deleted"})
}

// --- Vacunas ---

func (h *PetHandler) AddVacuna(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.VacunaCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	vac, found, err := h.store.AddVacuna(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar la vacuna",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(vac)
}

func (h *PetHandler) UpdateVacuna(c *fiber.Ctx) error {
	petID := c.Params("id")
	vacID, _ := strconv.Atoi(c.Params("vacuna_id"))
	var req model.VacunaCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	vac, found, err := h.store.UpdateVacuna(petID, vacID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Vaccine record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar la vacuna",
		})
	}

	return c.JSON(vac)
}

func (h *PetHandler) DeleteVacuna(c *fiber.Ctx) error {
	petID := c.Params("id")
	vacID, _ := strconv.Atoi(c.Params("vacuna_id"))
	if !h.store.DeleteVacuna(petID, vacID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Vaccine record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Vaccine record deleted"})
}

// --- Desparasitaciones ---

func (h *PetHandler) AddDesparasitacion(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.DesparasitacionCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	desp, found, err := h.store.AddDesparasitacion(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar la desparasitación",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(desp)
}

func (h *PetHandler) UpdateDesparasitacion(c *fiber.Ctx) error {
	petID := c.Params("id")
	despID, _ := strconv.Atoi(c.Params("desparasitacion_id"))
	var req model.DesparasitacionCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	desp, found, err := h.store.UpdateDesparasitacion(petID, despID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Deworming record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar la desparasitación",
		})
	}

	return c.JSON(desp)
}

func (h *PetHandler) DeleteDesparasitacion(c *fiber.Ctx) error {
	petID := c.Params("id")
	despID, _ := strconv.Atoi(c.Params("desparasitacion_id"))
	if !h.store.DeleteDesparasitacion(petID, despID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Deworming record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Deworming record deleted"})
}

// --- Medicamentos ---

func (h *PetHandler) AddMedicamento(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.MedicamentoCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	med, found, err := h.store.AddMedicamento(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar el medicamento",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(med)
}

func (h *PetHandler) UpdateMedicamento(c *fiber.Ctx) error {
	petID := c.Params("id")
	medID, _ := strconv.Atoi(c.Params("medicamento_id"))
	var req model.MedicamentoCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	med, found, err := h.store.UpdateMedicamento(petID, medID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Medication record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar el medicamento",
		})
	}

	return c.JSON(med)
}

func (h *PetHandler) DeleteMedicamento(c *fiber.Ctx) error {
	petID := c.Params("id")
	medID, _ := strconv.Atoi(c.Params("medicamento_id"))
	if !h.store.DeleteMedicamento(petID, medID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Medication record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Medication record deleted"})
}

// --- Laboratorios ---

func (h *PetHandler) AddLaboratorio(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.LaboratorioCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	lab, found, err := h.store.AddLaboratorio(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar el examen de laboratorio",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(lab)
}

func (h *PetHandler) UpdateLaboratorio(c *fiber.Ctx) error {
	petID := c.Params("id")
	labID := c.Params("laboratorio_id")
	var req model.LaboratorioCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	lab, found, err := h.store.UpdateLaboratorio(petID, labID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Laboratory record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar el examen de laboratorio",
		})
	}

	return c.JSON(lab)
}

func (h *PetHandler) DeleteLaboratorio(c *fiber.Ctx) error {
	petID := c.Params("id")
	labID := c.Params("laboratorio_id")
	if !h.store.DeleteLaboratorio(petID, labID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Laboratory record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Laboratory record deleted"})
}

// --- Imagenes Medicas ---

func (h *PetHandler) AddImagenMedica(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.ImagenMedicaCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	img, found, err := h.store.AddImagenMedica(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar el estudio de imagen",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(img)
}

func (h *PetHandler) UpdateImagenMedica(c *fiber.Ctx) error {
	petID := c.Params("id")
	imgID, _ := strconv.Atoi(c.Params("imagen_id"))
	var req model.ImagenMedicaCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	img, found, err := h.store.UpdateImagenMedica(petID, imgID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Medical image record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar el estudio de imagen",
		})
	}

	return c.JSON(img)
}

func (h *PetHandler) DeleteImagenMedica(c *fiber.Ctx) error {
	petID := c.Params("id")
	imgID, _ := strconv.Atoi(c.Params("imagen_id"))
	if !h.store.DeleteImagenMedica(petID, imgID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Medical image record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Medical image record deleted"})
}

// --- Peso ---

func (h *PetHandler) AddPeso(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.PesoCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	reg, found, err := h.store.AddPeso(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar el peso",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(reg)
}

func (h *PetHandler) DeletePeso(c *fiber.Ctx) error {
	petID := c.Params("id")
	pesoID, _ := strconv.Atoi(c.Params("peso_id"))
	if !h.store.DeletePeso(petID, pesoID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Peso record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Peso record deleted"})
}

// --- Diario / Sintomas ---

func (h *PetHandler) AddDiario(c *fiber.Ctx) error {
	petID := c.Params("id")
	var req model.DiarioCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	reg, found, err := h.store.AddDiario(petID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Pet not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al registrar síntoma en el diario",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(reg)
}

func (h *PetHandler) UpdateDiario(c *fiber.Ctx) error {
	petID := c.Params("id")
	sintomaID, _ := strconv.Atoi(c.Params("sintoma_id"))
	var req model.DiarioCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Invalid request body",
		})
	}

	reg, found, err := h.store.UpdateDiario(petID, sintomaID, req)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Symptom record not found",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"detail": "Error al actualizar síntoma en el diario",
		})
	}

	return c.JSON(reg)
}

func (h *PetHandler) DeleteDiario(c *fiber.Ctx) error {
	petID := c.Params("id")
	sintomaID, _ := strconv.Atoi(c.Params("sintoma_id"))
	if !h.store.DeleteDiario(petID, sintomaID) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"detail": "Symptom record not found",
		})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Symptom record deleted"})
}
