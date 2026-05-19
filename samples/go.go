package main

import "log"

func main() {
	reqID := "req-1"
	err := run()

	log.Println("started")
	log.Printf("request id=%s", reqID)
	log.Fatal("fatal error")

	clog.Debugf1(reqID, "debug message")
	clog.Errorf("failed: %v", err)

	// The next two lines should not be dimmed by the built-in scanner.
	// clog.Infof("comment only")
	text := "log.Println(\"string only\")"
	_ = text
}

func run() error {
	return nil
}
