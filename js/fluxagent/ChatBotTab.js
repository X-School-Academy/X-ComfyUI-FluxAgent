import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

// Simple markdown-to-HTML converter
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')  
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*?)__/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/_(.*?)_/gim, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]*)`/gim, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank">$1</a>')
        // Line breaks
        .replace(/\n/gim, '<br>');
    
    return html;
}

app.extensionManager.registerSidebarTab({
  id: "X-FLuxAgent-ChatBotTab",
  icon: "pi pi-comments",
  title: "AI ChatBot",
  tooltip: "X-FluxAgent ChatBot",
  type: "custom",
  render: (el) => {
    let userScrolledUp = false;
    let messageContainer;
    let inputArea;
    let sendButton;
    let loadingIndicator;
    
    // Create the main UI
    function createUI() {
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; padding: 10px; box-sizing: border-box;">
          <!-- Chat messages area -->
          <div id="chat-messages" style="
            flex: 1; 
            overflow-y: auto; 
            border: 1px solid #444; 
            padding: 10px; 
            margin-bottom: 10px; 
            background: #1e1e1e; 
            border-radius: 5px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
          ">
            <div style="color: #888; font-style: italic; margin-bottom: 10px;">
              Welcome to X-FluxAgent ChatBot! Ask me anything.
            </div>
          </div>
          
          <!-- Loading indicator -->
          <div id="loading-indicator" style="
            display: none; 
            color: #888; 
            font-style: italic; 
            margin-bottom: 10px;
            text-align: center;
          ">
            <span style="animation: pulse 1.5s ease-in-out infinite alternate;">AI is thinking...</span>
          </div>
          
          <!-- Input area -->
          <div style="display: flex; gap: 8px;">
            <textarea 
              id="user-input" 
              placeholder="Type your message here..." 
              style="
                flex: 1; 
                min-height: 60px; 
                max-height: 120px; 
                padding: 8px; 
                border: 1px solid #444; 
                border-radius: 4px; 
                background: #2a2a2a; 
                color: #fff; 
                resize: vertical;
                font-family: inherit;
                font-size: 14px;
              "
            ></textarea>
            <button 
              id="send-button" 
              style="
                padding: 8px 16px; 
                background: #007acc; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
                height: fit-content;
                align-self: flex-end;
              "
            >Send</button>
          </div>
        </div>
        
        <style>
          @keyframes pulse {
            from { opacity: 0.6; }
            to { opacity: 1; }
          }
          
          #chat-messages h1, #chat-messages h2, #chat-messages h3 {
            margin: 10px 0 5px 0;
            color: #fff;
          }
          
          #chat-messages h1 { font-size: 1.5em; }
          #chat-messages h2 { font-size: 1.3em; }
          #chat-messages h3 { font-size: 1.1em; }
          
          #chat-messages code {
            background: #333;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          }
          
          #chat-messages pre {
            background: #333;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 10px 0;
          }
          
          #chat-messages pre code {
            background: none;
            padding: 0;
          }
          
          #chat-messages strong {
            color: #fff;
            font-weight: bold;
          }
          
          #chat-messages em {
            font-style: italic;
            color: #ccc;
          }
          
          #chat-messages a {
            color: #007acc;
            text-decoration: none;
          }
          
          #chat-messages a:hover {
            text-decoration: underline;
          }
          
          .message-bubble {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
            max-width: 90%;
          }
          
          .user-message {
            background: #007acc;
            color: white;
            margin-left: auto;
            margin-right: 0;
          }
          
          .ai-message {
            background: #333;
            color: #fff;
            margin-left: 0;
            margin-right: auto;
          }
          
          .error-message {
            background: #d32f2f;
            color: white;
            margin-left: 0;
            margin-right: auto;
          }
        </style>
      `;
      
      messageContainer = el.querySelector('#chat-messages');
      inputArea = el.querySelector('#user-input');
      sendButton = el.querySelector('#send-button');
      loadingIndicator = el.querySelector('#loading-indicator');
    }
    
    // Send message function
    function sendMessage() {
      const message = inputArea.value.trim();
      if (!message) return;
      
      // Clear input
      inputArea.value = '';
      
      // Add user message to chat (but don't display it as per requirements)
      // addMessageToChat(message, 'user');
      
      // Show loading
      showLoading(true);
      
      // Send message to server
      const requestData = {
        message: message
      };
      
      console.log('Sending message:', message);
      
      api.fetchApi("/X-FluxAgent-chatbot-message", { 
        method: "POST", 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      }).then(data => {
        console.log('Message sent successfully:', data);
      }).catch(error => {
        console.error('Error sending message:', error);
        addMessageToChat(`Error: Failed to send message - ${error.message}`, 'error');
        showLoading(false);
      });
    }
    
    // Add message to chat display
    function addMessageToChat(message, type = 'ai') {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message-bubble ${type}-message`;
      
      if (type === 'ai' || type === 'error') {
        messageDiv.innerHTML = markdownToHtml(message);
      } else {
        messageDiv.textContent = message;
      }
      
      messageContainer.appendChild(messageDiv);
      
      // Auto-scroll to bottom unless user has scrolled up
      if (!userScrolledUp) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
    
    // Show/hide loading indicator
    function showLoading(show) {
      if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
      }
      if (sendButton) {
        sendButton.disabled = show;
        sendButton.textContent = show ? 'Sending...' : 'Send';
      }
    }
    
    // Track user scrolling
    function setupScrollTracking() {
      messageContainer.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = messageContainer;
        // Consider user scrolled up if they're more than 50px from the bottom
        userScrolledUp = scrollTop < scrollHeight - clientHeight - 50;
      });
    }
    
    // Handle message responses
    function messageHandler(event) {
      const data = event.detail;
      console.log("Received message:", data);
      
      showLoading(false);
      
      if (data.error) {
        addMessageToChat(data.error, 'error');
      } else if (data.ai_response) {
        addMessageToChat(data.ai_response, 'ai');
      }
    }
    
    // Handle loading state
    function loadingHandler(event) {
      const data = event.detail;
      showLoading(data.loading);
    }
    
    // Initialize UI
    createUI();
    setupScrollTracking();
    
    // Setup event listeners
    sendButton.addEventListener('click', sendMessage);
    
    inputArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Setup API event listeners
    api.addEventListener("X-FluxAgent.chatbot.message", messageHandler);
    api.addEventListener("X-FluxAgent.chatbot.loading", loadingHandler);

    // Cleanup function
    return () => {
      api.removeEventListener("X-FluxAgent.chatbot.message", messageHandler);
      api.removeEventListener("X-FluxAgent.chatbot.loading", loadingHandler);
      el.innerHTML = ''; 
    }
  }
});