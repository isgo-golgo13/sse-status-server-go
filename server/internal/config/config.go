package config

// Config holds all configuration for the server
type Config struct {
	Port       int
	EnableCORS bool
}

// Option is a functional option for Config
type Option func(*Config)

// New creates a new Config with the given options
func New(opts ...Option) *Config {
	cfg := &Config{
		Port:       8080,
		EnableCORS: false,
	}

	for _, opt := range opts {
		opt(cfg)
	}

	return cfg
}

// WithPort sets the server port
func WithPort(port int) Option {
	return func(c *Config) {
		c.Port = port
	}
}

// WithCORS enables/disables CORS
func WithCORS(enable bool) Option {
	return func(c *Config) {
		c.EnableCORS = enable
	}
}
