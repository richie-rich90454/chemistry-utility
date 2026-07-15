import { AuthManager, AuthState } from "./authManager.js";

type AuthModalMode = "login" | "signup";

export class AuthModal {
    private static instance: AuthModal | null = null;
    private overlayEl: HTMLElement | null;
    private errorEl: HTMLElement | null;
    private nameGroupEl: HTMLElement | null;
    private tabLoginEl: HTMLElement | null;
    private tabSignupEl: HTMLElement | null;
    private submitBtnEl: HTMLElement | null;
    private formEl: HTMLFormElement | null;
    private currentMode: AuthModalMode;
    private offlineToastEl: HTMLElement | null;
    private unsubscribe: Function | null;

    private constructor() {
        this.overlayEl = null;
        this.errorEl = null;
        this.nameGroupEl = null;
        this.tabLoginEl = null;
        this.tabSignupEl = null;
        this.submitBtnEl = null;
        this.formEl = null;
        this.currentMode = "login";
        this.offlineToastEl = null;
        this.unsubscribe = null;
    }

    public static getInstance(): AuthModal {
        if (!AuthModal.instance) {
            AuthModal.instance = new AuthModal();
        }
        return AuthModal.instance;
    }

    public render(): HTMLElement {
        let self: AuthModal = this;

        let overlay: HTMLElement = document.createElement("div");
        overlay.className = "auth-modal-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Authentication");

        let card: HTMLElement = document.createElement("div");
        card.className = "auth-modal-card";

        let header: HTMLElement = document.createElement("div");
        header.className = "auth-modal-header";

        let tabs: HTMLElement = document.createElement("div");
        tabs.className = "auth-modal-tabs";

        let tabLogin: HTMLElement = document.createElement("button");
        tabLogin.className = "auth-modal-tab active";
        tabLogin.setAttribute("type", "button");
        tabLogin.textContent = "Login";
        tabLogin.addEventListener("click", function () {
            self.setMode("login");
        });

        let tabSignup: HTMLElement = document.createElement("button");
        tabSignup.className = "auth-modal-tab";
        tabSignup.setAttribute("type", "button");
        tabSignup.textContent = "Sign Up";
        tabSignup.addEventListener("click", function () {
            self.setMode("signup");
        });

        tabs.appendChild(tabLogin);
        tabs.appendChild(tabSignup);

