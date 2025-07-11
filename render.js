//Use: "terser render.js -o render.min.js --compress --mangle" to compress the file (make the min file)
document.addEventListener("DOMContentLoaded", function(){
    let navLinks=document.querySelectorAll("nav a");
    let mainGroups=Array.from(document.querySelectorAll(".main-groups"));
    let nav=document.querySelector("nav");
    let navHeight=nav.getBoundingClientRect().height;
    function clearActive(){
        navLinks.forEach(function(link){
            link.classList.remove("active");
        });
    }
    navLinks.forEach(function(link){
        link.addEventListener("click",function(e){
            e.preventDefault();
            clearActive();
            this.classList.add("active");
            let targetEl=document.querySelector(this.getAttribute("href"));
            if (targetEl){
                window.scrollTo({
                    top:targetEl.offsetTop-navHeight,
                    behavior:"smooth"
                });
            }
        });
    });
    function onScroll(){
        let scrollPos=window.scrollY+navHeight+5;
        let current=mainGroups[0];
        for(let section of mainGroups){
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
    window.addEventListener("scroll",onScroll);
    onScroll();
});