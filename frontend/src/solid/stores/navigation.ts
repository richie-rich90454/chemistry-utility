import {createSignal, getOwner, onCleanup} from "solid-js";
import {NavigationManager} from "../../modules/navigationManager.js";
interface NavigationStore {
    currentRoute: () => string;
    recentCalculators: () => string[];
    favorites: () => string[];
    setCurrentRoute: (route: string) => void;
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}
function useNavigation(): NavigationStore {
    let manager = NavigationManager.getInstance();
    let active = manager.getActiveViewId();
    let initialRoute: string;
    if (active !== null) {
        initialRoute = active;
    }
    else {
        initialRoute = "";
    }
    let [currentRoute, setCurrentRouteSignal] = createSignal<string>(initialRoute);
    let [recentCalculators, setRecentCalculators] = createSignal<string[]>(manager.getNavHistory().slice(-5));
    let [favorites, setFavoritesSignal] = createSignal<string[]>(manager.getFavorites());
    let listener = function (id: string | null): void {
        if (id !== null) {
            setCurrentRouteSignal(id);
        }
        else {
            setCurrentRouteSignal("");
        }
        // Re-sync derived state on every navigation event instead of
        // serving the one-time setup snapshot forever.
        setRecentCalculators(manager.getNavHistory().slice(-5));
        setFavoritesSignal(manager.getFavorites());
    };
    // Subscribing outside a reactive owner would leak (onCleanup no-ops
    // there), so only subscribe when an owner exists.
    if (getOwner() !== undefined) {
        manager.subscribe(listener);
        onCleanup(function (): void {
            manager.unsubscribe(listener);
        });
    }
    function setCurrentRoute(route: string): void {
        setCurrentRouteSignal(route);
        manager.setActiveViewId(route);
    }
    function toggleFavorite(id: string): void {
        manager.toggleFavorite(id);
        setFavoritesSignal(manager.getFavorites());
    }
    function isFavorite(id: string): boolean {
        return manager.isFavorite(id);
    }
    return {
        currentRoute: currentRoute,
        recentCalculators: recentCalculators,
        favorites: favorites,
        setCurrentRoute: setCurrentRoute,
        toggleFavorite: toggleFavorite,
        isFavorite: isFavorite
    };
}
export {useNavigation};
