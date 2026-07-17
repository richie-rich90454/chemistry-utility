export interface Workspace {
    "id": string;
    "name": string;
    "description": string;
    "ownerId": string;
    "memberCount": number;
    "createdAt": string;
    "updatedAt": string;
}

export interface WorkspaceMember {
    "userId": string;
    "email": string;
    "name": string;
    "role": string;
}

export interface SharedCalculation {
    "ID": string;
    "UserID": string;
    "CalculatorType": string;
    "Inputs": string;
    "Result": string;
    "Annotation": string;
    "Starred": boolean;
    "WorkspaceID": string;
    "CreatedAt": string;
}

const WORKSPACES_STORAGE_KEY: string = "chemutil_workspaces";
const MEMBERS_STORAGE_KEY_PREFIX: string = "chemutil_workspace_members_";
const CALCULATIONS_STORAGE_KEY_PREFIX: string = "chemutil_workspace_calculations_";
const LOCAL_OWNER_ID: string = "local-user";

/**
 * Manages workspace collaboration UI: listing, creating, selecting, updating
 * and deleting workspaces, managing members, viewing shared calculations, and
 * attaching share buttons to calculation result areas. All data is persisted
 * to localStorage so local users can collaborate without any server-side
 * account.
 */
export class WorkspaceManager {
    private static instance: WorkspaceManager | null = null;
    private sidebarContainer: HTMLElement | null;
    private detailContainer: HTMLElement | null;
    private initialized: boolean;
    private currentWorkspace: Workspace | null;
    private currentMembers: WorkspaceMember[];
    private currentCalculations: SharedCalculation[];

    private constructor() {
        this.sidebarContainer = null;
        this.detailContainer = null;
        this.initialized = false;
        this.currentWorkspace = null;
        this.currentMembers = [];
        this.currentCalculations = [];
    }

    public static getInstance(): WorkspaceManager {
        if (!WorkspaceManager.instance) {
            WorkspaceManager.instance = new WorkspaceManager();
        }
        return WorkspaceManager.instance;
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.renderSidebarSection();
        this.renderDetailView();
        this.attachShareButtons();
        if (this.sidebarContainer) {
            this.sidebarContainer.style.display = "block";
        }
    }

    private renderSidebarSection(): HTMLElement {
        let existing: HTMLElement | null = document.getElementById("sidebar-workspaces");
        if (existing) {
            this.sidebarContainer = existing;
            this.ensureSidebarStructure(existing);
            return existing;
        }
        let section: HTMLElement = document.createElement("section");
        section.id = "sidebar-workspaces";
        section.className = "sidebar-workspaces";
        section.setAttribute("aria-label", "Workspaces");
        this.ensureSidebarStructure(section);
        let main: HTMLElement | null = document.getElementById("main-content");
        if (main && main.parentNode) {
            main.parentNode.insertBefore(section, main.nextSibling);
        }
        this.sidebarContainer = section;
        return section;
    }

    private ensureSidebarStructure(section: HTMLElement): void {
        let header: HTMLElement | null = section.querySelector(".sidebar-workspaces-header") as HTMLElement | null;
        if (!header) {
            header = document.createElement("div");
            header.className = "sidebar-workspaces-header";
            let title: HTMLElement = document.createElement("span");
            title.className = "sidebar-workspaces-title";
            title.textContent = "Workspaces";
            let createBtn: HTMLButtonElement = document.createElement("button");
            createBtn.type = "button";
            createBtn.className = "workspace-create-btn";
            createBtn.setAttribute("aria-label", "Create workspace");
            createBtn.textContent = "+";
            header.appendChild(title);
            header.appendChild(createBtn);
            section.appendChild(header);
            let self: WorkspaceManager = this;
            createBtn.addEventListener("click", function (): void {
                void self.promptCreateWorkspace();
            });
        }
        let list: HTMLElement | null = section.querySelector(".workspace-list") as HTMLElement | null;
        if (!list) {
            list = document.createElement("ul");
            list.className = "workspace-list";
            section.appendChild(list);
        }
    }

