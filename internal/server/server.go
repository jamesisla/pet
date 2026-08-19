package server

import (
	"fmt"
	"log"
	"mime"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"saniv2/internal/config"
	"saniv2/internal/handler"
	"saniv2/internal/store"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func init() {
	_ = mime.AddExtensionType(".css", "text/css; charset=utf-8")
	_ = mime.AddExtensionType(".js", "application/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".mjs", "application/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".json", "application/json; charset=utf-8")
	_ = mime.AddExtensionType(".svg", "image/svg+xml")
	_ = mime.AddExtensionType(".png", "image/png")
	_ = mime.AddExtensionType(".jpg", "image/jpeg")
	_ = mime.AddExtensionType(".webp", "image/webp")
}

func resolveBasePath() string {
	// 1. Current working directory
	if _, err := os.Stat(filepath.Join(".", "web", "static", "index.html")); err == nil {
		abs, _ := filepath.Abs(".")
		return abs
	}

	// 2. Directory of the executable binary
	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		if _, err := os.Stat(filepath.Join(execDir, "web", "static", "index.html")); err == nil {
			return execDir
		}
	}

	// 3. Common OCI Linux installation paths
	commonPaths := []string{
		"/opt/saniv2",
		"/home/ubuntu/saniv2",
		"/home/alpine/saniv2",
		"/var/www/saniv2",
		"/root/saniv2",
	}
	for _, p := range commonPaths {
		if _, err := os.Stat(filepath.Join(p, "web", "static", "index.html")); err == nil {
			return p
		}
	}

	abs, _ := filepath.Abs(".")
	return abs
}


func Run() {
	cfg := config.Load()
	baseDir := resolveBasePath()
	dataDir := filepath.Join(baseDir, "data")
	staticDir := filepath.Join(baseDir, "web", "static")

	log.Printf("🐾 Iniciando %s [%s]...", cfg.AppName, cfg.AppEnv)
	log.Printf("📂 Directorio base: %s", baseDir)
	log.Printf("📂 Archivos estáticos: %s", staticDir)
	log.Printf("📂 Directorio de datos: %s", dataDir)

	st, err := store.New(dataDir)
	if err != nil {
		log.Fatalf("Error al inicializar el store: %v", err)
	}

	userStore, err := store.NewUserStore(dataDir)
	if err != nil {
		log.Fatalf("Error al inicializar el store de usuarios: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ServerHeader: "SaniaPet-Go-Monolith",
		BodyLimit:    10 * 1024 * 1024, // 10MB
	})

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New())
	app.Use(helmet.New())

	// Disable browser caching for development/production live updates
	app.Use(func(c *fiber.Ctx) error {
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Set("Pragma", "no-cache")
		c.Set("Expires", "0")
		return c.Next()
	})

	// Static assets
	app.Static("/static", staticDir, fiber.Static{
		ByteRange: true,
		Browse:    false,
		MaxAge:    0,
	})

	// Root Index
	app.Get("/", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendFile(filepath.Join(staticDir, "index.html"))
	})

	// Favicon
	app.Get("/favicon.ico", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "image/svg+xml")
		return c.SendFile(filepath.Join(staticDir, "favicon.svg"))
	})

	// Handlers
	healthHandler := handler.NewHealthHandler(cfg.AppName, "2.0.0")
	authHandler := handler.NewAuthHandler(userStore)
	petHandler := handler.NewPetHandler(st, baseDir)

	// API Group
	api := app.Group("/api")
	api.Get("/health", healthHandler.Health)
	api.Post("/upload", petHandler.UploadFile)

	// Auth Endpoints (Unified Tutor Account)
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)
	api.Get("/auth/me", authHandler.Me)
	api.Put("/auth/profile", authHandler.UpdateProfile)
	api.Post("/auth/logout", authHandler.Logout)

	// Pets & Clinical Records API
	api.Get("/pets", petHandler.ListPets)
	api.Post("/pets", petHandler.CreatePet)
	api.Get("/pets/:id", petHandler.GetPet)
	api.Put("/pets/:id", petHandler.UpdatePet)
	api.Delete("/pets/:id", petHandler.DeletePet)
	api.Put("/pets/:id/propietario", petHandler.UpdateOwner)

	// Alertas
	api.Post("/pets/:id/alertas", petHandler.AddAlerta)
	api.Post("/alertas/:alerta_id/action", petHandler.ActionAlerta)
	api.Post("/pets/:id/alertas/:alerta_id/action", petHandler.ActionAlerta)

	// Diagnosticos / Consultas
	api.Post("/pets/:id/diagnosticos", petHandler.AddDiagnostico)
	api.Put("/pets/:id/diagnosticos/:diagnostico_id", petHandler.UpdateDiagnostico)
	api.Delete("/pets/:id/diagnosticos/:diagnostico_id", petHandler.DeleteDiagnostico)

	// Vacunas
	api.Post("/pets/:id/vacunas", petHandler.AddVacuna)
	api.Put("/pets/:id/vacunas/:vacuna_id", petHandler.UpdateVacuna)
	api.Delete("/pets/:id/vacunas/:vacuna_id", petHandler.DeleteVacuna)

	// Desparasitaciones
	api.Post("/pets/:id/desparasitaciones", petHandler.AddDesparasitacion)
	api.Put("/pets/:id/desparasitaciones/:desparasitacion_id", petHandler.UpdateDesparasitacion)
	api.Delete("/pets/:id/desparasitaciones/:desparasitacion_id", petHandler.DeleteDesparasitacion)

	// Medicamentos
	api.Post("/pets/:id/medicamentos", petHandler.AddMedicamento)
	api.Put("/pets/:id/medicamentos/:medicamento_id", petHandler.UpdateMedicamento)
	api.Delete("/pets/:id/medicamentos/:medicamento_id", petHandler.DeleteMedicamento)

	// Laboratorios
	api.Post("/pets/:id/laboratorios", petHandler.AddLaboratorio)
	api.Put("/pets/:id/laboratorios/:laboratorio_id", petHandler.UpdateLaboratorio)
	api.Delete("/pets/:id/laboratorios/:laboratorio_id", petHandler.DeleteLaboratorio)

	// Imagenes Medicas
	api.Post("/pets/:id/imagenes", petHandler.AddImagenMedica)
	api.Put("/pets/:id/imagenes/:imagen_id", petHandler.UpdateImagenMedica)
	api.Delete("/pets/:id/imagenes/:imagen_id", petHandler.DeleteImagenMedica)

	// Peso
	api.Post("/pets/:id/peso", petHandler.AddPeso)
	api.Delete("/pets/:id/peso/:peso_id", petHandler.DeletePeso)

	// Diario de salud
	api.Post("/pets/:id/sintomas", petHandler.AddDiario)
	api.Put("/pets/:id/sintomas/:sintoma_id", petHandler.UpdateDiario)
	api.Delete("/pets/:id/sintomas/:sintoma_id", petHandler.DeleteDiario)

	// Graceful Shutdown
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-shutdownChan
		log.Println("🛑 Apagando el servidor Sania Pet de forma segura...")
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🌐 Sania Pet disponible en http://localhost:%s", cfg.Port)
	if err := app.Listen(addr); err != nil {
		log.Printf("Servidor detenido: %v", err)
	}
}
