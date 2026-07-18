# Makefile for the C titrate module.
#
# Targets:
#   make          - build the libtitrate static library
#   make test     - compile and run the test suite
#   make clean    - remove build artifacts
#   make run      - build and run the demo CLI
#
# Requires a C99 compiler (gcc, clang, tcc) and the C math library.

CC ?= cc
CFLAGS ?= -std=c99 -Wall -Wextra -Wpedantic -O2
LDFLAGS ?= -lm

.PHONY: all test clean run

all: libtitrate.a

libtitrate.a: titrate.o
	ar rcs $@ $^

titrate.o: titrate.c titrate.h
	$(CC) $(CFLAGS) -c -o $@ titrate.c

test_titrate: test_titrate.c titrate.c titrate.h
	$(CC) $(CFLAGS) -o $@ test_titrate.c titrate.c $(LDFLAGS)

test: test_titrate
	./test_titrate

clean:
	rm -f libtitrate.a titrate.o test_titrate
