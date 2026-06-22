package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "6005"
	}

	distDir := "frontend/dist"

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	// Serve all static files from dist directory
	r.Static("/assets", filepath.Join(distDir, "assets"))
	r.Static("/src", filepath.Join(distDir, "src"))
	r.Static("/wailsjs", filepath.Join(distDir, "wailsjs"))
	r.StaticFile("/favicon.ico", filepath.Join(distDir, "favicon.ico"))
	r.StaticFile("/favicon.png", filepath.Join(distDir, "favicon.png"))
	r.StaticFile("/manifest.webmanifest", filepath.Join(distDir, "manifest.webmanifest"))
	r.StaticFile("/robots.txt", filepath.Join(distDir, "robots.txt"))
	r.StaticFile("/sitemap.xml", filepath.Join(distDir, "sitemap.xml"))
	r.StaticFile("/NotoSans-VariableFont_wdth,wght.ttf", filepath.Join(distDir, "NotoSans-VariableFont_wdth,wght.ttf"))
	r.StaticFile("/EBGaramond-VariableFont_wght.ttf", filepath.Join(distDir, "EBGaramond-VariableFont_wght.ttf"))
	r.StaticFile("/app-image.png", filepath.Join(distDir, "app-image.png"))
	r.StaticFile("/apple-touch-icon.png", filepath.Join(distDir, "apple-touch-icon.png"))
	r.StaticFile("/ptable.json", filepath.Join(distDir, "ptable.json"))

	// SPA fallback — serve index.html for all unmatched routes
	indexPath := filepath.Join(distDir, "index.html")
	r.NoRoute(func(c *gin.Context) {
		if _, err := os.Stat(indexPath); err != nil {
			c.String(http.StatusNotFound, "index.html not found — run `cd frontend && npm run build` first")
			return
		}
		c.File(indexPath)
	})

	log.Printf("Starting server on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed:", err)
	}
}
