import { App } from './App.js';

window.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new App();
        // Expose app for debugging if needed
        window.app = app; 
    } catch (error) {
        console.error("Critical Error during initialization:", error);
        const loader = document.getElementById('loader');
        if (loader) loader.innerText = "Error: " + error.message;
    }
});
