package handler

import (
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
)

var startTime = time.Now()

// HealthHandler handles health and status checks
type HealthHandler struct {
	appName string
	version string
}

// NewHealthHandler creates a new HealthHandler
func NewHealthHandler(appName, version string) *HealthHandler {
	return &HealthHandler{
		appName: appName,
		version: version,
	}
}

// Health returns runtime health metrics and application status
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	return c.JSON(fiber.Map{
		"status":    "ok",
		"app":       h.appName,
		"version":   h.version,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    time.Since(startTime).Round(time.Second).String(),
		"system": fiber.Map{
			"goVersion":    runtime.Version(),
			"numGoroutine": runtime.NumGoroutine(),
			"allocMB":      float64(mem.Alloc) / 1024 / 1024,
			"sysMB":        float64(mem.Sys) / 1024 / 1024,
		},
	})
}
