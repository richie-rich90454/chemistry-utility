import { ApiClient } from "./apiClient.js";
export interface PublicUser {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
}
export interface AuthState {
    isAuthenticated: boolean;
    user: PublicUser | null;
    accessToken: string | null;
    refreshToken: string | null;
}
interface AuthStoredData {
    isAuthenticated: boolean;
    user: PublicUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    tokenExpiry: number | null;
}
export class AuthManager {
    private static instance: AuthManager | null = null;
    private state: AuthState;
    private subscribers: Function[];
    private refreshTimerId: ReturnType<typeof setTimeout> | null;
    private constructor() {
        this.state = {
            "isAuthenticated": false,
            "user": null,
            "accessToken": null,
            "refreshToken": null
        };
        this.subscribers = [];
        this.refreshTimerId = null;
    }
    public static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }
    public getState(): AuthState {
        return this.state;
    }
    private setState(newState: AuthState): void {
        this.state = newState;
        this.persistState();
        this.notifySubscribers();
    }
    private persistState(): void {
        try {
            let data: AuthStoredData = {
                "isAuthenticated": this.state.isAuthenticated,
                "user": this.state.user,
                "accessToken": this.state.accessToken,
                "refreshToken": this.state.refreshToken,
                "tokenExpiry": this.getTokenExpiry()
            };
            localStorage.setItem("chemutil_auth", JSON.stringify(data));
        } catch (e) {
            // storage unavailable
        }
    }
    private getTokenExpiry(): number | null {
        if (!this.state.accessToken) {
            return null;
        }
        try {
            let token: string = this.state.accessToken;
            let parts: string[] = token.split(".");
            if (parts.length < 2) {
                return null;
            }
            let payload: string = parts[1];
            while (payload.length % 4 !== 0) {
                payload = payload + "=";
            }
            let decoded: string = atob(payload);
            let claims: { exp: number } = JSON.parse(decoded);
            if (claims && claims.exp) {
                return claims.exp * 1000;
            }
            return null;
        } catch (e) {
            return null;
        }
    }
    private scheduleRefresh(expiry: number | null): void {
        if (this.refreshTimerId !== null) {
            clearTimeout(this.refreshTimerId);
            this.refreshTimerId = null;
        }
        if (!expiry) {
            return;
        }
        let now: number = Date.now();
        let refreshAt: number = expiry - 60000;
        let delay: number = refreshAt - now;
        if (delay <= 0) {
            this.refreshAuth();
            return;
        }
        let self: AuthManager = this;
        this.refreshTimerId = setTimeout(function () {
            self.refreshAuth();
        }, delay);
    }
    private notifySubscribers(): void {
        for (let i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i](this.state);
        }
    }
    public async register(email: string, password: string, name: string): Promise<PublicUser> {
        let client: ApiClient = ApiClient.getInstance();
        let response: { user: PublicUser; accessToken: string; refreshToken: string } = await client.request<{
            user: PublicUser;
            accessToken: string;
            refreshToken: string
        }>("POST", "/api/v1/auth/register", { "email": email, "password": password, "name": name });
        let user: PublicUser = response.user;
        let newState: AuthState = {
            "isAuthenticated": true,
            "user": user,
            "accessToken": response.accessToken,
            "refreshToken": response.refreshToken
        };
        this.setState(newState);
        client.setToken(response.accessToken);
        this.scheduleRefresh(this.getTokenExpiry());
        return user;
    }
    public async login(email: string, password: string): Promise<PublicUser> {
        let client: ApiClient = ApiClient.getInstance();
        let response: { user: PublicUser; accessToken: string; refreshToken: string } = await client.request<{
            user: PublicUser;
            accessToken: string;
            refreshToken: string
        }>("POST", "/api/v1/auth/login", { "email": email, "password": password });
        let user: PublicUser = response.user;
        let newState: AuthState = {
            "isAuthenticated": true,
            "user": user,
            "accessToken": response.accessToken,
            "refreshToken": response.refreshToken
        };
        this.setState(newState);
        client.setToken(response.accessToken);
        this.scheduleRefresh(this.getTokenExpiry());
        return user;
    }
    public async loginWithOAuth(provider: string): Promise<void> {
        let config: { baseURL: string } = { "baseURL": "" };
        try {
            let stored: string | null = localStorage.getItem("chemutil_auth");
            if (stored) {
                let parsed: { baseURL: string } = JSON.parse(stored);
                if (parsed && parsed.baseURL) {
                    config.baseURL = parsed.baseURL;
                }
            }
        } catch (e) {
            // use default
        }
        let redirectUrl: string = config.baseURL + "/api/v1/auth/oauth/" + provider;
        window.location.href = redirectUrl;
    }
    public async handleOAuthCallback(provider: string, code: string): Promise<PublicUser> {
        let client: ApiClient = ApiClient.getInstance();
        let response: { user: PublicUser; accessToken: string; refreshToken: string } = await client.request<{
            user: PublicUser;
            accessToken: string;
            refreshToken: string
        }>("POST", "/api/v1/auth/oauth/" + provider + "/callback", { "code": code });
        let user: PublicUser = response.user;
        let newState: AuthState = {
            "isAuthenticated": true,
            "user": user,
            "accessToken": response.accessToken,
            "refreshToken": response.refreshToken
        };
        this.setState(newState);
        client.setToken(response.accessToken);
        this.scheduleRefresh(this.getTokenExpiry());
        return user;
    }
    public async refreshAuth(): Promise<void> {
        let client: ApiClient = ApiClient.getInstance();
        let refreshToken: string | null = this.state.refreshToken;
        if (!refreshToken) {
            this.logout();
            return;
        }
        try {
            let response: { accessToken: string; refreshToken: string } = await client.request<{
                accessToken: string;
                refreshToken: string
            }>("POST", "/api/v1/auth/refresh", { "refreshToken": refreshToken });
            let newState: AuthState = {
                "isAuthenticated": true,
                "user": this.state.user,
                "accessToken": response.accessToken,
                "refreshToken": response.refreshToken
            };
            this.setState(newState);
            client.setToken(response.accessToken);
            this.scheduleRefresh(this.getTokenExpiry());
        } catch (e) {
            this.logout();
        }
    }
    public logout(): void {
        if (this.refreshTimerId !== null) {
            clearTimeout(this.refreshTimerId);
            this.refreshTimerId = null;
        }
        let newState: AuthState = {
            "isAuthenticated": false,
            "user": null,
            "accessToken": null,
            "refreshToken": null
        };
        this.setState(newState);
        let client: ApiClient = ApiClient.getInstance();
        client.clearToken();
    }
    public subscribe(callback: Function): Function {
        this.subscribers.push(callback);
        let self: AuthManager = this;
        let unsubscribe: Function = function () {
            let index: number = self.subscribers.indexOf(callback);
            if (index !== -1) {
                self.subscribers.splice(index, 1);
            }
        };
        return unsubscribe;
    }
    public async restoreSession(): Promise<void> {
        try {
            let stored: string | null = localStorage.getItem("chemutil_auth");
            if (!stored) {
                return;
            }
            let data: AuthStoredData = JSON.parse(stored);
            if (data && data.isAuthenticated && data.accessToken) {
                let newState: AuthState = {
                    "isAuthenticated": data.isAuthenticated,
                    "user": data.user,
                    "accessToken": data.accessToken,
                    "refreshToken": data.refreshToken
                };
                this.state = newState;
                let client: ApiClient = ApiClient.getInstance();
                client.setToken(data.accessToken);
                this.scheduleRefresh(data.tokenExpiry);
                this.notifySubscribers();
            }
        } catch (e) {
            // corrupted data, clear
            this.logout();
        }
    }
    public static resetInstance(): void {
        AuthManager.instance = null;
    }
}
