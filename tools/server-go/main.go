package main

import (
	"flag"
	"fmt"
	"log"
	"mime"
	"net"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

func main() {
	var (
		host = flag.String("host", getenv("HOST", "127.0.0.1"), "host to listen on")
		port = flag.Int("port", getenvInt("PORT", 4173), "port to listen on")
		dir  = flag.String("dir", getenv("DIST_DIR", "dist"), "directory to serve (should contain index.html)")
	)
	flag.Parse()

	distDir, err := filepath.Abs(*dir)
	if err != nil {
		log.Fatalf("invalid dir: %v", err)
	}

	indexPath := filepath.Join(distDir, "index.html")
	if !isFile(indexPath) {
		log.Fatalf("cannot find index.html at: %s", indexPath)
	}

	// Basic mime types
	_ = mime.AddExtensionType(".js", "text/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".mjs", "text/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".css", "text/css; charset=utf-8")
	_ = mime.AddExtensionType(".svg", "image/svg+xml")

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Decode URL path, keep it safe and inside distDir
		reqPath := r.URL.Path
		if reqPath == "" || reqPath == "/" {
			serveFile(w, r, indexPath)
			return
		}
		clean := path.Clean("/" + reqPath) // force absolute so Clean can't escape
		clean = strings.TrimPrefix(clean, "/")
		candidate := filepath.Join(distDir, filepath.FromSlash(clean))

		// Try static file paths
		try := []string{
			candidate,
			candidate + ".html",
			filepath.Join(candidate, "index.html"),
		}
		for _, p := range try {
			if isFile(p) {
				serveFile(w, r, p)
				return
			}
		}

		// SPA fallback
		serveFile(w, r, indexPath)
	})

	addr := net.JoinHostPort(*host, fmt.Sprintf("%d", *port))
	srv := &http.Server{
		Addr:              addr,
		Handler:           withLogging(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("TaskLedger running at http://%s", addr)
	log.Printf("Serving: %s", distDir)
	log.Fatal(srv.ListenAndServe())
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		_ = start
	})
}

func serveFile(w http.ResponseWriter, r *http.Request, filePath string) {
	// Let http.ServeFile handle range requests and caching headers reasonably.
	http.ServeFile(w, r, filePath)
}

func isFile(p string) bool {
	fi, err := os.Stat(p)
	return err == nil && fi.Mode().IsRegular()
}

func getenv(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}

func getenvInt(k string, def int) int {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	var out int
	_, err := fmt.Sscanf(v, "%d", &out)
	if err != nil {
		return def
	}
	return out
}

