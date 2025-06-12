package main

import (
	"github.com/isgo-golgo13/sse-status-server/internal/config"
	"github.com/isgo-golgo13/sse-status-server/internal/handlers"
	"github.com/isgo-golgo13/sse-status-server/internal/services"
	"github.com/isgo-golgo13/sse-status-server/pkg/sse"
	"gofr.dev/pkg/gofr"
)

func main() {
	// Initialize configuration
	cfg := config.New(
		config.WithPort(8080),
		config.WithCORS(true),
	)

	// Initialize GoFr app
	app := gofr.New()

	// Configure CORS
	if cfg.EnableCORS {
		app.UseMiddleware(corsMiddleware)
	}

	// Initialize eventcaster
	eventcaster := sse.NewEventCaster()

	// Initialize services
	statusService := services.NewStatusService(eventcaster)

	// Initialize handlers
	sseHandler := handlers.NewSSEHandler(eventcaster, statusService)

	// Routes
	app.GET("/sse", sseHandler.HandleSSE)
	app.POST("/disconnect/{clientId}", sseHandler.HandleDisconnect)

	// Start the status service
	statusService.Start()

	// Start the server
	app.Run()
}

func corsMiddleware(handler gofr.Handler) gofr.Handler {
	return gofr.HandlerFunc(func(ctx *gofr.Context) (interface{}, error) {
		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		ctx.Header("Access-Control-Allow-Headers", "Content-Type, X-Client-ID")
		ctx.Header("Cache-Control", "no-cache")

		if ctx.Request.Method == "OPTIONS" {
			return nil, nil
		}

		return handler(ctx)
	})
}
