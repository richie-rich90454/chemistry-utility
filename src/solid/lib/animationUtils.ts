import {useGsap} from "./useGsap";
function useSlideDown(element: Element, duration: number): void {
    let api = useGsap();
    let seconds: number = duration / 1000;
    api.fromTo(element, {height: 0, opacity: 0, overflow: "hidden"}, {height: "auto", opacity: 1, duration: seconds, ease: "power2.out"});
}
function useSlideUp(element: Element, duration: number): void {
    let api = useGsap();
    let seconds: number = duration / 1000;
    api.fromTo(element, {height: "auto", opacity: 1, overflow: "hidden"}, {height: 0, opacity: 0, duration: seconds, ease: "power2.in"});
}
export {useGsap, useSlideDown, useSlideUp};
