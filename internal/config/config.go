package config

import "os"

type Config struct {
	AppName    string
	AppVersion string
	Port       string
	AppEnv     string
	DataDir    string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	appName := os.Getenv("APP_NAME")
	if appName == "" {
		appName = "Sania Pet — Ficha Médica Veterinaria"
	}

	appVersion := os.Getenv("APP_VERSION")
	if appVersion == "" {
		appVersion = "v0.1"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}

	return &Config{
		AppName:    appName,
		AppVersion: appVersion,
		Port:       port,
		AppEnv:     appEnv,
		DataDir:    dataDir,
	}
}
