package handler

import (
	"strings"

	"saniv2/internal/model"
	"saniv2/internal/store"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	userStore *store.UserStore
}

func NewAuthHandler(us *store.UserStore) *AuthHandler {
	return &AuthHandler{userStore: us}
}

// Register creates a new user account and returns auth token
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req model.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Datos de registro inválidos",
		})
	}

	user, token, err := h.userStore.Register(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.AuthResponse{
		Status:  "success",
		Message: "Cuenta creada exitosamente",
		Token:   token,
		User: model.UserSummary{
			ID:        user.ID,
			Email:     user.Email,
			Nombre:    user.Nombre,
			Rut:       user.Rut,
			Telefono:  user.Telefono,
			Direccion: user.Direccion,
		},
	})
}

// Login authenticates user credentials
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Datos de inicio de sesión inválidos",
		})
	}

	user, token, err := h.userStore.Login(req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"detail": err.Error(),
		})
	}

	return c.JSON(model.AuthResponse{
		Status:  "success",
		Message: "Sesión iniciada exitosamente",
		Token:   token,
		User: model.UserSummary{
			ID:        user.ID,
			Email:     user.Email,
			Nombre:    user.Nombre,
			Rut:       user.Rut,
			Telefono:  user.Telefono,
			Direccion: user.Direccion,
		},
	})
}

// Me returns authenticated user profile
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	token := extractToken(c)
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"detail": "Token no proporcionado o sesión expirada",
		})
	}

	user, ok := h.userStore.ValidateToken(token)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"detail": "Sesión inválida o expirada",
		})
	}

	return c.JSON(model.UserSummary{
		ID:        user.ID,
		Email:     user.Email,
		Nombre:    user.Nombre,
		Rut:       user.Rut,
		Telefono:  user.Telefono,
		Direccion: user.Direccion,
	})
}

// UpdateProfile updates authenticated tutor profile
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	token := extractToken(c)
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"detail": "Token no proporcionado o sesión expirada",
		})
	}

	var req model.UserProfileUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": "Datos de perfil inválidos",
		})
	}

	user, err := h.userStore.UpdateProfile(token, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"detail": err.Error(),
		})
	}

	return c.JSON(model.UserSummary{
		ID:        user.ID,
		Email:     user.Email,
		Nombre:    user.Nombre,
		Rut:       user.Rut,
		Telefono:  user.Telefono,
		Direccion: user.Direccion,
	})
}

// Logout closes the session
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	token := extractToken(c)
	if token != "" {
		h.userStore.Logout(token)
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sesión cerrada",
	})
}

func extractToken(c *fiber.Ctx) string {
	auth := c.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return c.Get("X-Auth-Token")
}
