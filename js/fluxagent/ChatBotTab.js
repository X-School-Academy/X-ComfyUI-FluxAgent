import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import markdownIt from 'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm'
import highlightJs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/+esm'

// Configure markdown-it with highlight.js integration
const md = new markdownIt({
    html: true,        // Enable HTML tags in source
    xhtmlOut: false,   // Use '>' for single tags (<br>)
    breaks: true,      // Convert '\n' in paragraphs into <br>
    linkify: true,     // Autoconvert URL-like text to links
    typographer: true, // Enable some language-neutral replacement + quotes beautification
    highlight: function (str, lang) {
        let highlightedCode = '';
        let detectedLang = lang;
        
        if (lang && highlightJs.getLanguage(lang)) {
            try {
                const result = highlightJs.highlight(str, { language: lang, ignoreIllegals: true });
                highlightedCode = result.value;
                detectedLang = lang;
            } catch (err) {
                console.warn('Syntax highlighting failed:', err);
            }
        }
        
        // Auto-detect language if not specified or if specified language failed
        if (!highlightedCode) {
            try {
                const result = highlightJs.highlightAuto(str);
                highlightedCode = result.value;
                detectedLang = result.language || 'text';
            } catch (err) {
                console.warn('Auto syntax highlighting failed:', err);
                highlightedCode = md.utils.escapeHtml(str);
                detectedLang = 'text';
            }
        }
        
        // Add language label
        const langLabel = detectedLang && detectedLang !== 'text' ? 
            `<div class="code-lang-label">${detectedLang}</div>` : '';
        
        return `<div class="code-block-container">
                  ${langLabel}
                  <pre class="hljs" data-lang="${detectedLang}"><code>${highlightedCode}</code></pre>
                </div>`;
    }
});

function markdownToHtml(markdown) {
    if (!markdown) return '';
    return md.render(markdown);
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
              Welcome to X-FluxAgent ChatBot! 🤖<br>
              <small>Ask me anything - I support <strong>markdown</strong> formatting and <code>syntax highlighting</code>!</small>
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
          @import url('https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.css');
          
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
          
          /* Code highlighting styles */
          .code-block-container {
            position: relative;
            margin: 12px 0;
          }
          
          .code-lang-label {
            background: #21262d;
            color: #7d8590;
            padding: 4px 8px;
            font-size: 11px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            border: 1px solid #30363d;
            border-bottom: none;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          
          #chat-messages pre {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 6px;
            overflow-x: auto;
            margin: 0;
            padding: 0;
          }
          
          .code-lang-label + #chat-messages pre,
          .code-lang-label + pre {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-top: none;
          }
          
          #chat-messages pre.hljs {
            background: #0d1117;
            color: #e6edf3;
            padding: 16px;
            border-radius: 6px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.45;
            margin: 0;
          }
          
          #chat-messages code {
            background: #262c36;
            color: #f0f6fc;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 85%;
          }
          
          #chat-messages pre code {
            background: none;
            padding: 0;
            border-radius: 0;
            color: inherit;
            font-size: inherit;
          }
          
          /* Tables */
          #chat-messages table {
            border-collapse: collapse;
            width: 100%;
            margin: 12px 0;
          }
          
          #chat-messages th, #chat-messages td {
            border: 1px solid #444;
            padding: 8px 12px;
            text-align: left;
          }
          
          #chat-messages th {
            background: #333;
            font-weight: bold;
          }
          
          /* Lists */
          #chat-messages ul, #chat-messages ol {
            margin: 8px 0;
            padding-left: 24px;
          }
          
          #chat-messages li {
            margin: 4px 0;
          }
          
          /* Blockquotes */
          #chat-messages blockquote {
            border-left: 4px solid #007acc;
            margin: 12px 0;
            padding: 8px 16px;
            background: #1a1a1a;
            color: #ccc;
          }
          
          /* Horizontal rules */
          #chat-messages hr {
            border: none;
            border-top: 1px solid #444;
            margin: 16px 0;
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
          
          /* Copy button for code blocks */
          .code-block-wrapper {
            position: relative;
          }
          
          .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #21262d;
            border: 1px solid #30363d;
            color: #f0f6fc;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
          }
          
          .code-block-wrapper:hover .copy-button {
            opacity: 1;
          }
          
          .copy-button:hover {
            background: #30363d;
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
        
        // Add copy buttons to code blocks
        if (type === 'ai') {
          addCopyButtonsToCodeBlocks(messageDiv);
        }
      } else {
        messageDiv.textContent = message;
      }
      
      messageContainer.appendChild(messageDiv);
      
      // Auto-scroll to bottom unless user has scrolled up
      if (!userScrolledUp) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
    
    // Add copy buttons to code blocks
    function addCopyButtonsToCodeBlocks(container) {
      const codeContainers = container.querySelectorAll('.code-block-container');
      codeContainers.forEach(codeContainer => {
        const codeBlock = codeContainer.querySelector('pre.hljs');
        if (!codeBlock) return;
        
        // Create wrapper for positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.onclick = () => {
          const code = codeBlock.querySelector('code');
          if (code) {
            navigator.clipboard.writeText(code.textContent).then(() => {
              copyButton.textContent = 'Copied!';
              setTimeout(() => {
                copyButton.textContent = 'Copy';
              }, 2000);
            }).catch(err => {
              console.error('Failed to copy code:', err);
              copyButton.textContent = 'Failed';
              setTimeout(() => {
                copyButton.textContent = 'Copy';
              }, 2000);
            });
          }
        };
        
        // Insert wrapper and move code container into it
        codeContainer.parentNode.insertBefore(wrapper, codeContainer);
        wrapper.appendChild(codeContainer);
        wrapper.appendChild(copyButton);
      });
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