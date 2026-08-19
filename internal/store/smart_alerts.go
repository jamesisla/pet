package store

import (
	"fmt"
	"strings"
	"time"

	"saniv2/internal/model"
)

// EvaluateSmartAlerts analyzes the pet's clinical profile and synchronizes smart alerts
// adhering to Chilean Law 21.020 (Tenencia Responsable) and SAG/Colmevet medical guidelines.
func EvaluateSmartAlerts(pet *model.Pet) {
	if pet == nil {
		return
	}

	now := time.Now()
	evaluateMicrochipAlert(pet)
	evaluateRabiesAlert(pet, now)
	evaluatePolivalenteAlert(pet, now)
	evaluateDewormingAlert(pet, now)
}

// 1. Microchip Alert (Obligatory in Chile under Ley 21.020)
func evaluateMicrochipAlert(pet *model.Pet) {
	hasMicrochip := false
	chip := strings.TrimSpace(pet.Microchip)
	if chip != "" && !strings.EqualFold(chip, "sin microchip") && !strings.EqualFold(chip, "no registrado") && !strings.EqualFold(chip, "pendiente") {
		hasMicrochip = true
	}

	key := "microchip"
	if !hasMicrochip {
		ciclo := "sin_microchip"
		titulo := "Microchip Pendiente (Ley 21.020)"
		desc := fmt.Sprintf("%s no cuenta con microchip registrado, obligatorio según la Ley 21.020 de Tenencia Responsable en Chile.", pet.Nombre)
		upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
	} else {
		resolveSmartAlert(pet, key)
	}
}

// 2. Vacuna Antirrábica (Obligatory in Chile for Dogs and Cats, Annual Booster)
func evaluateRabiesAlert(pet *model.Pet, now time.Time) {
	key := "antirrabica"
	var lastDoseDate time.Time
	var nextDoseDate time.Time
	hasVaccine := false

	for _, v := range pet.Vacunas {
		name := strings.ToLower(v.Nombre)
		if strings.Contains(name, "antirrab") || strings.Contains(name, "antirráb") || strings.Contains(name, "rabia") || strings.Contains(name, "rabies") || strings.Contains(name, "rabigen") || strings.Contains(name, "defensor r") || strings.Contains(name, "nobivac r") {
			hasVaccine = true
			if d, ok := parseFlexibleDate(v.Fecha); ok {
				if d.After(lastDoseDate) {
					lastDoseDate = d
				}
			}
			if prox, ok := parseFlexibleDate(v.ProximaFecha); ok {
				if prox.After(nextDoseDate) {
					nextDoseDate = prox
				}
			}
		}
	}

	if !hasVaccine {
		ciclo := "sin_vacuna_antirrabica"
		titulo := "Vacuna Antirrábica Obligatoria Pendiente"
		desc := fmt.Sprintf("A %s le falta la vacuna antirrábica, obligatoria por ley en Chile (Ley 21.020) desde los 2 meses de edad.", pet.Nombre)
		upsertSmartAlert(pet, key, "critica", titulo, desc, ciclo)
		return
	}

	// Calculate due date
	var dueDate time.Time
	if !nextDoseDate.IsZero() {
		dueDate = nextDoseDate
	} else if !lastDoseDate.IsZero() {
		dueDate = lastDoseDate.AddDate(1, 0, 0) // 1 year booster
	}

	if !dueDate.IsZero() {
		daysUntil := int(dueDate.Sub(now).Hours() / 24)
		ciclo := fmt.Sprintf("antirrabica_%s", dueDate.Format("2006-01-02"))

		if daysUntil < 0 {
			// Overdue
			titulo := "Refuerzo Antirrábico Vencido"
			desc := fmt.Sprintf("A %s se le venció el refuerzo anual de la vacuna antirrábica (obligatoria por Ley 21.020). Venció el %s.", pet.Nombre, formatDateShort(dueDate))
			upsertSmartAlert(pet, key, "critica", titulo, desc, ciclo)
		} else if daysUntil <= 30 {
			// Upcoming in next 30 days
			titulo := "Refuerzo Antirrábico Próximo a Vencer"
			desc := fmt.Sprintf("A %s le falta la vacuna antirrábica, obligatoria por ley en Chile. Vence en %d días (%s).", pet.Nombre, daysUntil, formatDateShort(dueDate))
			upsertSmartAlert(pet, key, "critica", titulo, desc, ciclo)
		} else {
			// Up to date
			resolveSmartAlert(pet, key)
		}
	} else {
		resolveSmartAlert(pet, key)
	}
}

