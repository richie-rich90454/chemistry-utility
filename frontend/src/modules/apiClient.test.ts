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
