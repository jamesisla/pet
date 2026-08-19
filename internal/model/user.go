package model

// User representa la cuenta unificada del tutor / dueño de las mascotas
type User struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Password  string `json:"password,omitempty"`
	Nombre    string `json:"nombre"`
	Rut       string `json:"rut,omitempty"`
	Telefono  string `json:"telefono,omitempty"`
	Direccion string `json:"direccion,omitempty"`
	CreatedAt string `json:"created_at"`
}

// UserSummary vista unificada y segura del tutor
type UserSummary struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Nombre    string `json:"nombre"`
	Rut       string `json:"rut,omitempty"`
	Telefono  string `json:"telefono,omitempty"`
	Direccion string `json:"direccion,omitempty"`
}

// RegisterRequest datos para nuevo registro
type RegisterRequest struct {
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Rut       string `json:"rut,omitempty"`
	Telefono  string `json:"telefono,omitempty"`
	Direccion string `json:"direccion,omitempty"`
}

// UserProfileUpdateRequest para actualizar datos del tutor
type UserProfileUpdateRequest struct {
	Nombre    string `json:"nombre"`
	Rut       string `json:"rut,omitempty"`
	Telefono  string `json:"telefono,omitempty"`
	Direccion string `json:"direccion,omitempty"`
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
