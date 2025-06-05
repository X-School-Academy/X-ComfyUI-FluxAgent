#!/usr/bin/env python3
"""
Test script for the ChatBot functionality
"""

import sys
import os
import asyncio
from unittest.mock import Mock, patch

# Add the project root to Python path
sys.path.append('/Users/frankhe/myworks/X-ComfyUI')

# Mock the server module since we're testing standalone
class MockPromptServer:
    def __init__(self):
        self.routes = Mock()
    
    def send_sync(self, event, data, sid=None):
        print(f"Mock send_sync called with event: {event}, data: {data}")

sys.modules['server'] = Mock()
sys.modules['server'].PromptServer = Mock()
sys.modules['server'].PromptServer.instance = MockPromptServer()

# Mock aiohttp
sys.modules['aiohttp'] = Mock()
sys.modules['aiohttp'].web = Mock()

# Now import our ChatBotService
from fluxagent.ChatBotService import ChatBotService

def test_chatbot_service():
    """Test the ChatBotService functionality"""
    print("Testing ChatBotService...")
    
    # Test without API key
    print("\n1. Testing without API key:")
    service = ChatBotService()
    
    # Mock the API key for testing
    service.api_key = "test_key"
    
    # Test with mock response
    print("\n2. Testing with mock OpenAI response:")
    
    with patch('requests.post') as mock_post:
        # Mock successful response
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "Hello! This is a test response from the AI."
                }
            }]
        }
        mock_post.return_value = mock_response
        
        # Test the method
        result = asyncio.run(service.get_openai_response("Hello, how are you?"))
        print(f"Result: {result}")
        
        # Verify the request was made correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        print(f"API call made with URL: {call_args[1]['url'] if 'url' in call_args[1] else call_args[0][0]}")
        
    print("\n3. Testing error handling:")
    
    with patch('requests.post') as mock_post:
        # Mock error response
        mock_post.side_effect = Exception("Test error")
        
        result = asyncio.run(service.get_openai_response("Test message"))
        print(f"Error result: {result}")
    
    print("\nChatBotService tests completed successfully!")

if __name__ == "__main__":
    # Set environment variable for testing
    os.environ['OPENAI_API_KEY'] = 'test_key_for_testing'
    
    test_chatbot_service()
