export interface ApiClientConfig {
    baseURL: string;
    timeout: number;
}
export class ApiError extends Error {
    public status: number;
    public type: string;
    public detail: string;
    constructor(status: number, type: string, detail: string) {
        super(detail);
        this.name = "ApiError";
        this.status = status;
        this.type = type;
        this.detail = detail;
    }
}
export class ApiClient {
    private static instance: ApiClient | null = null;
    private config: ApiClientConfig;
    private token: string | null;
    private refreshPromise: Promise<void> | null;
    private constructor(config: ApiClientConfig) {
        this.config = config;
        this.token = null;
        this.refreshPromise = null;
        this.loadToken();
    }
    public static getInstance(config?: ApiClientConfig): ApiClient {
        if (!ApiClient.instance) {
            let baseConfig: ApiClientConfig;
            if (config) {
                baseConfig = config;
            } else {
                baseConfig = { "baseURL": "", "timeout": 30000 };
            }
            ApiClient.instance = new ApiClient(baseConfig);
        }
        return ApiClient.instance;
    }
    /** Points an already-created client at a different base URL (used by the
     *  Wails bootstrap to target the in-process API server). */
    public static configure(config: ApiClientConfig): void {
        if (ApiClient.instance) {
            ApiClient.instance.config = config;
        } else {
            ApiClient.instance = new ApiClient(config);
        }
    }
    private loadToken(): void {
        try {
            let stored: string | null = localStorage.getItem("chemutil_auth");
            if (stored) {
                let parsed: { accessToken: string } = JSON.parse(stored);
                if (parsed && parsed.accessToken) {
                    this.token = parsed.accessToken;
                }
            }
        } catch (e) {
            this.token = null;
        }
    }
    public setToken(token: string): void {
        this.token = token;
        try {
            let stored: string | null = localStorage.getItem("chemutil_auth");
            let data: Record<string, unknown>;
            if (stored) {
                data = JSON.parse(stored);
            } else {
                data = {};
            }
            data["accessToken"] = token;
            localStorage.setItem("chemutil_auth", JSON.stringify(data));
        } catch (e) {
            // storage unavailable
        }
    }
    public clearToken(): void {
        this.token = null;
        try {
            let stored: string | null = localStorage.getItem("chemutil_auth");
            if (stored) {
                let data: Record<string, unknown> = JSON.parse(stored);
                delete data["accessToken"];
                delete data["refreshToken"];
                localStorage.setItem("chemutil_auth", JSON.stringify(data));
            }
        } catch (e) {
            // storage unavailable
        }
    }
    public getToken(): string | null {
        return this.token;
    }
    private parseRfc7807Error(body: unknown): ApiError {
        let status: number = 0;
        let type: string = "about:blank";
        let detail: string = "Unknown error";
        if (body && typeof body === "object") {
            let obj: Record<string, unknown> = body as Record<string, unknown>;
            if (typeof obj["status"] === "number") {
                status = obj["status"];
            }
            if (typeof obj["type"] === "string") {
                type = obj["type"];
            }
            if (typeof obj["detail"] === "string") {
                detail = obj["detail"];
            }
            if (typeof obj["title"] === "string" && detail === "Unknown error") {
                detail = obj["title"];
            }
        }
        return new ApiError(status, type, detail);
    }
    private async tryRefresh(): Promise<void> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        this.refreshPromise = this.doRefresh();
        try {
            await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }
    private async doRefresh(): Promise<void> {
        let refreshToken: string | null = null;
        try {
            let stored: string | null = localStorage.getItem("chemutil_auth");
            if (stored) {
                let parsed: { refreshToken: string } = JSON.parse(stored);
                if (parsed && parsed.refreshToken) {
                    refreshToken = parsed.refreshToken;
                }
            }
        } catch (e) {
            refreshToken = null;
        }
        if (!refreshToken) {
            this.clearToken();
            return;
        }
        let url: string = this.config.baseURL + "/api/v1/auth/refresh";
        let response: Response = await fetch(url, {
            "method": "POST",
            "headers": { "Content-Type": "application/json" },
            "body": JSON.stringify({ "refreshToken": refreshToken })
        });
        if (!response.ok) {
            this.clearToken();
            return;
        }
        let data: { accessToken: string; refreshToken: string } = await response.json();
        if (data && data.accessToken) {
            this.setToken(data.accessToken);
        }
        if (data && data.refreshToken) {
            try {
                let stored: string | null = localStorage.getItem("chemutil_auth");
                let authData: Record<string, unknown>;
                if (stored) {
                    authData = JSON.parse(stored);
                } else {
                    authData = {};
                }
                authData["refreshToken"] = data.refreshToken;
                localStorage.setItem("chemutil_auth", JSON.stringify(authData));
            } catch (e) {
                // storage unavailable
            }
        }
    }
    public async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        let url: string = this.config.baseURL + path;
        let headers: Record<string, string> = { "Content-Type": "application/json" };
        if (this.token) {
            headers["Authorization"] = "Bearer " + this.token;
        }
        let options: RequestInit = {
            "method": method,
            "headers": headers
        };
        if (body !== undefined && method !== "GET" && method !== "HEAD") {
            options["body"] = JSON.stringify(body);
        }
        let controller: AbortController = new AbortController();
        options["signal"] = controller.signal;
        let timeoutId: ReturnType<typeof setTimeout> = setTimeout(function () {
            controller.abort();
        }, this.config.timeout);
        let response: Response;
        try {
            response = await fetch(url, options);
        } catch (e) {
            clearTimeout(timeoutId);
            throw new ApiError(0, "about:blank", "Network error");
        }
        clearTimeout(timeoutId);
        if (response.status === 401 && this.token) {
            await this.tryRefresh();
            if (this.token) {
                headers["Authorization"] = "Bearer " + this.token;
                let retryOptions: RequestInit = {
                    "method": method,
                    "headers": headers
                };
                if (body !== undefined && method !== "GET" && method !== "HEAD") {
                    retryOptions["body"] = JSON.stringify(body);
                }
                let retryController: AbortController = new AbortController();
                retryOptions["signal"] = retryController.signal;
                let retryTimeoutId: ReturnType<typeof setTimeout> = setTimeout(function () {
                    retryController.abort();
                }, this.config.timeout);
                let retryResponse: Response;
                try {
                    retryResponse = await fetch(url, retryOptions);
                } catch (e) {
                    clearTimeout(retryTimeoutId);
                    throw new ApiError(0, "about:blank", "Network error");
                }
                clearTimeout(retryTimeoutId);
                if (!retryResponse.ok) {
                    let errorBody: unknown;
                    try {
                        errorBody = await retryResponse.json();
                    } catch (e) {
                        errorBody = null;
                    }
                    throw this.parseRfc7807Error(errorBody);
                }
                return (await retryResponse.json()) as T;
            }
        }
        if (!response.ok) {
            let errorBody: unknown;
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = null;
            }
            throw this.parseRfc7807Error(errorBody);
        }
        return (await response.json()) as T;
    }
    public async get<T>(path: string): Promise<T> {
        return this.request<T>("GET", path);
    }
    public async post<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>("POST", path, body);
    }
    public async patch<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>("PATCH", path, body);
    }
    public async delete<T>(path: string): Promise<T> {
        return this.request<T>("DELETE", path);
    }
    public isOffline(): boolean {
        return typeof navigator === "undefined" ? false : !navigator.onLine;
    }
    public static resetInstance(): void {
        ApiClient.instance = null;
    }
}
