package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

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

	// Start a separate HTTP server for SSE on port 8001
	go func() {
		sseServer := http.NewServeMux()
		sseServer.HandleFunc("/sse", func(w http.ResponseWriter, r *http.Request) {
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

		fmt.Println("SSE server starting on port 8001...")
		if err := http.ListenAndServe(":8001", sseServer); err != nil {
			log.Printf("SSE server error: %v", err)
		}
	}()

	// Simple info endpoint on GoFr
	app.GET("/sse-info", func(ctx *gofr.Context) (interface{}, error) {
		return map[string]string{
			"message":    "SSE endpoint is available at http://localhost:8001/sse",
			"disconnect": "POST to /disconnect/{clientId} on this server (port 8000)",
		}, nil
	})

	// Regular GoFr routes
	app.POST("/disconnect/{clientId}", sseHandler.HandleDisconnect)

	// Start the status service
	statusService.Start()

	// Set GOFR_TELEMETRY to false to reduce noise
	os.Setenv("GOFR_TELEMETRY", "false")

	// Start the GoFr server
	app.Run()
}