        let closeBtn: HTMLElement = document.createElement("button");
        closeBtn.className = "auth-modal-close";
        closeBtn.setAttribute("type", "button");
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", function () {
            self.close();
        });

        header.appendChild(tabs);
        header.appendChild(closeBtn);

        let form: HTMLFormElement = document.createElement("form");
        form.className = "auth-modal-form";
        form.setAttribute("novalidate", "");

        let nameGroup: HTMLElement = document.createElement("div");
        nameGroup.className = "auth-modal-field";
        nameGroup.style.display = "none";

        let nameLabel: HTMLElement = document.createElement("label");
        nameLabel.setAttribute("for", "auth-modal-name");
        nameLabel.textContent = "Name";

        let nameInput: HTMLInputElement = document.createElement("input");
        nameInput.setAttribute("type", "text");
        nameInput.setAttribute("id", "auth-modal-name");
        nameInput.setAttribute("placeholder", "Your name");
        nameInput.setAttribute("autocomplete", "name");

        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);

        let emailGroup: HTMLElement = document.createElement("div");
        emailGroup.className = "auth-modal-field";

        let emailLabel: HTMLElement = document.createElement("label");
        emailLabel.setAttribute("for", "auth-modal-email");
        emailLabel.textContent = "Email";

        let emailInput: HTMLInputElement = document.createElement("input");
        emailInput.setAttribute("type", "email");
        emailInput.setAttribute("id", "auth-modal-email");
        emailInput.setAttribute("placeholder", "you@example.com");
        emailInput.setAttribute("autocomplete", "email");
        emailInput.setAttribute("required", "");

        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);

        let passwordGroup: HTMLElement = document.createElement("div");
        passwordGroup.className = "auth-modal-field";

        let passwordLabel: HTMLElement = document.createElement("label");
        passwordLabel.setAttribute("for", "auth-modal-password");
        passwordLabel.textContent = "Password";

        let passwordInput: HTMLInputElement = document.createElement("input");
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("id", "auth-modal-password");
        passwordInput.setAttribute("placeholder", "Password");
        passwordInput.setAttribute("autocomplete", "current-password");
        passwordInput.setAttribute("required", "");

        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);

        let errorDiv: HTMLElement = document.createElement("div");
        errorDiv.className = "auth-modal-error";
        errorDiv.setAttribute("role", "alert");
        errorDiv.style.display = "none";

        let submitBtn: HTMLElement = document.createElement("button");
        submitBtn.setAttribute("type", "submit");
        submitBtn.className = "auth-modal-submit primary-button";
        submitBtn.textContent = "Sign In";

        let divider: HTMLElement = document.createElement("div");
        divider.className = "auth-modal-divider";
        divider.textContent = "or";

        let oauthGroup: HTMLElement = document.createElement("div");
        oauthGroup.className = "auth-modal-oauth";

        let githubBtn: HTMLElement = document.createElement("button");
        githubBtn.setAttribute("type", "button");
        githubBtn.className = "auth-modal-oauth-btn";
        githubBtn.textContent = "Sign in with GitHub";
        githubBtn.addEventListener("click", function () {
            let auth: AuthManager = AuthManager.getInstance();
            auth.loginWithOAuth("github");
        });

        let googleBtn: HTMLElement = document.createElement("button");
        googleBtn.setAttribute("type", "button");
        googleBtn.className = "auth-modal-oauth-btn";
        googleBtn.textContent = "Sign in with Google";
        googleBtn.addEventListener("click", function () {
            let auth: AuthManager = AuthManager.getInstance();
            auth.loginWithOAuth("google");
        });

        oauthGroup.appendChild(githubBtn);
        oauthGroup.appendChild(googleBtn);

        form.appendChild(nameGroup);
        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(errorDiv);
        form.appendChild(submitBtn);
        form.appendChild(divider);
        form.appendChild(oauthGroup);

        form.addEventListener("submit", function (e: Event) {
            e.preventDefault();
            self.handleSubmit();
        });

        card.appendChild(header);
        card.appendChild(form);

        overlay.appendChild(card);

        overlay.addEventListener("click", function (e: Event) {
            if (e.target === overlay) {
                self.close();
            }
        });

        document.addEventListener("keydown", function (e: KeyboardEvent) {
            if (e.key === "Escape" && self.overlayEl && self.overlayEl.style.display === "flex") {
                self.close();
            }
        });

        this.overlayEl = overlay;
        this.errorEl = errorDiv;
        this.nameGroupEl = nameGroup;
        this.tabLoginEl = tabLogin;
        this.tabSignupEl = tabSignup;
        this.submitBtnEl = submitBtn;
        this.formEl = form;

        return overlay;
    }

    public open(mode: AuthModalMode): void {
        this.setMode(mode);
        this.clearError();
        if (this.formEl) {
            this.formEl.reset();
        }
        if (this.overlayEl) {
            this.overlayEl.style.display = "flex";
        }
    }

    public close(): void {
        if (this.overlayEl) {
            this.overlayEl.style.display = "none";
        }
        this.clearError();
    }

    private setMode(mode: AuthModalMode): void {
        this.currentMode = mode;
        if (mode === "login") {
            if (this.nameGroupEl) {
                this.nameGroupEl.style.display = "none";
            }
            if (this.tabLoginEl) {
                this.tabLoginEl.classList.add("active");
            }
            if (this.tabSignupEl) {
                this.tabSignupEl.classList.remove("active");
            }
            if (this.submitBtnEl) {
                this.submitBtnEl.textContent = "Sign In";
            }
        } else {
            if (this.nameGroupEl) {
                this.nameGroupEl.style.display = "block";
            }
            if (this.tabLoginEl) {
                this.tabLoginEl.classList.remove("active");
            }
            if (this.tabSignupEl) {
                this.tabSignupEl.classList.add("active");
            }
            if (this.submitBtnEl) {
                this.submitBtnEl.textContent = "Sign Up";
            }
        }
        this.clearError();
    }

    private async handleSubmit(): Promise<void> {
        let emailInput: HTMLInputElement | null = this.overlayEl
            ? (this.overlayEl.querySelector("#auth-modal-email") as HTMLInputElement | null)
            : null;
        let passwordInput: HTMLInputElement | null = this.overlayEl
            ? (this.overlayEl.querySelector("#auth-modal-password") as HTMLInputElement | null)
            : null;
        let nameInput: HTMLInputElement | null = this.overlayEl
            ? (this.overlayEl.querySelector("#auth-modal-name") as HTMLInputElement | null)
            : null;

        if (!emailInput || !passwordInput) {
            return;
        }

        let email: string = emailInput.value.trim();
        let password: string = passwordInput.value;

        if (!email || !password) {
            this.showError("Please fill in all required fields.");
            return;
        }

        let auth: AuthManager = AuthManager.getInstance();

        try {
            if (this.currentMode === "login") {
                await auth.login(email, password);
            } else {
                let name: string = nameInput ? nameInput.value.trim() : "";
                if (!name) {
                    this.showError("Please enter your name.");
                    return;
                }
                await auth.register(email, password, name);
            }
            this.close();
        } catch (err: unknown) {
            let message: string = "An error occurred. Please try again.";
            if (err instanceof Error) {
                message = err.message;
            }
            this.showError(message);
        }
    }

    private showError(message: string): void {
        if (this.errorEl) {
            this.errorEl.textContent = message;
            this.errorEl.style.display = "block";
        }
    }

    private clearError(): void {
        if (this.errorEl) {
            this.errorEl.textContent = "";
            this.errorEl.style.display = "none";
        }
    }

    public init(): void {
        let container: HTMLElement | null = document.getElementById("auth-modal-container");
        if (!container) {
            return;
        }
        let overlay: HTMLElement = this.render();
        overlay.style.display = "none";
        container.appendChild(overlay);

        let self: AuthModal = this;
        let auth: AuthManager = AuthManager.getInstance();
        this.unsubscribe = auth.subscribe(function (state: AuthState) {
            if (state.isAuthenticated) {
                self.close();
            }
            self.updateSidebarUI(state);
        });

        let initialState: AuthState = auth.getState();
        this.updateSidebarUI(initialState);

        this.initOfflineToast();
    }

    public initAuthUI(): void {
        let auth: AuthManager = AuthManager.getInstance();
        let state: AuthState = auth.getState();
        this.updateSidebarUI(state);

        let self: AuthModal = this;
        if (!this.unsubscribe) {
            this.unsubscribe = auth.subscribe(function (newState: AuthState) {
                self.updateSidebarUI(newState);
            });
        }
    }

    private updateSidebarUI(state: AuthState): void {
        let signInContainer: HTMLElement | null = document.getElementById("sidebar-auth-section");
        if (!signInContainer) {
            return;
        }
        let self: AuthModal = this;

        if (state.isAuthenticated && state.user) {
            signInContainer.innerHTML = "";
            let userInfo: HTMLElement = document.createElement("div");
            userInfo.className = "auth-user-info";

            let userName: HTMLElement = document.createElement("span");
            userName.className = "auth-user-name";
            userName.textContent = state.user.name;

            let signOutBtn: HTMLElement = document.createElement("button");
            signOutBtn.className = "auth-sign-out-btn";
            signOutBtn.setAttribute("type", "button");
            signOutBtn.textContent = "Sign Out";
            signOutBtn.addEventListener("click", function () {
                let authManager: AuthManager = AuthManager.getInstance();
                authManager.logout();
            });

            userInfo.appendChild(userName);
            userInfo.appendChild(signOutBtn);
            signInContainer.appendChild(userInfo);
        } else {
            signInContainer.innerHTML = "";
            let signInBtn: HTMLElement = document.createElement("button");
            signInBtn.className = "auth-sign-in-btn";
            signInBtn.setAttribute("type", "button");
            signInBtn.textContent = "Sign In";
            signInBtn.addEventListener("click", function () {
                self.open("login");
            });
            signInContainer.appendChild(signInBtn);
        }
    }

    private initOfflineToast(): void {
        let self: AuthModal = this;
        this.offlineToastEl = document.createElement("div");
        this.offlineToastEl.className = "offline-toast";
        this.offlineToastEl.textContent = "You\u2019re offline. Changes will sync when you reconnect.";
        this.offlineToastEl.style.display = "none";
        document.body.appendChild(this.offlineToastEl);

        window.addEventListener("offline", function () {
            self.showOfflineToast(true);
        });

        window.addEventListener("online", function () {
            self.showOfflineToast(false);
        });

        if (!navigator.onLine) {
            this.showOfflineToast(true);
        }
    }

    public showOfflineToast(show: boolean): void {
        if (this.offlineToastEl) {
            if (show) {
                this.offlineToastEl.style.display = "block";
                this.offlineToastEl.classList.add("visible");
            } else {
                this.offlineToastEl.classList.remove("visible");
                let toast: HTMLElement = this.offlineToastEl;
                setTimeout(function () {
                    toast.style.display = "none";
                }, 300);
            }
        }
    }

    public static resetInstance(): void {
        AuthModal.instance = null;
    }
}
