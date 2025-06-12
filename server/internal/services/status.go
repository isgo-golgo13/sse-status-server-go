package services

import (
	"encoding/json"
	"runtime"
	"time"

	"github.com/google/uuid"
	"github.com/isgo-golgo13/sse-status-server/internal/structures"
	"github.com/isgo-golgo13/sse-status-server/pkg/sse"
)

// StatusService generates status events
type StatusService struct {
	eventcaster *sse.EventCaster
	ticker      *time.Ticker
	done        chan bool
}

// NewStatusService creates a new StatusService
func NewStatusService(eventcaster *sse.EventCaster) *StatusService {
	return &StatusService{
		eventcaster: eventcaster,
		done:        make(chan bool),
	}
}

// Start begins generating status events
func (s *StatusService) Start() {
	s.ticker = time.NewTicker(30 * time.Second)
	go s.run()
}

// Stop stops generating status events
func (s *StatusService) Stop() {
	if s.ticker != nil {
		s.ticker.Stop()
	}
	s.done <- true
}

func (s *StatusService) run() {
	// Send initial status
	s.sendStatusEvent()

	for {
		select {
		case <-s.ticker.C:
			s.sendStatusEvent()
		case <-s.done:
			return
		}
	}
}

func (s *StatusService) sendStatusEvent() {
	// Get system stats
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	status := structures.StatusEvent{
		Status:    "healthy",
		Message:   "System operating normally",
		CPU:       float64(runtime.NumGoroutine()),
		Memory:    float64(m.Alloc / 1024 / 1024), // MB
		Timestamp: time.Now(),
	}

	data, _ := json.Marshal(status)

	event := structures.Event{
		ID:        uuid.New().String(),
		Type:      "status",
		Data:      string(data),
		Timestamp: time.Now(),
	}

	s.eventcaster.CastEvent(event)
}
