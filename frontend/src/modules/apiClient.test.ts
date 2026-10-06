import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient, ApiError, ApiClientConfig } from "./apiClient.js";
describe("ApiClient", function () {
    beforeEach(function () {
        localStorage.clear();
        ApiClient.resetInstance();
    });
    afterEach(function () {
        localStorage.clear();
        ApiClient.resetInstance();
        vi.restoreAllMocks();
    });
    describe("getInstance", function () {
        it("should create instance with default config", function () {
            let client: ApiClient = ApiClient.getInstance();
            expect(client).toBeInstanceOf(ApiClient);
        });
        it("should return same instance on subsequent calls", function () {
            let client1: ApiClient = ApiClient.getInstance();
            let client2: ApiClient = ApiClient.getInstance();
            expect(client1).toBe(client2);
        });
        it("should create instance with custom config", function () {
            let config: ApiClientConfig = { "baseURL": "https://api.example.com", "timeout": 5000 };
            let client: ApiClient = ApiClient.getInstance(config);
            expect(client).toBeInstanceOf(ApiClient);
        });
    });
    describe("token storage", function () {
        it("should store token in memory and localStorage", function () {
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("test-jwt-token");
            expect(client.getToken()).toBe("test-jwt-token");
            let stored: string | null = localStorage.getItem("chemutil_auth");
            expect(stored).not.toBeNull();
            let parsed: { accessToken: string } = JSON.parse(stored as string);
            expect(parsed.accessToken).toBe("test-jwt-token");
        });
        it("should clear token from memory and localStorage", function () {
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("test-jwt-token");
            client.clearToken();
            expect(client.getToken()).toBeNull();
        });
        it("should return null when no token is set", function () {
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
        });
        it("should load token from localStorage on construction", function () {
            localStorage.setItem("chemutil_auth", JSON.stringify({ "accessToken": "saved-token" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBe("saved-token");
        });
    });
    describe("isOffline", function () {
        it("should return false when navigator.onLine is true", function () {
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            Object.defineProperty(navigator, "onLine", { "value": true, "configurable": true });
            expect(client.isOffline()).toBe(false);
        });
        it("should return true when navigator.onLine is false", function () {
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            Object.defineProperty(navigator, "onLine", { "value": false, "configurable": true });
            expect(client.isOffline()).toBe(true);
        });
        it("should return false without a navigator global", function () {
            vi.stubGlobal("navigator", undefined);
            try {
                let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
                expect(client.isOffline()).toBe(false);
            } finally {
                vi.unstubAllGlobals();
            }
        });
    });
    describe("request", function () {
        it("should include Authorization header when token is set", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "test" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "https://api.example.com", "timeout": 30000 });
            client.setToken("my-jwt");
            await client.get("/api/v1/test");
            expect(fetchSpy).toHaveBeenCalled();
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            let headers: Record<string, string> = callArgs.headers as Record<string, string>;
            expect(headers["Authorization"]).toBe("Bearer my-jwt");
        });
        it("should not include Authorization header when no token", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "test" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "https://api.example.com", "timeout": 30000 });
            await client.get("/api/v1/test");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            let headers: Record<string, string> = callArgs.headers as Record<string, string>;
            expect(headers["Authorization"]).toBeUndefined();
        });
        it("should construct URL from baseURL and path", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "test" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "https://api.example.com", "timeout": 30000 });
            await client.get("/api/v1/resource");
            expect(fetchSpy).toHaveBeenCalled();
            let url: string = fetchSpy.mock.calls[0][0];
            expect(url).toBe("https://api.example.com/api/v1/resource");
        });
        it("should send JSON body for POST requests", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "id": 1 }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.post("/api/v1/items", { "name": "test", "value": 42 });
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.method).toBe("POST");
            expect(callArgs.body).toBe(JSON.stringify({ "name": "test", "value": 42 }));
        });
        it("should parse RFC 7807 error on failure", async function () {
            let rfcError: Record<string, unknown> = {
                "type": "https://example.com/probs/out-of-stock",
                "title": "Item out of stock",
                "status": 422,
                "detail": "Item 123 is out of stock"
            };
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 422,
                "json": function () { return Promise.resolve(rfcError); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/api/v1/items/123");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
                expect(apiError.status).toBe(422);
                expect(apiError.type).toBe("https://example.com/probs/out-of-stock");
                expect(apiError.detail).toBe("Item 123 is out of stock");
            }
        });
        it("should throw ApiError with network error on fetch failure", async function () {
            let fetchSpy = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/api/v1/test");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
                expect(apiError.status).toBe(0);
                expect(apiError.detail).toBe("Network error");
            }
        });
    });
    describe("shorthand methods", function () {
        it("get should call request with GET method", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "ok" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            let result: { data: string } = await client.get<{ data: string }>("/test");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.method).toBe("GET");
            expect(result.data).toBe("ok");
        });
        it("post should call request with POST method", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "id": 1 }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.post("/test", { "key": "val" });
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.method).toBe("POST");
        });
        it("patch should call request with PATCH method", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "updated": true }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.patch("/test", { "key": "val" });
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.method).toBe("PATCH");
        });
        it("delete should call request with DELETE method", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "deleted": true }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.delete("/test");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.method).toBe("DELETE");
        });
    });
    describe("401 refresh flow", function () {
        it("refreshes token on 401 and retries request successfully", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": function () { return Promise.resolve({ "accessToken": "new-jwt", "refreshToken": "new-refresh" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "success" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "old-refresh" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "https://api.example.com", "timeout": 30000 });
            client.setToken("old-jwt");
            let result: { data: string } = await client.get<{ data: string }>("/api/v1/protected");
            expect(result.data).toBe("success");
            expect(fetchSpy).toHaveBeenCalledTimes(3);
            expect(client.getToken()).toBe("new-jwt");
        });
        it("refreshes token on 401 but retry fails with error", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": function () { return Promise.resolve({ "accessToken": "new-jwt", "refreshToken": "new-refresh" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 500,
                "json": function () { return Promise.resolve({ "type": "server-error", "detail": "Internal server error" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "old-refresh" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("old-jwt");
            try {
                await client.get("/api/v1/protected");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
                expect(apiError.status).toBe(0);
                expect(apiError.detail).toBe("Internal server error");
            }
        });
        it("refresh fails when no refresh token in storage", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("old-jwt");
            try {
                await client.get("/api/v1/protected");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
                expect(apiError.detail).toBe("Unauthorized");
            }
            expect(client.getToken()).toBeNull();
        });
        it("refresh fails when refresh endpoint returns error", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Refresh token expired" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "old-refresh" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("old-jwt");
            try {
                await client.get("/api/v1/protected");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
            }
            expect(client.getToken()).toBeNull();
        });
        it("does not attempt refresh on 401 when no token is set", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/api/v1/protected");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
            }
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });
        it("retry network error throws ApiError with status 0", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": function () { return Promise.resolve({ "accessToken": "new-jwt", "refreshToken": "new-refresh" }); }
            });
            fetchSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"));
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "old-refresh" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("old-jwt");
            try {
                await client.get("/api/v1/protected");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
                expect(apiError.status).toBe(0);
                expect(apiError.detail).toBe("Network error");
            }
        });
        it("refresh saves new refresh token to localStorage", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({
                "ok": false,
                "status": 401,
                "json": function () { return Promise.resolve({ "detail": "Unauthorized" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": function () { return Promise.resolve({ "accessToken": "new-jwt", "refreshToken": "new-refresh" }); }
            });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "ok" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "old-refresh", "otherKey": "val" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("old-jwt");
            await client.get("/api/v1/protected");
            let stored: string | null = localStorage.getItem("chemutil_auth");
            let parsed: { refreshToken: string; otherKey: string; accessToken: string } = JSON.parse(stored as string);
            expect(parsed.refreshToken).toBe("new-refresh");
            expect(parsed.otherKey).toBe("val");
            expect(parsed.accessToken).toBe("new-jwt");
        });
    });
    describe("error parsing edge cases", function () {
        it("returns default error values when body is null", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 500,
                "json": function () { return Promise.resolve(null); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/test");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError.status).toBe(0);
                expect(apiError.type).toBe("about:blank");
                expect(apiError.detail).toBe("Unknown error");
            }
        });
        it("falls back to title when detail is not provided", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 404,
                "json": function () { return Promise.resolve({ "title": "Resource not found" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/test");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError.detail).toBe("Resource not found");
            }
        });
        it("does not overwrite detail with title when detail is present", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 400,
                "json": function () { return Promise.resolve({ "title": "Bad Request", "detail": "Missing field" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/test");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError.detail).toBe("Missing field");
            }
        });
        it("handles response.json() throwing during error parsing", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 500,
                "json": function () { throw new Error("Invalid JSON"); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/test");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError).toBeInstanceOf(ApiError);
                expect(apiError.detail).toBe("Unknown error");
            }
        });
        it("handles non-object body in error parsing", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": false,
                "status": 500,
                "json": function () { return Promise.resolve("string error"); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            try {
                await client.get("/test");
                expect.fail("Should have thrown");
            } catch (e) {
                let apiError: ApiError = e as ApiError;
                expect(apiError.detail).toBe("Unknown error");
            }
        });
    });
    describe("token storage edge cases", function () {
        it("setToken preserves existing localStorage data", function () {
            localStorage.setItem("chemutil_auth", JSON.stringify({ "otherKey": "otherVal" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("my-token");
            let stored: string | null = localStorage.getItem("chemutil_auth");
            let parsed: { otherKey: string; accessToken: string } = JSON.parse(stored as string);
            expect(parsed.otherKey).toBe("otherVal");
            expect(parsed.accessToken).toBe("my-token");
        });
        it("clearToken does not throw when no stored data exists", function () {
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("temp");
            expect(function (): void {
                client.clearToken();
            }).not.toThrow();
            expect(client.getToken()).toBeNull();
        });
        it("clearToken removes tokens but preserves other data", function () {
            localStorage.setItem("chemutil_auth", JSON.stringify({ "accessToken": "jwt", "refreshToken": "refresh", "userId": 42 }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("jwt");
            client.clearToken();
            let stored: string | null = localStorage.getItem("chemutil_auth");
            let parsed: { userId: number; accessToken: string } = JSON.parse(stored as string);
            expect(parsed.userId).toBe(42);
            expect(parsed.accessToken).toBeUndefined();
        });
        it("loadToken handles corrupt localStorage data", function () {
            localStorage.setItem("chemutil_auth", "{invalid json}");
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
        });
        it("loadToken handles stored data without accessToken", function () {
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "rt" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
        });
    });
    describe("request with body", function () {
        it("PATCH sends JSON body", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "updated": true }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.patch("/items/1", { "name": "updated" });
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.method).toBe("PATCH");
            expect(callArgs.body).toBe(JSON.stringify({ "name": "updated" }));
        });
        it("GET does not send a body", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "data": "ok" }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.get("/data");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.body).toBeUndefined();
        });
        it("DELETE does not send a body", async function () {
            let fetchSpy = vi.fn().mockResolvedValue({
                "ok": true,
                "json": function () { return Promise.resolve({ "deleted": true }); }
            });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await client.delete("/items/1");
            let callArgs: RequestInit = fetchSpy.mock.calls[0][1];
            expect(callArgs.body).toBeUndefined();
        });
    });
});
describe("ApiError", function () {
    it("should set all properties correctly", function () {
        let error: ApiError = new ApiError(403, "https://example.com/probs/forbidden", "Access denied");
        expect(error.status).toBe(403);
        expect(error.type).toBe("https://example.com/probs/forbidden");
        expect(error.detail).toBe("Access denied");
        expect(error.message).toBe("Access denied");
        expect(error.name).toBe("ApiError");
    });
    it("should be an instance of Error", function () {
        let error: ApiError = new ApiError(500, "about:blank", "Server error");
        expect(error).toBeInstanceOf(Error);
    });
});
describe("ApiClient edge cases", function () {
    beforeEach(function () {
        localStorage.clear();
        ApiClient.resetInstance();
    });
    afterEach(function () {
        localStorage.clear();
        ApiClient.resetInstance();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });
    function okJson(payload: unknown, status: number = 200): unknown {
        return {
            "ok": status >= 200 && status < 300,
            "status": status,
            "json": function () { return Promise.resolve(payload); }
        };
    }
    describe("configure", function () {
        it("updates the config of an existing instance", async function () {
            let fetchSpy = vi.fn().mockResolvedValue(okJson({}));
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "https://old.example.com", "timeout": 30000 });
            ApiClient.configure({ "baseURL": "https://new.example.com", "timeout": 5000 });
            expect(ApiClient.getInstance()).toBe(client);
            await client.get("/x");
            expect(fetchSpy.mock.calls[0][0]).toBe("https://new.example.com/x");
        });
        it("creates the instance when none exists", async function () {
            let fetchSpy = vi.fn().mockResolvedValue(okJson({}));
            vi.stubGlobal("fetch", fetchSpy);
            ApiClient.configure({ "baseURL": "https://fresh.example.com", "timeout": 30000 });
            await ApiClient.getInstance().get("/y");
            expect(fetchSpy.mock.calls[0][0]).toBe("https://fresh.example.com/y");
        });
    });
    describe("token storage shapes", function () {
        it("loads nothing from corrupt auth storage", function () {
            localStorage.setItem("chemutil_auth", "{broken");
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
        });
        it("loads nothing from non-object auth storage", function () {
            localStorage.setItem("chemutil_auth", "[1, 2]");
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
        });
        it("loads nothing when the stored token is empty", function () {
            localStorage.setItem("chemutil_auth", JSON.stringify({ "accessToken": "" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
        });
        it("setToken overwrites non-object auth storage", function () {
            localStorage.setItem("chemutil_auth", "[1, 2]");
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("abc");
            expect(JSON.parse(localStorage.getItem("chemutil_auth") as string)).toEqual({ "accessToken": "abc" });
        });
        it("clearToken ignores non-object auth storage", function () {
            localStorage.setItem("chemutil_auth", "[1, 2]");
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
            client.clearToken();
            expect(client.getToken()).toBeNull();
        });
        it("storage failures fall back to memory state", function () {
            let getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (): string {
                throw new Error("denied");
            });
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            expect(client.getToken()).toBeNull();
            getSpy.mockRestore();
            let setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (): void {
                throw new Error("denied");
            });
            client.setToken("mem-only");
            expect(client.getToken()).toBe("mem-only");
            client.clearToken();
            expect(client.getToken()).toBeNull();
            setSpy.mockRestore();
        });
    });
    describe("refresh shapes", function () {
        it("keeps the token when refresh returns no tokens", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce(okJson({}));
            fetchSpy.mockResolvedValueOnce(okJson({ "data": "ok" }));
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            let result = await client.get<{ data: string }>("/p");
            expect(result.data).toBe("ok");
            expect(client.getToken()).toBe("t");
        });
        it("recovers when storage is cleared mid-refresh", async function () {
            let dropStorage = false;
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": () => {
                    dropStorage = true;
                    return Promise.resolve({ "accessToken": "n", "refreshToken": "m" });
                }
            });
            fetchSpy.mockResolvedValueOnce(okJson({ "data": "ok" }));
            vi.stubGlobal("fetch", fetchSpy);
            const realGetItem: Storage["getItem"] = Storage.prototype.getItem;
            vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key: string): string | null {
                if (dropStorage) {
                    return null;
                }
                return realGetItem.call(this, key);
            });
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await client.get("/p");
            dropStorage = false;
            let stored = JSON.parse(localStorage.getItem("chemutil_auth") as string);
            expect(stored["refreshToken"]).toBe("m");
            expect(client.getToken()).toBe("n");
        });
        it("recovers when storage holds a scalar mid-refresh", async function () {
            let useScalarStorage = false;
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce({
                "ok": true,
                "json": () => {
                    useScalarStorage = true;
                    return Promise.resolve({ "accessToken": "n", "refreshToken": "m" });
                }
            });
            fetchSpy.mockResolvedValueOnce(okJson({ "data": "ok" }));
            vi.stubGlobal("fetch", fetchSpy);
            const realGetItem: Storage["getItem"] = Storage.prototype.getItem;
            vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key: string): string | null {
                if (useScalarStorage) {
                    return "[9]";
                }
                return realGetItem.call(this, key);
            });
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await client.get("/p");
            useScalarStorage = false;
            let stored = JSON.parse(localStorage.getItem("chemutil_auth") as string);
            expect(stored["refreshToken"]).toBe("m");
            expect(client.getToken()).toBe("n");
        });
        it("retries with the old token when refresh data is scalar", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce({ "ok": true, "json": () => Promise.resolve("just-a-string") });
            fetchSpy.mockResolvedValueOnce(okJson({ "data": "ok" }));
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            let result = await client.get<{ data: string }>("/p");
            expect(result.data).toBe("ok");
            expect(client.getToken()).toBe("t");
        });
        it("clears the token when storage is empty at refresh", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({ "detail": "nope" }) });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            localStorage.clear();
            await expect(client.get("/p")).rejects.toThrow("nope");
            expect(client.getToken()).toBeNull();
        });
        it("clears the token when stored auth is not an object at refresh", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({ "detail": "nope" }) });
            vi.stubGlobal("fetch", fetchSpy);
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            localStorage.setItem("chemutil_auth", "[1, 2]");
            await expect(client.get("/p")).rejects.toThrow("nope");
            expect(client.getToken()).toBeNull();
        });
        it("clears the token when storage throws at refresh", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({ "detail": "nope" }) });
            vi.stubGlobal("fetch", fetchSpy);
            vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (): string {
                throw new Error("denied");
            });
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await expect(client.get("/p")).rejects.toThrow("nope");
            expect(client.getToken()).toBeNull();
        });
        it("shares one refresh across concurrent 401s", async function () {
            let refreshCalls = 0;
            let releaseRefresh!: (value: unknown) => void;
            let refreshGate = new Promise((resolve) => { releaseRefresh = resolve as (value: unknown) => void; });
            let fetchSpy = vi.fn().mockImplementation((url: string) => {
                if (String(url).indexOf("/api/v1/auth/refresh") !== -1) {
                    refreshCalls += 1;
                    return refreshGate.then(() => ({ "ok": true, "json": () => Promise.resolve({ "accessToken": "n", "refreshToken": "m" }) }));
                }
                if (fetchSpy.mock.calls.filter((c) => String(c[0]).indexOf("/p") !== -1).length <= 2) {
                    return Promise.resolve({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
                }
                return Promise.resolve(okJson({ "data": "ok" }));
            });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            let first = client.get("/p");
            let second = client.get("/p2");
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            releaseRefresh(null);
            let results = await Promise.all([first, second]);
            expect(refreshCalls).toBe(1);
            expect((results[0] as { data: string }).data).toBe("ok");
        });
    });
    describe("timeouts and retry details", function () {
        it("times out a hanging request", async function () {
            vi.useFakeTimers();
            let rejectFetch!: (e: unknown) => void;
            vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise((_, reject) => { rejectFetch = reject; })));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 1000 });
            let pending = client.get("/hangs");
            vi.advanceTimersByTime(1001);
            rejectFetch(new DOMException("aborted", "AbortError"));
            await expect(pending).rejects.toThrow("Request timed out");
        });
        it("times out a hanging retry after refresh", async function () {
            vi.useFakeTimers();
            let calls = 0;
            let rejectRetry!: (e: unknown) => void;
            vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
                calls += 1;
                if (calls === 1) {
                    return Promise.resolve({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
                }
                if (String(url).indexOf("/api/v1/auth/refresh") !== -1) {
                    return Promise.resolve(okJson({ "accessToken": "n", "refreshToken": "m" }));
                }
                return new Promise((_, reject) => { rejectRetry = reject; });
            }));
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 1000 });
            client.setToken("t");
            let pending = client.get("/hangs");
            for (let i = 0; i < 30; i++) {
                await Promise.resolve();
            }
            vi.advanceTimersByTime(1001);
            rejectRetry(new DOMException("aborted", "AbortError"));
            await expect(pending).rejects.toThrow("Request timed out");
        });
        it("reports network errors for non-abort failures", async function () {
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("down")));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await expect(client.get("/x")).rejects.toThrow("Network error");
            vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")));
            await expect(client.get("/x")).rejects.toThrow("Network error");
        });
        it("reports network errors for failed retries", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce(okJson({ "accessToken": "n", "refreshToken": "m" }));
            fetchSpy.mockRejectedValueOnce(new TypeError("down"));
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await expect(client.get("/x")).rejects.toThrow("Network error");
        });
        it("sends the body on retry", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce(okJson({ "accessToken": "n", "refreshToken": "m" }));
            fetchSpy.mockResolvedValueOnce(okJson({ "id": 1 }));
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await client.post("/items", { "name": "x" });
            expect(fetchSpy).toHaveBeenCalledTimes(3);
            expect((fetchSpy.mock.calls[2][1] as RequestInit).body).toBe(JSON.stringify({ "name": "x" }));
        });
        it("returns undefined for empty retry responses", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce(okJson({ "accessToken": "n", "refreshToken": "m" }));
            fetchSpy.mockResolvedValueOnce({ "ok": true, "status": 204, "json": () => Promise.resolve(null) });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await expect(client.get("/x")).resolves.toBeUndefined();
        });
        it("reports invalid JSON on retry responses", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce(okJson({ "accessToken": "n", "refreshToken": "m" }));
            fetchSpy.mockResolvedValueOnce({ "ok": true, "status": 200, "json": () => Promise.reject(new Error("bad")) });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            await expect(client.get("/x")).rejects.toThrow("Invalid JSON response");
        });
        it("returns undefined for empty first responses", async function () {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ "ok": true, "status": 204, "json": () => Promise.resolve(null) }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await expect(client.get("/x")).resolves.toBeUndefined();
        });
        it("reports invalid JSON on first responses", async function () {
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ "ok": true, "status": 200, "json": () => Promise.reject(new Error("bad")) }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            await expect(client.get("/x")).rejects.toThrow("Invalid JSON response");
        });
        it("reports parsed errors on retry failures without JSON", async function () {
            let fetchSpy = vi.fn();
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 401, "json": () => Promise.resolve({}) });
            fetchSpy.mockResolvedValueOnce(okJson({ "accessToken": "n", "refreshToken": "m" }));
            fetchSpy.mockResolvedValueOnce({ "ok": false, "status": 500, "json": () => Promise.reject(new Error("bad")) });
            vi.stubGlobal("fetch", fetchSpy);
            localStorage.setItem("chemutil_auth", JSON.stringify({ "refreshToken": "r" }));
            let client: ApiClient = ApiClient.getInstance({ "baseURL": "", "timeout": 30000 });
            client.setToken("t");
            try {
                await client.get("/x");
                expect.fail("should have thrown");
            } catch (e) {
                expect((e as ApiError).detail).toBe("Unknown error");
            }
        });
    });
});
describe("ApiError", function () {
    it("should set all properties correctly", function () {
        let error: ApiError = new ApiError(403, "https://example.com/probs/forbidden", "Access denied");
        expect(error.status).toBe(403);
        expect(error.type).toBe("https://example.com/probs/forbidden");
        expect(error.detail).toBe("Access denied");
        expect(error.message).toBe("Access denied");
        expect(error.name).toBe("ApiError");
    });
    it("should be an instance of Error", function () {
        let error: ApiError = new ApiError(500, "about:blank", "Server error");
        expect(error).toBeInstanceOf(Error);
    });
});
