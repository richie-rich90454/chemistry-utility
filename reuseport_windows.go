//go:build windows

package main

import (
	"log"
	"strings"
	"syscall"
)

func listenControl(network, address string, c syscall.RawConn) error {
	if network == "tcp6" || strings.Contains(address, "[::]") {
		return c.Control(func(fd uintptr) {
			err := syscall.SetsockoptInt(syscall.Handle(fd), syscall.IPPROTO_IPV6, syscall.IPV6_V6ONLY, 0)
			if err != nil {
				log.Printf("Warning: failed to set IPV6_V6ONLY=0: %v", err)
			}
		})
	}
	return nil
}