    private renderDetailView(): HTMLElement {
        let existing: HTMLElement | null = document.getElementById("workspace-view");
        if (existing) {
            this.detailContainer = existing;
            this.ensureDetailStructure(existing);
            return existing;
        }
        let section: HTMLElement = document.createElement("section");
        section.id = "workspace-view";
        section.className = "workspace-view";
        section.style.display = "none";
        section.setAttribute("aria-label", "Workspace detail");
        this.ensureDetailStructure(section);
        let main: HTMLElement | null = document.getElementById("main-content");
        if (main) {
            main.appendChild(section);
        }
        this.detailContainer = section;
        return section;
    }

    private ensureDetailStructure(section: HTMLElement): void {
        let required: { "cls": string; "tag": string }[] = [
            { "cls": "workspace-detail-header", "tag": "div" },
            { "cls": "workspace-detail-error", "tag": "div" },
            { "cls": "workspace-members", "tag": "div" },
            { "cls": "workspace-add-member", "tag": "div" },
            { "cls": "workspace-shared-calculations", "tag": "div" },
            { "cls": "workspace-detail-actions", "tag": "div" }
        ];
        let i: number;
        for (i = 0; i < required.length; i++) {
            let entry: { "cls": string; "tag": string } = required[i];
            let child: HTMLElement | null = section.querySelector("." + entry.cls) as HTMLElement | null;
            if (!child) {
                child = document.createElement(entry.tag);
                child.className = entry.cls;
                if (entry.cls === "workspace-detail-error") {
                    child.setAttribute("role", "alert");
                    child.style.display = "none";
                }
                section.appendChild(child);
            }
        }
    }

    public async loadWorkspaces(): Promise<Workspace[]> {
        let workspaces: Workspace[] = this.readWorkspaces();
        this.renderWorkspaceList(workspaces);
        return workspaces;
    }

    public async createWorkspace(name: string, description: string): Promise<Workspace> {
        let now: string = new Date().toISOString();
        let workspace: Workspace = {
            "id": this.generateId("ws"),
            "name": name,
            "description": description,
            "ownerId": LOCAL_OWNER_ID,
            "memberCount": 1,
            "createdAt": now,
            "updatedAt": now
        };
        let workspaces: Workspace[] = this.readWorkspaces();
        workspaces.push(workspace);
        this.writeWorkspaces(workspaces);
        let self: WorkspaceManager = this;
        await this.loadWorkspaces().catch(function (): void { return; });
        void self;
        return workspace;
    }

    public async selectWorkspace(id: string): Promise<Workspace> {
        let workspaces: Workspace[] = this.readWorkspaces();
        let workspace: Workspace | undefined;
        let i: number;
        for (i = 0; i < workspaces.length; i++) {
            if (workspaces[i].id === id) {
                workspace = workspaces[i];
                break;
            }
        }
        if (!workspace) {
            throw new Error("Workspace not found: " + id);
        }
        this.currentWorkspace = workspace;
        this.renderWorkspaceDetail(workspace);
        this.showDetailView();
        await this.loadMembers(id).catch(function (): void { return; });
        await this.loadWorkspaceCalculations(id).catch(function (): void { return; });
        return workspace;
    }

    public async updateWorkspace(id: string, name: string, description: string): Promise<Workspace> {
        let workspaces: Workspace[] = this.readWorkspaces();
        let workspace: Workspace | undefined;
        let i: number;
        for (i = 0; i < workspaces.length; i++) {
            if (workspaces[i].id === id) {
                workspaces[i].name = name;
                workspaces[i].description = description;
                workspaces[i].updatedAt = new Date().toISOString();
                workspace = workspaces[i];
                break;
            }
        }
        if (!workspace) {
            throw new Error("Workspace not found: " + id);
        }
        this.writeWorkspaces(workspaces);
        this.currentWorkspace = workspace;
        this.renderWorkspaceDetail(workspace);
        await this.loadWorkspaces().catch(function (): void { return; });
        return workspace;
    }

    public async deleteWorkspace(id: string): Promise<void> {
        let workspaces: Workspace[] = this.readWorkspaces();
        let filtered: Workspace[] = [];
        let i: number;
        for (i = 0; i < workspaces.length; i++) {
            if (workspaces[i].id !== id) {
                filtered.push(workspaces[i]);
            }
        }
        this.writeWorkspaces(filtered);
        localStorage.removeItem(MEMBERS_STORAGE_KEY_PREFIX + id);
        localStorage.removeItem(CALCULATIONS_STORAGE_KEY_PREFIX + id);
        if (this.currentWorkspace && this.currentWorkspace.id === id) {
            this.currentWorkspace = null;
            this.currentMembers = [];
            this.currentCalculations = [];
            this.hideDetailView();
        }
        await this.loadWorkspaces().catch(function (): void { return; });
    }

