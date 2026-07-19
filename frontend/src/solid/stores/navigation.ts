import {createSignal} from "solid-js";
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
    let recentSignal = createSignal<string[]>(manager.getNavHistory().slice(-5));
    let recentCalculators = recentSignal[0];
    let [favorites, setFavoritesSignal] = createSignal<string[]>(manager.getFavorites());
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
