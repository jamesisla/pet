package store

import (
	"testing"
	"time"

	"saniv2/internal/model"
)

func TestEvaluateSmartAlerts_DogWithoutMicrochipOrVaccines(t *testing.T) {
	pet := model.Pet{
		ID:        "pet_test_1",
		Nombre:    "Rocky",
		Especie:   "Perro",
		Microchip: "",
		Vacunas:   []model.Vacuna{},
		Alertas:   []model.Alerta{},
	}

	EvaluateSmartAlerts(&pet)

	if len(pet.Alertas) == 0 {
		t.Fatalf("expected smart alerts to be generated, got 0")
	}

	// Should have microchip alert, rabies alert, polyvalent alert, deworming alert
	var hasMicrochip, hasRabies, hasPolivalente, hasDeworm bool
	for _, a := range pet.Alertas {
		if a.ReglaKey == "microchip" && a.Estado == "activa" {
			hasMicrochip = true
		}
		if a.ReglaKey == "antirrabica" && a.Estado == "activa" && a.Tipo == "critica" {
			hasRabies = true
		}
		if a.ReglaKey == "polivalente" && a.Estado == "activa" {
			hasPolivalente = true
		}
		if a.ReglaKey == "desparasitacion" && a.Estado == "activa" {
			hasDeworm = true
		}
	}

	if !hasMicrochip {
		t.Errorf("expected microchip alert (Ley 21.020)")
	}
	if !hasRabies {
		t.Errorf("expected critical rabies alert (Ley 21.020)")
	}
	if !hasPolivalente {
		t.Errorf("expected canine polyvalent vaccine alert")
	}
	if !hasDeworm {
		t.Errorf("expected deworming alert")
	}
}

func TestEvaluateSmartAlerts_UpToDatePet(t *testing.T) {
	recentDate := time.Now().AddDate(0, -1, 0).Format("02/01/2006")
	futureDate := time.Now().AddDate(0, 11, 0).Format("02/01/2006")

	pet := model.Pet{
		ID:        "pet_test_2",
		Nombre:    "Milo",
		Especie:   "Gato",
		Microchip: "981022300456123",
		Vacunas: []model.Vacuna{
			{
				ID:           1,
				Nombre:       "Antirrábica Felina",
				Fecha:        recentDate,
				ProximaFecha: futureDate,
			},
			{
				ID:           2,
				Nombre:       "Triple Felina",
				Fecha:        recentDate,
				ProximaFecha: futureDate,
			},
		},
		Desparasitaciones: []model.Desparasitacion{
			{
				ID:    1,
				Tipo:  "Interna",
				Fecha: recentDate,
			},
		},
	}

	EvaluateSmartAlerts(&pet)

	activeCount := 0
	for _, a := range pet.Alertas {
		if a.Estado == "activa" {
			activeCount++
		}
	}

	if activeCount != 0 {
		t.Errorf("expected 0 active alerts for up-to-date pet, got %d", activeCount)
	}
}

func TestEvaluateSmartAlerts_DismissedAlertNotResurrectedInSameCycle(t *testing.T) {
	pet := model.Pet{
		ID:        "pet_test_3",
		Nombre:    "Toby",
		Especie:   "Perro",
		Microchip: "",
		Alertas:   []model.Alerta{},
	}

	EvaluateSmartAlerts(&pet)

	// Dismiss the microchip alert
	for i, a := range pet.Alertas {
		if a.ReglaKey == "microchip" {
			pet.Alertas[i].Estado = "descartada"
			break
		}
	}

	// Re-evaluate
	EvaluateSmartAlerts(&pet)

	for _, a := range pet.Alertas {
		if a.ReglaKey == "microchip" {
			if a.Estado != "descartada" {
				t.Errorf("expected dismissed alert to remain 'descartada', got '%s'", a.Estado)
			}
		}
	}
}
