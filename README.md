# SSE Status Server (Go w/ React.js and D3.js)
Production-grade SSE (Server-Sent-Events) Status Server Architecture Workflow using Go, GoFr w/ React.js/D3.js Client Application

SSE provides Uni-Directional (Server-to-Client) Real-Time Texttual Event Streaming (live feeds, live feed display, live progress updates). 

The Go GoFr server is configured to use SSE as follows.

```go
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

    ...

// Continuously writes events
fmt.Fprintf(w, "id: %s\nevent: %s\ndata: %s\n\n", eventID, eventType, jsonData)
flusher.Flush() // Immediately sends to client
```


## SSE vs WebSockets

- SSE is Uni-Directional (server-to-client), WebSockets is Bi-Directional
- SSE uses HTTP/HTTPS, WebSockets uses WS/WSS
- SSE provides Pre-Integrated Auto-Reconnect, WebSockets does NOT
- SSE is Firewall Adaptive, WebSockets is NOT
- SSE Message Format is Text-ONLY, WebSockets Message Format is Text and Binary
- Performance Overhead is lower with SEE and higher with WebSockets




## Create the Client React.js App

```shell
npx create-react-app client
cd client
npm install d3
```

or using `Vite` as `npx create-react-app` is now deprecated.

```shell
npm create vite@latest client -- --template react
cd client
npm install d3
npm run dev
```


## Executing the Server

To run the server (not as a container)

```shell
make run
```

To run the server as a container

```shell
make docker-deploy
make docker-run
```



## Executing the Client 

To run the client (not as a container)

```shell
make install   # Install the client app package dependencies
make start
```

To run the client as a container

```shell
make docker-deploy
make docker-run
```