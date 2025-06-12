package main

import (
	"net/http"

	"github.com/isgo-golgo13/sse-status-server/internal/handlers"
	"github.com/isgo-golgo13/sse-status-server/internal/services"
	"github.com/isgo-golgo13/sse-status-server/pkg/sse"
	"gofr.dev/pkg/gofr"
)

func main() {
	// Initialize GoFr app
	app := gofr.New()

	// Initialize eventcaster
	eventcaster := sse.NewEventCaster()

	// Initialize services
	statusService := services.NewStatusService(eventcaster)

	// Initialize handlers
	sseHandler := handlers.NewSSEHandler(eventcaster, statusService)

	// Add native HTTP handler for SSE endpoint (bypasses GoFr for better streaming)
	http.HandleFunc("/sse", func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers directly for SSE endpoint
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		sseHandler.HandleSSEHTTP(w, r)
	})

	// Regular GoFr routes
	app.POST("/disconnect/{clientId}", sseHandler.HandleDisconnect)

	// Start the status service
	statusService.Start()

	// Start the server
	app.Run()
}
