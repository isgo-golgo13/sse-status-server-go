package handlers

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/isgo-golgo13/sse-status-server/internal/services"
	"github.com/isgo-golgo13/sse-status-server/internal/structures"
	"github.com/isgo-golgo13/sse-status-server/pkg/sse"
	"gofr.dev/pkg/gofr"
)

// SSEHandler handles SSE connections
type SSEHandler struct {
	eventcaster   *sse.EventCaster
	statusService *services.StatusService
}

// NewSSEHandler creates a new SSEHandler
func NewSSEHandler(eventcaster *sse.EventCaster, statusService *services.StatusService) *SSEHandler {
	return &SSEHandler{
		eventcaster:   eventcaster,
		statusService: statusService,
	}
}

// HandleSSEHTTP handles SSE connections using native HTTP
func (h *SSEHandler) HandleSSEHTTP(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Create client
	clientID := uuid.New().String()
	client := &sse.Client{
		ID:     clientID,
		Events: make(chan structures.Event, 10),
	}

	// Register client
	h.eventcaster.Register(client)

	// Send initial connection event
	fmt.Fprintf(w, "id: %s\nevent: connected\ndata: {\"clientId\":\"%s\"}\n\n", clientID, clientID)
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}

	// Ensure cleanup
	defer h.eventcaster.Unregister(clientID)

	// Listen for events or client disconnect
	for {
		select {
		case event, ok := <-client.Events:
			if !ok {
				return
			}
			fmt.Fprint(w, sse.SerializeEvent(event))
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}
		case <-r.Context().Done():
			return
		}
	}
}

// HandleDisconnect handles client disconnection requests
func (h *SSEHandler) HandleDisconnect(ctx *gofr.Context) (interface{}, error) {
	clientID := ctx.PathParam("clientId")
	if clientID == "" {
		return nil, fmt.Errorf("client ID required")
	}

	h.eventcaster.Unregister(clientID)
	return map[string]string{"status": "disconnected", "clientId": clientID}, nil
}
