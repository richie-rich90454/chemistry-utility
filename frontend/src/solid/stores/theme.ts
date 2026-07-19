import {createSignal, onCleanup} from "solid-js";
import {ThemeManager} from "../../modules/themeManager.js";
import type {Theme} from "../../modules/themeManager.js";
interface ThemeStore {
    theme: () => Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
}
function useTheme(): ThemeStore {
    let manager = ThemeManager.getInstance();
    let [theme, setThemeSignal] = createSignal<Theme>(manager.getTheme());
    let listener = function (next: Theme): void {
        setThemeSignal(next);
    };
    manager.subscribe(listener);
    onCleanup(function (): void {
        manager.unsubscribe(listener);
    });
    function setTheme(t: Theme): void {
        manager.setTheme(t);
    }
    function toggle(): void {
        manager.toggle();
    }
    return {
        theme: theme,
        setTheme: setTheme,
        toggle: toggle
    };
}
export {useTheme};