// 3. Vacuna Polivalente (Séxtuple/Óctuple para perros, Triple Felina para gatos)
func evaluatePolivalenteAlert(pet *model.Pet, now time.Time) {
	key := "polivalente"
	especie := strings.ToLower(pet.Especie)
	isDog := strings.Contains(especie, "perro") || strings.Contains(especie, "canin") || strings.Contains(especie, "dog")
	isCat := strings.Contains(especie, "gato") || strings.Contains(especie, "felin") || strings.Contains(especie, "cat")

	if !isDog && !isCat {
		return
	}

	var lastDoseDate time.Time
	var nextDoseDate time.Time
	hasVaccine := false

	for _, v := range pet.Vacunas {
		name := strings.ToLower(v.Nombre)
		match := false
		if isDog && (strings.Contains(name, "sextuple") || strings.Contains(name, "séxtuple") || strings.Contains(name, "octuple") || strings.Contains(name, "óctuple") || strings.Contains(name, "polivalente") || strings.Contains(name, "puppy") || strings.Contains(name, "kc") || strings.Contains(name, "vanguard")) {
			match = true
		} else if isCat && (strings.Contains(name, "triple") || strings.Contains(name, "felina") || strings.Contains(name, "leucemia") || strings.Contains(name, "trivalente") || strings.Contains(name, "cuadruple") || strings.Contains(name, "felocell")) {
			match = true
		}

		if match {
			hasVaccine = true
			if d, ok := parseFlexibleDate(v.Fecha); ok && d.After(lastDoseDate) {
				lastDoseDate = d
			}
			if prox, ok := parseFlexibleDate(v.ProximaFecha); ok && prox.After(nextDoseDate) {
				nextDoseDate = prox
			}
		}
	}

	vacName := "Séxtuple / Óctuple"
	if isCat {
		vacName = "Triple Felina"
	}

	if !hasVaccine {
		ciclo := fmt.Sprintf("sin_polivalente_%s", especie)
		titulo := fmt.Sprintf("Vacuna %s Pendiente", vacName)
		desc := fmt.Sprintf("A %s le falta el esquema de vacuna %s, fundamental para la inmunización clínica.", pet.Nombre, vacName)
		upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
		return
	}

	var dueDate time.Time
	if !nextDoseDate.IsZero() {
		dueDate = nextDoseDate
	} else if !lastDoseDate.IsZero() {
		dueDate = lastDoseDate.AddDate(1, 0, 0)
	}

	if !dueDate.IsZero() {
		daysUntil := int(dueDate.Sub(now).Hours() / 24)
		ciclo := fmt.Sprintf("polivalente_%s", dueDate.Format("2006-01-02"))

		if daysUntil < 0 {
			titulo := fmt.Sprintf("Refuerzo %s Vencido", vacName)
			desc := fmt.Sprintf("Corresponde renovar el refuerzo anual de vacuna %s para %s (venció el %s).", vacName, pet.Nombre, formatDateShort(dueDate))
			upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
		} else if daysUntil <= 30 {
			titulo := fmt.Sprintf("Refuerzo %s Próximo a Vencer", vacName)
			desc := fmt.Sprintf("El refuerzo de vacuna %s para %s vence en %d días (%s).", vacName, pet.Nombre, daysUntil, formatDateShort(dueDate))
			upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
		} else {
			resolveSmartAlert(pet, key)
		}
	} else {
		resolveSmartAlert(pet, key)
	}
}

