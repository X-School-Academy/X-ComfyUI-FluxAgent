import os
import json
import requests


class ClaudeChatNode:
    """
    A ComfyUI node for Anthropic Claude API
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
                    "default": "claude-sonnet-4-20250514",
                    "multiline": False,
                }),
                "user": ("STRING", {
                    "forceInput": True,
                }),
                "max_tokens": ("INT", {
                    "default": 4096,
                    "min": 1,
                    "max": 8192,
                }),
            },
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("string",)
    FUNCTION = "chat_completion"
    CATEGORY = "X-FluxAgent"
    
    def chat_completion(self, model, user, max_tokens=4096, system=None):
        """
        Call Anthropic Claude API
        
        Args:
            model: The Claude model to use
            system: System message (from link input)
            user: User message (from link input)
            max_tokens: Maximum tokens in response
            
        Returns:
            Tuple containing the response text
        """

        # return ("Good!",)
        
        # Get API key from environment
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        if not user or not user.strip():
            raise ValueError("User message is empty!")
        
        # API endpoint
        url = "https://api.anthropic.com/v1/messages"
        
        # Headers
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        
        # Prepare the request body
        data = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": user
                }
            ]
        }
        
        # Add system message if provided
        if system and system.strip():
            data["system"] = system
        
        try:
            # Make the API request
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Extract Claude's response
            if "content" in result and len(result["content"]) > 0:
                assistant_response = result["content"][0]["text"]
                print(f"Claude response: {assistant_response}")
                return (assistant_response,)
            else:
                return ("Error: No response from Claude API",)
                
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
    "X-FluxAgent.ClaudeChatNode": ClaudeChatNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "X-FluxAgent.ClaudeChatNode": "Claude Chat Node"
}
