package config

import "os"

type Config struct {
	AppName string
	Port    string
	AppEnv  string
	DataDir string
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

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "./data"
	}

	return &Config{
		AppName: appName,
		Port:    port,
		AppEnv:  appEnv,
		DataDir: dataDir,
	}
}
