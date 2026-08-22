import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DebugLogger } from "./debugLogger.js";

describe("DebugLogger", () => {
    let debugSpy: ReturnType<typeof vi.spyOn>;
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        DebugLogger.resetInstance();
        debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
        infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        DebugLogger.resetInstance();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(DebugLogger.getInstance()).toBe(DebugLogger.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = DebugLogger.getInstance();
        DebugLogger.resetInstance();
        const second = DebugLogger.getInstance();
        expect(first).not.toBe(second);
    });

    describe("default level (info)", () => {
        it("does not log debug messages by default", () => {
            DebugLogger.getInstance().debug("debug-msg");
            expect(debugSpy).not.toHaveBeenCalled();
        });

        it("logs info messages by default", () => {
            DebugLogger.getInstance().info("info-msg");
            expect(infoSpy).toHaveBeenCalled();
        });

        it("logs warn messages by default", () => {
            DebugLogger.getInstance().warn("warn-msg");
            expect(warnSpy).toHaveBeenCalled();
        });

        it("logs error messages by default", () => {
            DebugLogger.getInstance().error("error-msg");
            expect(errorSpy).toHaveBeenCalled();
        });
    });

    describe("setLevel", () => {
        it("setLevel('debug') enables debug logging", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("debug");
            logger.debug("hello");
            expect(debugSpy).toHaveBeenCalled();
        });

        it("setLevel('warn') suppresses info and debug messages", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("warn");
            logger.debug("d");
            logger.info("i");
            expect(debugSpy).not.toHaveBeenCalled();
            expect(infoSpy).not.toHaveBeenCalled();
        });

        it("setLevel('error') suppresses warn messages", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("error");
            logger.warn("w");
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("setLevel('error') still logs error messages", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("error");
            logger.error("e");
            expect(errorSpy).toHaveBeenCalled();
        });
    });

    describe("message formatting", () => {
        it("formats debug messages with [DEBUG] prefix", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("debug");
            logger.debug("hello");
            expect(debugSpy).toHaveBeenCalledWith("[DEBUG] hello", {});
        });

        it("formats info messages with [INFO] prefix", () => {
            DebugLogger.getInstance().info("hello");
            expect(infoSpy).toHaveBeenCalledWith("[INFO] hello", {});
        });

        it("formats warn messages with [WARN] prefix", () => {
            DebugLogger.getInstance().warn("hello");
            expect(warnSpy).toHaveBeenCalledWith("[WARN] hello", {});
        });

        it("formats error messages with [ERROR] prefix", () => {
            DebugLogger.getInstance().error("hello");
            expect(errorSpy).toHaveBeenCalledWith("[ERROR] hello", {});
        });
    });

    describe("context argument", () => {
        it("passes context object to debug when provided", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("debug");
            const ctx = { user: "alice", count: 3 };
            logger.debug("ctx-msg", ctx);
            expect(debugSpy).toHaveBeenCalledWith("[DEBUG] ctx-msg", ctx);
        });

        it("passes context object to info when provided", () => {
            DebugLogger.getInstance().info("ctx-msg", { foo: "bar" });
            expect(infoSpy).toHaveBeenCalledWith("[INFO] ctx-msg", { foo: "bar" });
        });

        it("passes context object to warn when provided", () => {
            DebugLogger.getInstance().warn("ctx-msg", { code: 42 });
            expect(warnSpy).toHaveBeenCalledWith("[WARN] ctx-msg", { code: 42 });
        });

        it("passes context object to error when provided", () => {
            DebugLogger.getInstance().error("ctx-msg", { err: "boom" });
            expect(errorSpy).toHaveBeenCalledWith("[ERROR] ctx-msg", { err: "boom" });
        });

        it("defaults context to empty object when omitted for debug", () => {
            const logger = DebugLogger.getInstance();
            logger.setLevel("debug");
            logger.debug("no-ctx");
            expect(debugSpy).toHaveBeenCalledWith("[DEBUG] no-ctx", {});
        });
    });

    describe("production mode", () => {
        // detectProduction reads import.meta.env.PROD (the Vite build flag).
        function withProdMode(fn: () => void): void {
            const env = import.meta.env as { PROD: boolean };
            const originalProd = env.PROD;
            env.PROD = true;
            try {
                fn();
            } finally {
                env.PROD = originalProd;
                DebugLogger.resetInstance();
            }
        }

        it("defaults to warn level when built in production mode", () => {
            withProdMode(function (): void {
                DebugLogger.resetInstance();
                const logger = DebugLogger.getInstance();
                logger.debug("d");
                logger.info("i");
                expect(debugSpy).not.toHaveBeenCalled();
                expect(infoSpy).not.toHaveBeenCalled();
                logger.warn("w");
                expect(warnSpy).toHaveBeenCalled();
            });
        });

        it("does not allow setting level below warn in production", () => {
            withProdMode(function (): void {
                DebugLogger.resetInstance();
                const logger = DebugLogger.getInstance();
                logger.setLevel("debug");
                logger.debug("d");
                expect(debugSpy).not.toHaveBeenCalled();
            });
        });

        it("allows setting warn level in production", () => {
            withProdMode(function (): void {
                DebugLogger.resetInstance();
                const logger = DebugLogger.getInstance();
                logger.setLevel("warn");
                logger.warn("w");
                expect(warnSpy).toHaveBeenCalled();
            });
        });

        it("allows setting error level in production", () => {
            withProdMode(function (): void {
                DebugLogger.resetInstance();
                const logger = DebugLogger.getInstance();
                logger.setLevel("error");
                logger.error("e");
                expect(errorSpy).toHaveBeenCalled();
            });
        });
    });

    describe("detectProduction fallback", () => {
        it("defaults to non-production when NODE_ENV is development", () => {
            vi.stubEnv("NODE_ENV", "development");
            DebugLogger.resetInstance();
            const logger = DebugLogger.getInstance();
            logger.setLevel("debug");
            logger.debug("d");
            expect(debugSpy).toHaveBeenCalled();
            vi.unstubAllEnvs();
        });

        it("defaults to non-production when NODE_ENV is test", () => {
            vi.stubEnv("NODE_ENV", "test");
            DebugLogger.resetInstance();
            const logger = DebugLogger.getInstance();
            logger.setLevel("debug");
            logger.debug("d");
            expect(debugSpy).toHaveBeenCalled();
            vi.unstubAllEnvs();
        });
    });
});
