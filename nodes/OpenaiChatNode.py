import os
import json
import requests


class OpenAIChatnNode:
    """
    A ComfyUI node for OpenAI chat completion API
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "optional": {
                "system": ("STRING", {
                    "forceInput": True,
                })
            },
            "required": {
                "model": ("STRING", {
                    "default": "gpt-4.1",
                    "multiline": False,
                }),
                "user": ("STRING", {
                    "forceInput": True,
                }),
            },
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("string",)
    FUNCTION = "chat_completion"
    CATEGORY = "X-ComfyUI"
    
    def chat_completion(self, model, user, system=None):
        """
        Call OpenAI chat completion API
        
        Args:
            model: The OpenAI model to use
            system: System message (from link input)
            user: User message (from link input)
            
        Returns:
            Tuple containing the response text
        """

        return ("Good!",)
        
        # Get API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in .env file")
        
        # Prepare the messages
        messages = []
        
        # Add system message if provided
        if system and system.strip():
            messages.append({
                "role": "system",
                "content": system
            })

        if not user or not user.strip():
            raise ValueError(f"User message is empty!")
        
        # Add user message if provided
        if user and user.strip():
            messages.append({
                "role": "user",
                "content": user
            })
        
        # API endpoint
        url = "https://api.openai.com/v1/chat/completions"
        
        # Headers
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        # Request body
        data = {
            "model": model,
            "messages": messages
        }
        
        try:
            # Make the API request
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Extract the assistant's response
            if "choices" in result and len(result["choices"]) > 0:
                assistant_response = result["choices"][0]["message"]["content"]
                print(f"Assistant response: {assistant_response}")
                return (assistant_response,)
            else:
                return ("Error: No response from API",)
                
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP Error: {e}"
            if response.text:
                try:
                    error_details = response.json()
                    error_msg += f"\nDetails: {error_details.get('error', {}).get('message', 'Unknown error')}"
                except:
                    error_msg += f"\nResponse: {response.text}"
            return (error_msg,)
            
        except requests.exceptions.RequestException as e:
            return (f"Request Error: {e}",)
            
        except Exception as e:
            return (f"Error: {e}",)

# Node registration
NODE_CLASS_MAPPINGS = {
    "X-ComfyUI.OpenAIChatnNode": OpenAIChatnNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "X-ComfyUI.OpenAIChatnNode": "OpenAI Chat Node"
}