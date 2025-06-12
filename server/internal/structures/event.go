package models

import "time"

// Event represents an SSE event
type Event struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Data      string    `json:"data"`
	Timestamp time.Time `json:"timestamp"`
}

// StatusEvent represents a status update event
type StatusEvent struct {
	Status    string    `json:"status"`
	Message   string    `json:"message"`
	CPU       float64   `json:"cpu"`
	Memory    float64   `json:"memory"`
	Timestamp time.Time `json:"timestamp"`
}
