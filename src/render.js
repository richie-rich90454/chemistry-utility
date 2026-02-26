document.addEventListener("DOMContentLoaded", function (){
    let navLinks=document.querySelectorAll("nav a");
    let mainGroups=Array.from(document.querySelectorAll(".main-groups"));
    let nav=document.querySelector("nav");
    let navHeight=nav.getBoundingClientRect().height;
    function clearActive(){
        navLinks.forEach(function (link){
            link.classList.remove("active");
        });
    }
    navLinks.forEach(function(link){
        link.addEventListener("click", function (e){
            e.preventDefault();
            clearActive();
            this.classList.add("active");
            let targetEl=document.querySelector(this.getAttribute("href"));
            if (targetEl){
                window.scrollTo({
                    top: targetEl.offsetTop-navHeight,
                    behavior: "smooth"
                });
            }
        });
    });
    function onScroll(){
        let scrollPos=window.scrollY+navHeight+5;
        let current=mainGroups[0];
        for (let section of mainGroups){
            if (section.offsetTop<=scrollPos){
                current=section;
            }
        }
        if (window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2){
            current=mainGroups[mainGroups.length-1];
        }
        clearActive();
        let activeLink=document.querySelector('nav a[href="#'+current.id+'"]');
        if (activeLink){
            activeLink.classList.add("active");
        }
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    let header=document.querySelector("header");
    if (header&&"IntersectionObserver" in window){
        let observer=new IntersectionObserver((entries)=>{
            let entry=entries[0];
            if (!entry.isIntersecting){
                nav.classList.add("nav--pinned");
            }
            else{
                nav.classList.remove("nav--pinned");
            }
        },{
            root: null,
            threshold: 0
        });
        observer.observe(header);
    }
    else{
        let fallback=()=>{
            if (header.getBoundingClientRect().bottom<=0){
                nav.classList.add("nav--pinned");
            }
            else{
                nav.classList.remove("nav--pinned");
            }
        };
        window.addEventListener("scroll", fallback, {passive: true});
        fallback();
    }
});