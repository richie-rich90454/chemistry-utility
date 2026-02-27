package main

import(
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)
const PORT=6005
func main(){
	dir, err:=os.Getwd()
	if err!=nil{
		log.Fatal("Failed to get working directory:", err)
	}
	distPath:=filepath.Join(dir, "dist")
	app:=fiber.New(fiber.Config{
		DisableStartupMessage: false,
		ErrorHandler: func(c *fiber.Ctx, err error) error{
			log.Printf("Unexpected error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal Server Error",
			})
		},
	})
	app.Use(func(c *fiber.Ctx) error{
		err:=c.Next()
		c.Response().Header.Del("X-Powered-By")
		return err
	})
	app.Use(recover.New())
	app.Use(func(c *fiber.Ctx) error{
		if strings.Contains(c.OriginalURL(), "://")&&!strings.HasPrefix(c.OriginalURL(), "/"){
			return c.Status(fiber.StatusBadRequest).SendString("Bad Request")
		}
		return c.Next()
	})
	app.Get("/api/ptable", func(c *fiber.Ctx) error{
		if c.Get("X-Requested-With")!="XMLHttpRequest"{
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   "Forbidden",
				"message": "Direct access to API is not allowed",
			})
		}
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		filePath:=filepath.Join(distPath, "ptable.json")
		if _, err:=os.Stat(filePath); os.IsNotExist(err){
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":   "Server Error",
				"message": "Data file not found",
			})
		}
		return c.SendFile(filePath)
	})
	app.Get("/ptable.json", func(c *fiber.Ctx) error{
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Forbidden",
			"message": "Direct access to file is not allowed",
		})
	})
	app.Get("/*", func(c *fiber.Ctx) error{
		path:=c.Path()
		if strings.HasPrefix(path, "/api/"){
			return c.Next()
		}
		if path=="/"{
			c.Set("Cache-Control", "no-store")
			return c.SendFile(filepath.Join(distPath, "index.html"))
		}
		filePath:=filepath.Join(distPath, path)
		if _, err:=os.Stat(filePath); err==nil{
			// Set cache headers based on file type
			if strings.HasSuffix(path, ".html"){
				c.Set("Cache-Control", "no-store")
			}else{
				c.Set("Cache-Control", "public, max-age=86400")
			}
			return c.SendFile(filePath)
		}
		c.Set("Cache-Control", "no-store")
		return c.SendFile(filepath.Join(distPath, "index.html"))
	})
	go func(){
		log.Printf("Server running at http://localhost:%d", PORT)
		log.Printf("Serving static files from: %s", distPath)
		if err:=app.Listen(":"+strconv.Itoa(PORT)); err!=nil{
			log.Fatal("Failed to start server:", err)
		}
	}()
	gracefulShutdown(app)
}
func gracefulShutdown(app *fiber.App){
	sigChan:=make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	sig:=<-sigChan
	log.Printf("\n%s received. Starting graceful shutdown...", sig)
	done:=make(chan bool)
	go func(){
		shutdownTimeout:=10 * time.Second
		if err:=app.ShutdownWithTimeout(shutdownTimeout); err!=nil{
			log.Printf("Error during shutdown: %v", err)
		}
		done <- true
	}()
	select{
		case <-done:
			log.Println("Cleanup completed successfully")
		case <-time.After(11 * time.Second):
			log.Println("Forced shutdown due to timeout")
	}

	os.Exit(0)
}
func init(){
	log.SetFlags(log.LstdFlags | log.Lshortfile)
}