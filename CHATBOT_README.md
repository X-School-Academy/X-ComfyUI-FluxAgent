# X-FluxAgent ChatBot Implementation

## Overview

This implementation provides a custom ComfyUI chatbot tab that integrates with OpenAI's Chat API to provide an interactive AI assistant within the ComfyUI interface.

## Files Modified/Created

### 1. `fluxagent/ChatBotService.py`
- **Purpose**: Backend service that handles chatbot functionality
- **Features**:
  - OpenAI API integration using environment variables
  - Async message handling
  - Error handling and user feedback
  - WebSocket communication with the frontend
  - Loading state management

### 2. `js/fluxagent/ChatBotTab.js`  
- **Purpose**: Frontend UI for the chatbot tab
- **Features**:
  - Sidebar tab registration in ComfyUI
  - Markdown rendering for AI responses
  - Auto-scrolling chat interface
  - Loading indicators
  - Multi-line input with Send button
  - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
  - Responsive design with proper styling

## Setup Requirements

### Environment Variables
Make sure you have an OpenAI API key set in your `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Dependencies
The following dependencies are required (already in requirements.txt):
- `python-dotenv` - For loading environment variables
- `requests` - For making HTTP requests to OpenAI API

## Usage

1. **Installation**: The extension auto-loads when ComfyUI starts
2. **Access**: Look for the "AI ChatBot" tab in the ComfyUI sidebar (chat icon)
3. **Interaction**: 
   - Type messages in the text area at the bottom
   - Click "Send" or press Enter to send messages
   - AI responses appear in the main chat area with markdown formatting
   - The interface automatically scrolls to show new messages unless you've manually scrolled up

## Technical Details

### Communication Flow
1. User types message in the UI
2. JavaScript sends POST request to `/X-FluxAgent-chatbot-message`
3. Python service processes the message and calls OpenAI API
4. Service sends response via WebSocket using `PromptServer.instance.send_sync()`
5. JavaScript receives the response and updates the UI

### WebSocket Events
- `X-FluxAgent.chatbot.message` - Sends chat messages and responses
- `X-FluxAgent.chatbot.loading` - Manages loading state

### Error Handling
- API key validation
- Network error handling
- Request timeout handling
- User-friendly error messages displayed in chat

## Customization

### Changing the AI Model
Edit the `data` object in `ChatBotService.py`:
```python
data = {
    "model": "gpt-4",  # Change this to gpt-3.5-turbo, etc.
    "messages": messages,
    "max_tokens": 1000,
    "temperature": 0.7
}
```

### Modifying the System Message
Edit the default system message in the `get_openai_response` method:
```python
messages.append({
    "role": "system", 
    "content": "Your custom system message here"
})
```

### UI Styling
The CSS is embedded in the JavaScript file and can be modified to change colors, fonts, layout, etc.

## Troubleshooting

1. **No response from chatbot**: Check that OPENAI_API_KEY is set correctly
2. **Chat tab not appearing**: Ensure the extension is properly loaded and WEB_DIRECTORY is set
3. **JavaScript errors**: Check browser console for any import/syntax issues
4. **API errors**: Check ComfyUI console for error messages from the Python service

## Notes

- The chatbot service runs for the lifetime of the ComfyUI instance
- User messages are not displayed in the chat (as per requirements)
- The interface supports markdown formatting for AI responses
- Auto-scrolling behavior respects user scroll position
