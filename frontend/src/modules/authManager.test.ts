import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthManager, AuthState, PublicUser } from "./authManager.js";
import { ApiClient } from "./apiClient.js";
let mockUser: PublicUser = {
    "id": "user-1",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user",
    "emailVerified": true,
    "createdAt": "2026-01-01T00:00:00Z"
};
let mockAuthResponse: { user: PublicUser; accessToken: string; refreshToken: string } = {
    "user": mockUser,
    "accessToken": "header." + btoa(JSON.stringify({ "exp": Math.floor(Date.now() / 1000) + 3600 })) + ".signature",
    "refreshToken": "refresh-token-123"
};
describe("AuthManager", function () {
    beforeEach(function () {
        localStorage.clear();
        AuthManager.resetInstance();
        ApiClient.resetInstance();
    });
    afterEach(function () {
        localStorage.clear();
        AuthManager.resetInstance();
        ApiClient.resetInstance();
        vi.restoreAllMocks();
    });
    describe("getInstance", function () {
        it("should create singleton instance", function () {
            let manager: AuthManager = AuthManager.getInstance();
            expect(manager).toBeInstanceOf(AuthManager);
        });
        it("should return same instance on subsequent calls", function () {
            let manager1: AuthManager = AuthManager.getInstance();
            let manager2: AuthManager = AuthManager.getInstance();
            expect(manager1).toBe(manager2);
        });
    });
    describe("getState", function () {
        it("should return default unauthenticated state", function () {
            let manager: AuthManager = AuthManager.getInstance();
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeNull();
            expect(state.refreshToken).toBeNull();
        });
    });
    describe("register", function () {
        it("should call API and update state on successful registration", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            let user: PublicUser = await manager.register("test@example.com", "password123", "Test User");
            expect(user.id).toBe("user-1");
            expect(user.email).toBe("test@example.com");
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.accessToken).toBe(mockAuthResponse.accessToken);
            expect(state.refreshToken).toBe(mockAuthResponse.refreshToken);
        });
        it("should send correct payload to register endpoint", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            await manager.register("test@example.com", "password123", "Test User");
            let callUrl: string = fetchSpy.mock.calls[0][0];
            expect(callUrl).toContain("/api/v1/auth/register");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            let body: { email: string; password: string; name: string } = JSON.parse(callArgs.body as string);
            expect(body.email).toBe("test@example.com");
            expect(body.password).toBe("password123");
            expect(body.name).toBe("Test User");
        });
    });
    describe("login", function () {
        it("should call API and update state on successful login", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            let user: PublicUser = await manager.login("test@example.com", "password123");
            expect(user.email).toBe("test@example.com");
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).not.toBeNull();
        });
        it("should send credentials to login endpoint", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            await manager.login("test@example.com", "password123");
            let callUrl: string = fetchSpy.mock.calls[0][0];
            expect(callUrl).toContain("/api/v1/auth/login");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            let body: { email: string; password: string } = JSON.parse(callArgs.body as string);
            expect(body.email).toBe("test@example.com");
            expect(body.password).toBe("password123");
        });
    });
    describe("logout", function () {
        it("should clear state and tokens", function () {
            let manager: AuthManager = AuthManager.getInstance();
            let initialState: AuthState = {
                "isAuthenticated": true,
                "user": mockUser,
                "accessToken": "some-token",
                "refreshToken": "some-refresh"
            };
            manager["state"] = initialState;
            manager.logout();
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeNull();
            expect(state.refreshToken).toBeNull();
        });
    });
    describe("subscribe", function () {
        it("should notify subscribers on state change", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            let receivedStates: AuthState[] = [];
            let callback: Function = function (state: AuthState) {
                receivedStates.push(state);
            };
            let unsubscribe: Function = manager.subscribe(callback);
            await manager.login("test@example.com", "password123");
            expect(receivedStates.length).toBeGreaterThan(0);
            let lastState: AuthState = receivedStates[receivedStates.length - 1];
            expect(lastState.isAuthenticated).toBe(true);
            unsubscribe();
        });
        it("should stop notifying after unsubscribe", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            let callCount: number = 0;
            let callback: Function = function () {
                callCount = callCount + 1;
            };
            let unsubscribe: Function = manager.subscribe(callback);
            unsubscribe();
            manager.logout();
            expect(callCount).toBe(0);
        });
    });
    describe("state persistence", function () {
        it("should persist state to localStorage after login", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            await manager.login("test@example.com", "password123");
            let stored: string | null = localStorage.getItem("chemutil_auth");
            expect(stored).not.toBeNull();
            let parsed: { isAuthenticated: boolean; accessToken: string } = JSON.parse(stored as string);
            expect(parsed.isAuthenticated).toBe(true);
            expect(parsed.accessToken).toBe(mockAuthResponse.accessToken);
        });
        it("should clear localStorage on logout", function () {
            let manager: AuthManager = AuthManager.getInstance();
            manager["state"] = {
                "isAuthenticated": true,
                "user": mockUser,
                "accessToken": "token",
                "refreshToken": "refresh"
            };
            manager["persistState"]();
            manager.logout();
            let stored: string | null = localStorage.getItem("chemutil_auth");
            expect(stored).not.toBeNull();
            let parsed: { isAuthenticated: boolean } = JSON.parse(stored as string);
            expect(parsed.isAuthenticated).toBe(false);
        });
    });
    describe("restoreSession", function () {
        it("should restore session from localStorage", async function () {
            let storedData: Record<string, unknown> = {
                "isAuthenticated": true,
                "user": mockUser,
                "accessToken": "restored-token",
                "refreshToken": "restored-refresh",
                "tokenExpiry": Date.now() + 3600000
            };
            localStorage.setItem("chemutil_auth", JSON.stringify(storedData));
            let manager: AuthManager = AuthManager.getInstance();
            await manager.restoreSession();
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.accessToken).toBe("restored-token");
        });
        it("should remain unauthenticated when no stored data", async function () {
            let manager: AuthManager = AuthManager.getInstance();
            await manager.restoreSession();
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(false);
        });
        it("should logout on corrupted stored data", async function () {
            localStorage.setItem("chemutil_auth", "not-valid-json{{{");
            let manager: AuthManager = AuthManager.getInstance();
            await manager.restoreSession();
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(false);
        });
    });
    describe("handleOAuthCallback", function () {
        it("should call API and set state on successful OAuth callback", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve(mockAuthResponse); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let manager: AuthManager = AuthManager.getInstance();
            let user: PublicUser = await manager.handleOAuthCallback("google", "oauth-code-123");
            expect(user.email).toBe("test@example.com");
            let state: AuthState = manager.getState();
            expect(state.isAuthenticated).toBe(true);
            let callUrl: string = fetchSpy.mock.calls[0][0];
            expect(callUrl).toContain("/api/v1/auth/oauth/google/callback");
        });
    });
});
