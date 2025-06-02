import os
from pathlib import Path
from typing import List
from services.openai_service import OpenAIService

class SceneProcessor:
    def __init__(self, openai_service: OpenAIService):
        self.openai_service = openai_service
    
    async def break_story_into_scenes(self, story: str) -> List[str]:
        """
        Break a story into multiple scenes
        """
        return await self.openai_service.break_story_into_scenes(story)
    
    async def generate_scene_script(self, scene_text: str, style: str = "cinematic") -> str:
        """
        Generate narration script for a scene
        """
        return await self.openai_service.generate_scene_script(scene_text, style)
    
    async def generate_scene_image(self, scene_text: str, output_path: str, style: str = "cinematic") -> str:
        """
        Generate image for a scene
        """
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Generate detailed image prompt
        image_prompt = await self.openai_service.generate_image_prompt(scene_text, style)
        
        # Generate the image
        return await self.openai_service.generate_image(image_prompt, output_path, style)
    
    async def generate_scene_audio(self, script: str, output_path: str, voice: str = "alloy") -> str:
        """
        Generate audio for a scene script
        """
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Generate the audio
        return await self.openai_service.generate_speech(script, output_path, voice)
