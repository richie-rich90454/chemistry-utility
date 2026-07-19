import gsap from "gsap";
import {onCleanup} from "solid-js";
interface UseGsapReturn {
    animateIn: (element: Element, vars?: gsap.TweenVars) => gsap.core.Tween;
    animateOut: (element: Element, vars?: gsap.TweenVars) => gsap.core.Tween;
    fromTo: (element: Element, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => gsap.core.Tween;
}
function useGsap(): UseGsapReturn {
    let tweens: gsap.core.Tween[] = [];
    function record(tween: gsap.core.Tween): gsap.core.Tween {
        tweens.push(tween);
        return tween;
    }
    function animateIn(element: Element, vars?: gsap.TweenVars): gsap.core.Tween {
        let defaults: gsap.TweenVars = {opacity: 0, y: 12, duration: 0.3, ease: "power2.out"};
        let merged: gsap.TweenVars = vars ? Object.assign({}, defaults, vars) : defaults;
        return record(gsap.from(element, merged));
    }
    function animateOut(element: Element, vars?: gsap.TweenVars): gsap.core.Tween {
        let defaults: gsap.TweenVars = {opacity: 0, y: -12, duration: 0.2, ease: "power2.in"};
        let merged: gsap.TweenVars = vars ? Object.assign({}, defaults, vars) : defaults;
        return record(gsap.to(element, merged));
    }
    function fromTo(element: Element, fromVars: gsap.TweenVars, toVars: gsap.TweenVars): gsap.core.Tween {
        return record(gsap.fromTo(element, fromVars, toVars));
    }
    onCleanup(function (): void {
        let i: number;
        for (i = 0; i < tweens.length; i++) {
            tweens[i].kill();
        }
        tweens = [];
    });
    return {animateIn: animateIn, animateOut: animateOut, fromTo: fromTo};
}
export {useGsap};
