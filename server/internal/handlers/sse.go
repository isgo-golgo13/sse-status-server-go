package handlers

import (
	"fmt"

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

// HandleSSE handles SSE connections
func (h *SSEHandler) HandleSSE(ctx *gofr.Context) (interface{}, error) {
	// Set SSE headers
	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")

	// Create client
	clientID := uuid.New().String()
	client := &sse.Client{
		ID:     clientID,
		Events: make(chan structures.Event, 10),
	}

	// Register client
	h.eventcaster.Register(client)

	// Send initial connection event
	fmt.Fprintf(ctx.ResponseWriter, "id: %s\nevent: connected\ndata: {\"clientId\":\"%s\"}\n\n", clientID, clientID)
	flusher, ok := ctx.ResponseWriter.(interface{ Flush() })
	if ok {
		flusher.Flush()
	}

	// Ensure cleanup
	defer h.eventcaster.Unregister(clientID)

	// Listen for events
	for event := range client.Events {
		fmt.Fprint(ctx.ResponseWriter, sse.SerializeEvent(event))
		if ok {
			flusher.Flush()
		}
	}

	return nil, nil
}

// HandleDisconnect handles client disconnection requests
func (h *SSEHandler) HandleDisconnect(ctx *gofr.Context) (interface{}, error) {
	clientID := ctx.Param("clientId")
	if clientID == "" {
		return nil, fmt.Errorf("client ID required")
	}

	h.eventcaster.Unregister(clientID)
	return map[string]string{"status": "disconnected", "clientId": clientID}, nil
}
