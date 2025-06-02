import os
import openai
from typing import List
import asyncio
import aiofiles
import requests
from io import BytesIO
from pathlib import Path

class OpenAIService:
    def __init__(self):
        self.client = openai.AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def generate_text(self, prompt: str, max_tokens: int = 1000) -> str:
        """
        Generate text using OpenAI's latest GPT model
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",  # Use latest available model
                messages=[
                    {"role": "system", "content": "You are a creative storyteller and scriptwriter."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Error generating text: {str(e)}")
    
    async def generate_image(self, prompt: str, output_path: str, style: str = "vivid") -> str:
        """
        Generate image using OpenAI's DALL-E 3
        """
        try:
            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                style=style,
                n=1
            )
            
            image_url = response.data[0].url
            
            # Download the image
            async with aiofiles.open(output_path, 'wb') as f:
                image_response = requests.get(image_url)
                await f.write(image_response.content)
            
            return output_path
        except Exception as e:
            raise Exception(f"Error generating image: {str(e)}")
    
    async def generate_speech(self, text: str, output_path: str, voice: str = "alloy") -> str:
        """
        Generate speech using OpenAI's TTS model
        """
        try:
            response = await self.client.audio.speech.create(
                model="tts-1-hd",  # Use high-quality TTS model
                voice=voice,  # alloy, echo, fable, onyx, nova, shimmer
                input=text,
                speed=1.0
            )
            
            # Save the audio file
            async with aiofiles.open(output_path, 'wb') as f:
                async for chunk in response.iter_bytes():
                    await f.write(chunk)
            
            return output_path
        except Exception as e:
            raise Exception(f"Error generating speech: {str(e)}")
    
    async def break_story_into_scenes(self, story: str) -> List[str]:
        """
        Break a story into multiple scenes using natural narrative segmentation
        """
        prompt = f"""
        Break the following story into 3-7 distinct scenes for video creation. Each scene should:
        1. Be a self-contained narrative moment
        2. Have clear visual potential
        3. Be 1-3 sentences long
        4. Progress the story naturally
        
        Return ONLY the scenes, one per line, numbered:
        
        Story: {story}
        """
        
        response = await self.generate_text(prompt, max_tokens=500)
        
        # Parse the response into individual scenes
        lines = response.strip().split('\n')
        scenes = []
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                # Remove numbering if present
                if '. ' in line and line[0].isdigit():
                    line = line.split('. ', 1)[1]
                scenes.append(line)
        
        return scenes if scenes else [story]  # Fallback to original story
    
    async def generate_scene_script(self, scene_text: str, style: str = "cinematic") -> str:
        """
        Generate a concise narration script for a scene
        """
        prompt = f"""
        Create a concise, engaging narration script for this scene. The script should:
        1. Be 15-30 seconds when spoken (about 30-70 words)
        2. Use vivid, descriptive language
        3. Match a {style} style
        4. Be suitable for voice-over narration
        5. Enhance the visual storytelling
        
        Scene: {scene_text}
        
        Return ONLY the narration script:
        """
        
        return await self.generate_text(prompt, max_tokens=150)
    
    async def generate_image_prompt(self, scene_text: str, style: str = "cinematic") -> str:
        """
        Generate a detailed image prompt for DALL-E based on scene text
        """
        prompt = f"""
        Create a detailed, visual prompt for DALL-E 3 to generate an image for this scene:
        
        Scene: {scene_text}
        Style: {style}
        
        The prompt should:
        1. Be descriptive and specific about visual elements
        2. Include lighting, composition, and mood details
        3. Specify the {style} style
        4. Be suitable for a video frame
        5. Be under 400 characters
        
        Return ONLY the image generation prompt:
        """
        
        return await self.generate_text(prompt, max_tokens=100)