// 4. Desparasitación Periódica (Interna / Externa cada 90 días)
func evaluateDewormingAlert(pet *model.Pet, now time.Time) {
	key := "desparasitacion"
	var lastDate time.Time
	var nextDate time.Time
	hasDeworm := false

	for _, d := range pet.Desparasitaciones {
		hasDeworm = true
		if dt, ok := parseFlexibleDate(d.Fecha); ok && dt.After(lastDate) {
			lastDate = dt
		}
		if prox, ok := parseFlexibleDate(d.ProximaFecha); ok && prox.After(nextDate) {
			nextDate = prox
		}
	}

	if !hasDeworm {
		ciclo := "sin_desparasitacion"
		titulo := "Control Antiparasitario Pendiente"
		desc := fmt.Sprintf("Se recomienda registrar y aplicar control de desparasitación periódica interna y externa para %s.", pet.Nombre)
		upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
		return
	}

	var dueDate time.Time
	if !nextDate.IsZero() {
		dueDate = nextDate
	} else if !lastDate.IsZero() {
		dueDate = lastDate.AddDate(0, 3, 0) // Recommended 3 months
	}

	if !dueDate.IsZero() {
		daysUntil := int(dueDate.Sub(now).Hours() / 24)
		ciclo := fmt.Sprintf("desparasitacion_%s", dueDate.Format("2006-01-02"))

		if daysUntil < 0 {
			titulo := "Control Antiparasitario Vencido"
			desc := fmt.Sprintf("Han transcurrido más de 3 meses desde la última desparasitación de %s. Agendar control periódico.", pet.Nombre)
			upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
		} else if daysUntil <= 15 {
			titulo := "Control Antiparasitario Próximo"
			desc := fmt.Sprintf("Próxima dosis antiparasitaria para %s programada para dentro de %d días (%s).", pet.Nombre, daysUntil, formatDateShort(dueDate))
			upsertSmartAlert(pet, key, "preventiva", titulo, desc, ciclo)
		} else {
			resolveSmartAlert(pet, key)
		}
	} else {
		resolveSmartAlert(pet, key)
	}
}

// --- Helper Functions ---

func upsertSmartAlert(pet *model.Pet, key, tipo, titulo, desc, cicloRef string) {
	for i, a := range pet.Alertas {
		if a.ReglaKey == key || a.ID == "smart_"+key {
			// Check if user discarded/dismissed this alert for this exact cycle
			if (a.Estado == "descartada" || a.Estado == "olvidada") && a.CicloRef == cicloRef {
				// Keep discarded, do not resurrect
				return
			}
			if a.Estado == "solucionada" && a.CicloRef == cicloRef {
				// Keep resolved
				return
			}
			if a.Estado == "pospuesta" && a.CicloRef == cicloRef {
				// Keep postponed
				return
			}

			// Update active alert with latest info
			pet.Alertas[i].Tipo = tipo
			pet.Alertas[i].Titulo = titulo
			pet.Alertas[i].Descripcion = desc
			pet.Alertas[i].Origen = "inteligente"
			pet.Alertas[i].ReglaKey = key
			pet.Alertas[i].CicloRef = cicloRef
			if a.CicloRef != cicloRef {
				pet.Alertas[i].Estado = "activa"
				pet.Alertas[i].Fecha = time.Now().Format("2006-01-02")
			}
			return
		}
	}

	// Not found -> prepend new smart alert
	newAlert := model.Alerta{
		ID:          fmt.Sprintf("smart_%s", key),
		Fecha:       time.Now().Format("2006-01-02"),
		Tipo:        tipo,
		Titulo:      titulo,
		Descripcion: desc,
		Estado:      "activa",
		Origen:      "inteligente",
		ReglaKey:    key,
		CicloRef:    cicloRef,
	}

	pet.Alertas = append([]model.Alerta{newAlert}, pet.Alertas...)
}

func resolveSmartAlert(pet *model.Pet, key string) {
	for i, a := range pet.Alertas {
		if (a.ReglaKey == key || a.ID == "smart_"+key) && a.Estado == "activa" {
			pet.Alertas[i].Estado = "solucionada"
			pet.Alertas[i].Fecha = time.Now().Format("2006-01-02")
		}
	}
}

func parseFlexibleDate(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, false
	}

	formats := []string{
		"02/01/2006",
		"2006-01-02",
		"02-01-2006",
		"2006/01/02",
		"02/01/06",
		time.RFC3339,
		"2006-01-02T15:04:05",
	}

	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func formatDateShort(t time.Time) string {
	return t.Format("02/01/2006")
}
