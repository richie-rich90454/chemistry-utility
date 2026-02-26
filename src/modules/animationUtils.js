export function slideDown(element, duration){
    element.style.display="block";
    element.style.height="0";
    element.style.overflow="hidden";
    let height=element.scrollHeight;
    element.style.transition="height "+duration+"ms";
    requestAnimationFrame(function(){
        element.style.height=height+"px";
        setTimeout(function(){
            element.style.height="";
            element.style.overflow="";
            element.style.transition="";
        }, duration);
    });
}
export function slideUp(element, duration){
    element.style.height=element.scrollHeight+"px";
    element.style.overflow="hidden";
    element.style.transition="height "+duration+"ms";
    requestAnimationFrame(function(){
        element.style.height="0";
        setTimeout(function(){
            element.style.display="none";
            element.style.height="";
            element.style.overflow="";
            element.style.transition="";
        }, duration);
    });
}