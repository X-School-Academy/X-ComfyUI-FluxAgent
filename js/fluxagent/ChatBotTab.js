import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

app.extensionManager.registerSidebarTab({
  id: "X-FLuxAgent-ChatBotTab",
  icon: "pi pi-compass",
  title: "X-FLuxAgent",
  tooltip: "X-FLuxAgent",
  type: "custom",
  render: (el) => {
   
    function send_message(message) {
        const body = new FormData();
        body.append('message',message);
        api.fetchApi("/X-FluxAgent-chatbot-message", { method: "POST", body, });
    }

    function messageHandler(event) {
      const message = event.detail;
      console.log("Received message:", message);
    }

    api.addEventListener("X-FluxAgent.chatbot.message", messageHandler);

     el.innerHTML = '<div>ChatBot</div>';

    return () => {
        api.removeEventListener("X-FluxAgent.chatbot.message", messageHandler);
        el.innerHTML = ''; 
    }
  }
});