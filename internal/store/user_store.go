package store

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"saniv2/internal/model"
)

type UserStore struct {
	mu       sync.RWMutex
	filePath string
	users    map[string]model.User // Key: Email
	tokens   map[string]string     // Key: Token -> User Email
}

func NewUserStore(dataDir string) (*UserStore, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	fp := filepath.Join(dataDir, "users.json")
	s := &UserStore{
		filePath: fp,
		users:    make(map[string]model.User),
		tokens:   make(map[string]string),
	}

	if err := s.loadOrSeed(); err != nil {
		return nil, err
	}

	return s, nil
}

func hashPassword(plain string) string {
	hasher := sha256.New()
	hasher.Write([]byte("saniapet_salt_" + plain))
	return hex.EncodeToString(hasher.Sum(nil))
}

func generateToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *UserStore) loadOrSeed() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, err := os.Stat(s.filePath); err == nil {
		data, err := os.ReadFile(s.filePath)
		if err == nil && len(data) > 0 {
			var list []model.User
			if err := json.Unmarshal(data, &list); err == nil && len(list) > 0 {
				for _, u := range list {
					s.users[strings.ToLower(u.Email)] = u
				}
				return nil
			}
		}
	}

	// Default demo user with complete tutor profile
	demoUser := model.User{
		ID:        "user_demo",
		Email:     "demo@saniapet.cl",
		Password:  hashPassword("demo123"),
		Nombre:    "Jota Robles",
		Rut:       "17.654.321-K",
		Telefono:  "+56 9 8765 4321",
		Direccion: "Av. Providencia 1234, Santiago",
		CreatedAt: time.Now().Format("02/01/2006"),
	}

	s.users[strings.ToLower(demoUser.Email)] = demoUser
	return s.saveUnsafe()
}

func (s *UserStore) saveUnsafe() error {
	list := make([]model.User, 0, len(s.users))
	for _, u := range s.users {
		list = append(list, u)
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

// Register creates a new user account
func (s *UserStore) Register(req model.RegisterRequest) (*model.User, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" {
		return nil, "", errors.New("el correo electrónico es requerido")
	}

	if _, exists := s.users[email]; exists {
		return nil, "", errors.New("ya existe una cuenta registrada con este correo")
	}

	if len(req.Password) < 4 {
		return nil, "", errors.New("la contraseña debe tener al menos 4 caracteres")
	}

	user := model.User{
		ID:        fmt.Sprintf("user_%d", time.Now().UnixNano()),
		Email:     email,
		Password:  hashPassword(req.Password),
		Nombre:    strings.TrimSpace(req.Nombre),
		Rut:       strings.TrimSpace(req.Rut),
		Telefono:  strings.TrimSpace(req.Telefono),
		Direccion: strings.TrimSpace(req.Direccion),
		CreatedAt: time.Now().Format("02/01/2006"),
	}

	s.users[email] = user
	_ = s.saveUnsafe()

	token := generateToken()
	s.tokens[token] = email

	return &user, token, nil
}

// Login verifies credentials and generates session token
func (s *UserStore) Login(email, password string) (*model.User, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	user, exists := s.users[cleanEmail]
	if !exists {
		return nil, "", errors.New("correo o contraseña incorrectos")
	}

	if user.Password != hashPassword(password) {
		return nil, "", errors.New("correo o contraseña incorrectos")
	}

	token := generateToken()
	s.tokens[token] = cleanEmail

	return &user, token, nil
}

// ValidateToken verifies token and returns user
func (s *UserStore) ValidateToken(token string) (*model.User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	email, ok := s.tokens[token]
	if !ok {
		return nil, false
	}

	user, exists := s.users[email]
	if !exists {
		return nil, false
	}

	return &user, true
}

// UpdateProfile updates the tutor's unified information
func (s *UserStore) UpdateProfile(token string, req model.UserProfileUpdateRequest) (*model.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	email, ok := s.tokens[token]
	if !ok {
		return nil, errors.New("sesión no válida")
	}

	user, exists := s.users[email]
	if !exists {
		return nil, errors.New("usuario no encontrado")
	}

	if strings.TrimSpace(req.Nombre) != "" {
		user.Nombre = strings.TrimSpace(req.Nombre)
	}
	user.Rut = strings.TrimSpace(req.Rut)
	user.Telefono = strings.TrimSpace(req.Telefono)
	user.Direccion = strings.TrimSpace(req.Direccion)

	s.users[email] = user
	_ = s.saveUnsafe()

	return &user, nil
}

// Logout removes token session
func (s *UserStore) Logout(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.tokens, token)
}
