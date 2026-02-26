import {initializeUIHandlers} from "./modules/uiHandlers.js";
import {initializeEventListeners} from "./modules/eventListeners.js";
document.addEventListener("DOMContentLoaded", function(){
    initializeUIHandlers();
    fetch("/api/ptable",{
        headers:{
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(function(response){
        if (!response.ok){
            throw new Error("HTTP error! status: "+response.status);
        }
        return response.json();
    })
    .then(function(elementsData){
        initializeEventListeners(elementsData);
    })
    .catch(function(error){
        console.error("Error fetching data:", error);
        let elementInfo=document.getElementById("element-info");
        elementInfo.innerHTML="<p>Error loading element data table</p>";
        elementInfo.classList.add("show");
    });
});