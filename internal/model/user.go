package model

// User representa la cuenta de un usuario o tutor registrado
type User struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Password  string `json:"password,omitempty"`
	Nombre    string `json:"nombre"`
	Telefono  string `json:"telefono,omitempty"`
	CreatedAt string `json:"created_at"`
}

// UserSummary vista segura del usuario sin contraseñas
type UserSummary struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Nombre   string `json:"nombre"`
	Telefono string `json:"telefono,omitempty"`
}

// RegisterRequest datos para nuevo registro
type RegisterRequest struct {
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Telefono string `json:"telefono,omitempty"`
}

// LoginRequest datos para inicio de sesión
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse respuesta con token de sesión y datos de usuario
type AuthResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Token   string      `json:"token"`
	User    UserSummary `json:"user"`
}
