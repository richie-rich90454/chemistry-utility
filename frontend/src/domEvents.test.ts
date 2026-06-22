import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("DOM Event Handling", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("click event fires on button", () => {
        const btn = document.createElement("button");
        let clicked = false;
        btn.addEventListener("click", () => { clicked = true; });
        document.body.appendChild(btn);
        btn.click();
        expect(clicked).toBe(true);
    });

    it("input event fires on text change", () => {
        const input = document.createElement("input");
        input.type = "text";
        let changed = false;
        input.addEventListener("input", () => { changed = true; });
        document.body.appendChild(input);
        input.value = "test";
        input.dispatchEvent(new Event("input"));
        expect(changed).toBe(true);
    });

    it("keydown event fires with correct key", () => {
        let receivedKey = "";
        document.addEventListener("keydown", (e) => {
            receivedKey = (e as KeyboardEvent).key;
        });
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(receivedKey).toBe("Escape");
    });

    it("hashchange event can be listened to", () => {
        let hashChanged = false;
        window.addEventListener("hashchange", () => { hashChanged = true; });
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        expect(hashChanged).toBe(true);
    });

    it("multiple event listeners on same element", () => {
        const btn = document.createElement("button");
        let count = 0;
        btn.addEventListener("click", () => { count++; });
        btn.addEventListener("click", () => { count++; });
        document.body.appendChild(btn);
        btn.click();
        expect(count).toBe(2);
    });

    it("event listener can be removed", () => {
        const btn = document.createElement("button");
        let count = 0;
        const handler = () => { count++; };
        btn.addEventListener("click", handler);
        document.body.appendChild(btn);
        btn.click();
        btn.removeEventListener("click", handler);
        btn.click();
        expect(count).toBe(1);
    });

    it("focus and blur events fire on input", () => {
        const input = document.createElement("input");
        input.type = "text";
        let focused = false;
        let blurred = false;
        input.addEventListener("focus", () => { focused = true; });
        input.addEventListener("blur", () => { blurred = true; });
        document.body.appendChild(input);
        input.dispatchEvent(new FocusEvent("focus"));
        input.dispatchEvent(new FocusEvent("blur"));
        expect(focused).toBe(true);
        expect(blurred).toBe(true);
    });

    it("change event fires on select", () => {
        const select = document.createElement("select");
        let changed = false;
        select.addEventListener("change", () => { changed = true; });
        document.body.appendChild(select);
        select.dispatchEvent(new Event("change"));
        expect(changed).toBe(true);
    });

    it("submit event fires on form", () => {
        const form = document.createElement("form");
        let submitted = false;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            submitted = true;
        });
        document.body.appendChild(form);
        form.dispatchEvent(new Event("submit", { cancelable: true }));
        expect(submitted).toBe(true);
    });

    it("resize event can be listened on window", () => {
        let resized = false;
        window.addEventListener("resize", () => { resized = true; });
        window.dispatchEvent(new Event("resize"));
        expect(resized).toBe(true);
    });

    it("mousedown and mouseup events fire in sequence", () => {
        const btn = document.createElement("button");
        const events: string[] = [];
        btn.addEventListener("mousedown", () => { events.push("down"); });
        btn.addEventListener("mouseup", () => { events.push("up"); });
        document.body.appendChild(btn);
        btn.dispatchEvent(new MouseEvent("mousedown"));
        btn.dispatchEvent(new MouseEvent("mouseup"));
        expect(events).toEqual(["down", "up"]);
    });

    it("mouseenter and mouseleave events fire", () => {
        const div = document.createElement("div");
        const events: string[] = [];
        div.addEventListener("mouseenter", () => { events.push("enter"); });
        div.addEventListener("mouseleave", () => { events.push("leave"); });
        document.body.appendChild(div);
        div.dispatchEvent(new MouseEvent("mouseenter"));
        div.dispatchEvent(new MouseEvent("mouseleave"));
        expect(events).toEqual(["enter", "leave"]);
    });
});