    public async loadMembers(workspaceId: string): Promise<WorkspaceMember[]> {
        let members: WorkspaceMember[] = this.readMembers(workspaceId);
        this.currentMembers = members;
        this.renderMembers(members);
        return members;
    }

    public async addMember(workspaceId: string, userId: string, role: string): Promise<WorkspaceMember> {
        let member: WorkspaceMember = {
            "userId": userId,
            "email": userId + "@local",
            "name": userId,
            "role": role
        };
        let members: WorkspaceMember[] = this.readMembers(workspaceId);
        members.push(member);
        this.writeMembers(workspaceId, members);
        this.currentMembers = members;
        this.renderMembers(members);
        return member;
    }

    public async removeMember(workspaceId: string, userId: string): Promise<void> {
        let members: WorkspaceMember[] = this.readMembers(workspaceId);
        let filtered: WorkspaceMember[] = [];
        let i: number;
        for (i = 0; i < members.length; i++) {
            if (members[i].userId !== userId) {
                filtered.push(members[i]);
            }
        }
        this.writeMembers(workspaceId, filtered);
        this.currentMembers = filtered;
        this.renderMembers(filtered);
    }

    public async loadWorkspaceCalculations(workspaceId: string): Promise<SharedCalculation[]> {
        let calculations: SharedCalculation[] = this.readCalculations(workspaceId);
        this.currentCalculations = calculations;
        this.renderSharedCalculations(calculations);
        return calculations;
    }

    public addLocalCalculation(workspaceId: string, calc: SharedCalculation): void {
        let calculations: SharedCalculation[] = this.readCalculations(workspaceId);
        calculations.push(calc);
        this.writeCalculations(workspaceId, calculations);
        if (this.currentWorkspace && this.currentWorkspace.id === workspaceId) {
            this.currentCalculations = calculations;
            this.renderSharedCalculations(calculations);
        }
    }

