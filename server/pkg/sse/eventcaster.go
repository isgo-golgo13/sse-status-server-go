package sse

import (
	"encoding/json"
	"fmt"
	"sync"

	models "github.com/isgo-golgo13/sse-status-server/internal/structures"
)

// Client represents an SSE client
type Client struct {
	ID     string
	Events chan models.Event
}

// EventCaster manages SSE connections
type EventCaster struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan string
	broadcast  chan models.Event
	mu         sync.RWMutex
}

// NewEventCaster creates a new EventCaster
func NewEventCaster() *EventCaster {
	ec := &EventCaster{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan string),
		broadcast:  make(chan models.Event),
	}

	go ec.run()
	return ec
}

func (ec *EventCaster) run() {
	for {
		select {
		case client := <-ec.register:
			ec.mu.Lock()
			ec.clients[client.ID] = client
			ec.mu.Unlock()

		case clientID := <-ec.unregister:
			ec.mu.Lock()
			if client, ok := ec.clients[clientID]; ok {
				close(client.Events)
				delete(ec.clients, clientID)
			}
			ec.mu.Unlock()

		case event := <-ec.broadcast:
			ec.mu.RLock()
			for _, client := range ec.clients {
				select {
				case client.Events <- event:
				default:
					close(client.Events)
					delete(ec.clients, client.ID)
				}
			}
			ec.mu.RUnlock()
		}
	}
}

// Register adds a new client
func (ec *EventCaster) Register(client *Client) {
	ec.register <- client
}

// Unregister removes a client
func (ec *EventCaster) Unregister(clientID string) {
	ec.unregister <- clientID
}

// CastEvent sends an event to all clients
func (ec *EventCaster) CastEvent(event models.Event) {
	ec.broadcast <- event
}

// SerializeEvent formats an event for SSE transmission
func SerializeEvent(event models.Event) string {
	data, _ := json.Marshal(event)
	return fmt.Sprintf("id: %s\nevent: %s\ndata: %s\n\n", event.ID, event.Type, string(data))
}
