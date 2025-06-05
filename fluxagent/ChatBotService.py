import os
import json
import requests
import asyncio
from server import PromptServer
from aiohttp import web

routes = PromptServer.instance.routes

class ChatBotService:
    """
    Service for handling chatbot functionality with OpenAI integration
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("Warning: OPENAI_API_KEY not found in environment variables")
        else:
            print("ChatBotService initialized with OpenAI API key")
    
    def get_openai_response(self, user_message, system_message=None):
        """
        Get response from OpenAI API
        
        Args:
            user_message: The user's message
            system_message: Optional system message
            
        Returns:
            str: The AI response
        """
        if not self.api_key:
            return "Error: OpenAI API key not configured"
        
        # Prepare the messages
        messages = []
        
        # Add system message if provided
        if system_message and system_message.strip():
            messages.append({
                "role": "system",
                "content": system_message
            })
        else:
            # Default system message for chatbot
            messages.append({
                "role": "system",
                "content": "You are a helpful AI assistant specialized in programming and technical topics. Respond concisely and helpfully. When providing code examples, use proper markdown code blocks with language specification for syntax highlighting. Feel free to use markdown formatting like **bold**, *italics*, `inline code`, lists, and tables when appropriate."
            })

        # Add user message
        if user_message and user_message.strip():
            messages.append({
                "role": "user",
                "content": user_message
            })
        else:
            return "Error: User message is empty"
        
        # API endpoint
        url = "https://api.openai.com/v1/chat/completions"
        
        # Headers
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        # Request body
        data = {
            "model": "gpt-4.1",
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        try:
            # Make the API request
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Extract the assistant's response
            if "choices" in result and len(result["choices"]) > 0:
                assistant_response = result["choices"][0]["message"]["content"]
                return assistant_response
            else:
                return "Error: No response from API"
                
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP Error: {e}"
            if hasattr(e, 'response') and e.response.text:
                try:
                    error_details = e.response.json()
                    error_msg += f"\nDetails: {error_details.get('error', {}).get('message', 'Unknown error')}"
                except:
                    error_msg += f"\nResponse: {e.response.text}"
            return error_msg
            
        except requests.exceptions.RequestException as e:
            return f"Request Error: {e}"
            
        except Exception as e:
            return f"Error: {e}"

# Create global service instance
chatbot_service = ChatBotService()

@routes.post('/X-FluxAgent-chatbot-message')
async def on_message(request):
    """
    Handle incoming chatbot messages
    """
    try:
        print("Received chatbot message request")
        
        # Get the message data
        data = await request.json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            print("Error: Empty message received")
            return web.json_response({'error': 'Message is required'}, status=400)
        
        print(f"Processing message: {user_message[:100]}...")  # Log first 100 chars
        
        # Send loading indicator
        PromptServer.instance.send_sync("X-FluxAgent.chatbot.loading", {
            "loading": True
        })
        
        # Get AI response (run in thread pool to avoid blocking)
        loop = asyncio.get_event_loop()
        ai_response = await loop.run_in_executor(
            None, 
            chatbot_service.get_openai_response, 
            user_message
        )
        
        # Send the response back to the client
        print(f"Sending AI response: {ai_response[:100]}...")  # Log first 100 chars
        PromptServer.instance.send_sync("X-FluxAgent.chatbot.message", {
            "user_message": user_message,
            "ai_response": ai_response,
            "timestamp": int(asyncio.get_event_loop().time() * 1000),  # Unix timestamp in milliseconds
            "loading": False
        })
        
        return web.json_response({'status': 'success'})
        
    except Exception as e:
        print(f"Error in chatbot service: {e}")
        
        # Send error response
        PromptServer.instance.send_sync("X-FluxAgent.chatbot.message", {
            "error": str(e),
            "loading": False
        })
        
        return web.json_response({'error': str(e)}, status=500)