    public renderWorkspaceList(workspaces: Workspace[]): void {
        if (!this.sidebarContainer) {
            return;
        }
        let list: HTMLElement | null = this.sidebarContainer.querySelector(".workspace-list") as HTMLElement | null;
        if (!list) {
            return;
        }
        list.innerHTML = "";
        if (workspaces.length === 0) {
            let empty: HTMLElement = document.createElement("li");
            empty.className = "workspace-empty";
            empty.textContent = "No workspaces yet.";
            list.appendChild(empty);
            return;
        }
        let self: WorkspaceManager = this;
        let i: number;
        for (i = 0; i < workspaces.length; i++) {
            let ws: Workspace = workspaces[i];
            let item: HTMLElement = document.createElement("li");
            item.className = "workspace-list-item";
            item.setAttribute("data-workspace-id", ws.id);
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
            let name: HTMLElement = document.createElement("span");
            name.className = "workspace-list-name";
            name.textContent = ws.name;
            let count: HTMLElement = document.createElement("span");
            count.className = "workspace-list-count";
            count.textContent = String(ws.memberCount) + " members";
            item.appendChild(name);
            item.appendChild(count);
            item.addEventListener("click", function (): void {
                void self.selectWorkspace(ws.id);
            });
            item.addEventListener("keydown", function (e: KeyboardEvent): void {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void self.selectWorkspace(ws.id);
                }
            });
            list.appendChild(item);
        }
    }

    public renderWorkspaceDetail(workspace: Workspace): void {
        if (!this.detailContainer) {
            return;
        }
        let header: HTMLElement | null = this.detailContainer.querySelector(".workspace-detail-header") as HTMLElement | null;
        if (header) {
            header.innerHTML = "";
            let title: HTMLHeadingElement = document.createElement("h2");
            title.className = "workspace-detail-title";
            title.textContent = workspace.name;
            let desc: HTMLInputElement = document.createElement("input");
            desc.type = "text";
            desc.className = "workspace-detail-description";
            desc.value = workspace.description;
            desc.setAttribute("aria-label", "Workspace description");
            header.appendChild(title);
            header.appendChild(desc);
            let self: WorkspaceManager = this;
            desc.addEventListener("change", function (): void {
                void self.updateWorkspace(workspace.id, workspace.name, desc.value);
            });
        }
        this.renderDetailActions(workspace);
        this.renderAddMemberForm(workspace);
    }

    private renderDetailActions(workspace: Workspace): void {
        let actions: HTMLElement | null = this.detailContainer
            ? (this.detailContainer.querySelector(".workspace-detail-actions") as HTMLElement | null)
            : null;
        if (!actions) {
            return;
        }
        actions.innerHTML = "";
        let self: WorkspaceManager = this;
        let exportBtn: HTMLButtonElement = document.createElement("button");
        exportBtn.type = "button";
        exportBtn.className = "workspace-export-pdf-btn";
        exportBtn.textContent = "Export as PDF";
        exportBtn.addEventListener("click", function (): void {
            self.exportToPDF();
        });
        actions.appendChild(exportBtn);
        // Local users own every workspace they create, so always show delete.
        let deleteBtn: HTMLButtonElement = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "workspace-delete-btn";
        deleteBtn.textContent = "Delete Workspace";
        deleteBtn.addEventListener("click", function (): void {
            if (window.confirm("Delete this workspace? This cannot be undone.")) {
                void self.deleteWorkspace(workspace.id);
            }
        });
        actions.appendChild(deleteBtn);
    }

    private renderAddMemberForm(workspace: Workspace): void {
        let container: HTMLElement | null = this.detailContainer
            ? (this.detailContainer.querySelector(".workspace-add-member") as HTMLElement | null)
            : null;
        if (!container) {
            return;
        }
        container.innerHTML = "";
        let form: HTMLFormElement = document.createElement("form");
        form.className = "workspace-add-member-form";
        let emailInput: HTMLInputElement = document.createElement("input");
        emailInput.type = "email";
        emailInput.className = "workspace-add-member-email";
        emailInput.placeholder = "Member email";
        emailInput.setAttribute("aria-label", "Member email");
        let roleSelect: HTMLSelectElement = document.createElement("select");
        roleSelect.className = "workspace-add-member-role";
        roleSelect.setAttribute("aria-label", "Member role");
        let ownerOpt: HTMLOptionElement = document.createElement("option");
        ownerOpt.value = "member";
        ownerOpt.textContent = "Member";
        let adminOpt: HTMLOptionElement = document.createElement("option");
        adminOpt.value = "admin";
        adminOpt.textContent = "Admin";
        roleSelect.appendChild(ownerOpt);
        roleSelect.appendChild(adminOpt);
        let submitBtn: HTMLButtonElement = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.className = "workspace-add-member-submit";
        submitBtn.textContent = "Add Member";
        form.appendChild(emailInput);
        form.appendChild(roleSelect);
        form.appendChild(submitBtn);
        let self: WorkspaceManager = this;
        form.addEventListener("submit", function (e: Event): void {
            e.preventDefault();
            let email: string = emailInput.value.trim();
            if (!email) {
                return;
            }
            void self.addMember(workspace.id, email, roleSelect.value);
            emailInput.value = "";
        });
        container.appendChild(form);
    }

    public renderMembers(members: WorkspaceMember[]): void {
        if (!this.detailContainer) {
            return;
        }
        let container: HTMLElement | null = this.detailContainer.querySelector(".workspace-members") as HTMLElement | null;
        if (!container) {
            return;
        }
        container.innerHTML = "<h3>Members</h3>";
        if (members.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "workspace-empty";
            empty.textContent = "No members.";
            container.appendChild(empty);
            return;
        }
        let list: HTMLElement = document.createElement("ul");
        list.className = "workspace-member-list";
        let self: WorkspaceManager = this;
        let i: number;
        for (i = 0; i < members.length; i++) {
            let m: WorkspaceMember = members[i];
            let item: HTMLElement = document.createElement("li");
            item.className = "workspace-member-item";
            let name: HTMLElement = document.createElement("span");
            name.className = "workspace-member-name";
            name.textContent = m.name || m.email;
            let role: HTMLElement = document.createElement("span");
            role.className = "workspace-member-role";
            role.textContent = m.role;
            item.appendChild(name);
            item.appendChild(role);
            // Local user owns everything, so any member can be removed.
            if (m.userId !== LOCAL_OWNER_ID) {
                let removeBtn: HTMLButtonElement = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "workspace-member-remove";
                removeBtn.setAttribute("aria-label", "Remove member " + (m.name || m.email));
                removeBtn.textContent = "Remove";
                let userId: string = m.userId;
                removeBtn.addEventListener("click", function (): void {
                    if (self.currentWorkspace) {
                        void self.removeMember(self.currentWorkspace.id, userId);
                    }
                });
                item.appendChild(removeBtn);
            }
            list.appendChild(item);
        }
        container.appendChild(list);
    }

    public renderSharedCalculations(calculations: SharedCalculation[]): void {
        if (!this.detailContainer) {
            return;
        }
        let container: HTMLElement | null = this.detailContainer
            ? (this.detailContainer.querySelector(".workspace-shared-calculations") as HTMLElement | null)
            : null;
        if (!container) {
            return;
        }
        container.innerHTML = "<h3>Shared Calculations</h3>";
        if (calculations.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "workspace-empty";
            empty.textContent = "No shared calculations yet.";
            container.appendChild(empty);
            return;
        }
        let list: HTMLElement = document.createElement("ul");
        list.className = "workspace-calc-list";
        let i: number;
        for (i = 0; i < calculations.length; i++) {
            let calc: SharedCalculation = calculations[i];
            let item: HTMLElement = document.createElement("li");
            item.className = "workspace-calc-item";
            let type: HTMLElement = document.createElement("span");
            type.className = "workspace-calc-type";
            type.textContent = calc.CalculatorType;
            let preview: HTMLElement = document.createElement("span");
            preview.className = "workspace-calc-preview";
            preview.textContent = calc.Inputs;
            let date: HTMLElement = document.createElement("span");
            date.className = "workspace-calc-date";
            date.textContent = this.formatDate(calc.CreatedAt);
            item.appendChild(type);
            item.appendChild(preview);
            item.appendChild(date);
            list.appendChild(item);
        }
        container.appendChild(list);
    }

    public showDetailView(): void {
        if (!this.detailContainer) {
            return;
        }
        let sections: NodeListOf<HTMLElement> = document.querySelectorAll(".app-view .main-groups.card");
        let i: number;
        for (i = 0; i < sections.length; i++) {
            sections[i].classList.remove("view-active");
            sections[i].classList.add("view-hidden");
        }
        let dashboard: HTMLElement | null = document.getElementById("dashboard-view");
        if (dashboard) {
            dashboard.style.display = "none";
        }
        let welcome: HTMLElement | null = document.querySelector(".app-view .welcome-screen");
        if (welcome) {
            welcome.style.display = "none";
        }
        let viewHeader: HTMLElement | null = document.querySelector(".view-header");
        if (viewHeader) {
            viewHeader.style.display = "none";
        }
        this.detailContainer.style.display = "block";
    }

    public hideDetailView(): void {
        if (!this.detailContainer) {
            return;
        }
        this.detailContainer.style.display = "none";
    }

    public isDetailViewVisible(): boolean {
        if (!this.detailContainer) {
            return false;
        }
        return this.detailContainer.style.display !== "none";
    }

    public getCurrentWorkspace(): Workspace | null {
        return this.currentWorkspace;
    }

    public getCurrentMembers(): WorkspaceMember[] {
        return this.currentMembers;
    }

    public getCurrentCalculations(): SharedCalculation[] {
        return this.currentCalculations;
    }

    public async promptCreateWorkspace(): Promise<Workspace | null> {
        let name: string | null = window.prompt("Workspace name");
        if (!name) {
            return null;
        }
        let description: string = window.prompt("Workspace description") || "";
        try {
            return await this.createWorkspace(name, description);
        } catch (e) {
            this.showDetailError(this.extractMessage(e, "Failed to create workspace"));
            return null;
        }
    }

    public generateShareLink(calculationId: string): string {
        let origin: string = window.location.origin || (window.location.protocol + "//" + window.location.host);
        return origin + "/shared/" + calculationId;
    }

    public async copyShareLink(calculationId: string): Promise<string> {
        let link: string = this.generateShareLink(calculationId);
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(link);
        }
        return link;
    }

    public attachShareButtons(): void {
        let results: NodeListOf<HTMLElement> = document.querySelectorAll(".result[data-calculation-id]");
        let i: number;
        for (i = 0; i < results.length; i++) {
            let el: HTMLElement = results[i];
            let id: string | null = el.getAttribute("data-calculation-id");
            if (!id) {
                continue;
            }
            this.attachShareButton(el, id);
        }
    }

    public attachShareButton(resultElement: HTMLElement, calculationId: string): void {
        let existing: HTMLElement | null = resultElement.querySelector(".share-button") as HTMLElement | null;
        if (existing) {
            return;
        }
        let btn: HTMLButtonElement = document.createElement("button");
        btn.type = "button";
        btn.className = "share-button";
        btn.setAttribute("aria-label", "Share calculation link");
        btn.textContent = "Share";
        let self: WorkspaceManager = this;
        btn.addEventListener("click", function (): void {
            void self.copyShareLink(calculationId).then(function (): void {
                btn.classList.add("shared");
                let original: string = btn.textContent || "Share";
                btn.textContent = "Link copied";
                setTimeout(function (): void {
                    btn.classList.remove("shared");
                    btn.textContent = original;
                }, 2000);
            });
        });
        resultElement.appendChild(btn);
    }

    public exportToPDF(): void {
        window.print();
    }

    private showDetailError(message: string): void {
        if (!this.detailContainer) {
            return;
        }
        let errorEl: HTMLElement | null = this.detailContainer.querySelector(".workspace-detail-error") as HTMLElement | null;
        if (!errorEl) {
            return;
        }
        if (message) {
            errorEl.textContent = message;
            errorEl.style.display = "block";
        } else {
            errorEl.textContent = "";
            errorEl.style.display = "none";
        }
    }

    private formatDate(iso: string): string {
        let d: Date = new Date(iso);
        if (isNaN(d.getTime())) {
            return "";
        }
        let year: number = d.getFullYear();
        let month: number = d.getMonth() + 1;
        let day: number = d.getDate();
        let monthStr: string = month < 10 ? "0" + String(month) : String(month);
        let dayStr: string = day < 10 ? "0" + String(day) : String(day);
        return year + "-" + monthStr + "-" + dayStr;
    }

    private extractMessage(e: unknown, fallback: string): string {
        if (e instanceof Error) {
            return fallback + ": " + e.message;
        }
        return fallback;
    }

    private readWorkspaces(): Workspace[] {
        let raw: string | null = localStorage.getItem(WORKSPACES_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as Workspace[];
            }
        } catch (e) {
            // fall through to empty array
        }
        return [];
    }

    private writeWorkspaces(workspaces: Workspace[]): void {
        localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    }

    private readMembers(workspaceId: string): WorkspaceMember[] {
        let raw: string | null = localStorage.getItem(MEMBERS_STORAGE_KEY_PREFIX + workspaceId);
        if (!raw) {
            return [];
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as WorkspaceMember[];
            }
        } catch (e) {
            // fall through to empty array
        }
        return [];
    }

    private writeMembers(workspaceId: string, members: WorkspaceMember[]): void {
        localStorage.setItem(MEMBERS_STORAGE_KEY_PREFIX + workspaceId, JSON.stringify(members));
    }

    private readCalculations(workspaceId: string): SharedCalculation[] {
        let raw: string | null = localStorage.getItem(CALCULATIONS_STORAGE_KEY_PREFIX + workspaceId);
        if (!raw) {
            return [];
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as SharedCalculation[];
            }
        } catch (e) {
            // fall through to empty array
        }
        return [];
    }

    private writeCalculations(workspaceId: string, calculations: SharedCalculation[]): void {
        localStorage.setItem(CALCULATIONS_STORAGE_KEY_PREFIX + workspaceId, JSON.stringify(calculations));
    }

    private generateId(prefix: string): string {
        return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8);
    }

    public destroy(): void {
        this.sidebarContainer = null;
        this.detailContainer = null;
        this.initialized = false;
        this.currentWorkspace = null;
        this.currentMembers = [];
        this.currentCalculations = [];
    }

    public static resetInstance(): void {
        if (WorkspaceManager.instance) {
            WorkspaceManager.instance.destroy();
        }
        WorkspaceManager.instance = null;
    }
}
