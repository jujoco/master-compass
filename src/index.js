import "./styles/index.css";
import App from "./app.js";

window.addEventListener("load", async () => {
	const app = new App();
	await app.render();
});
