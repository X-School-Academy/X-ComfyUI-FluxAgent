import os
import subprocess
import asyncio
from typing import List, Dict, Any
from pathlib import Path
import json

class VideoCreator:
    def __init__(self):
        self.temp_dir = "temp"
        self.output_dir = "outputs"
    
    async def create_video_from_scenes(self, scenes: List[Dict[str, Any]], output_path: str) -> str:
        """
        Create a video by combining scene images and audio using FFmpeg
        """
        if not scenes:
            raise ValueError("No scenes provided")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create individual video clips for each scene
        scene_videos = []
        for i, scene in enumerate(scenes):
            scene_video_path = f"{self.temp_dir}/scene_{i}_video.mp4"
            await self._create_scene_video(
                scene['image_path'],
                scene['audio_path'],
                scene_video_path
            )
            scene_videos.append(scene_video_path)
        
        # Concatenate all scene videos
        await self._concatenate_videos(scene_videos, output_path)
        
        # Clean up temporary scene videos
        for video_path in scene_videos:
            if os.path.exists(video_path):
                os.remove(video_path)
        
        return output_path
    
    async def _create_scene_video(self, image_path: str, audio_path: str, output_path: str):
        """
        Create a single scene video from image and audio
        """
        # Get audio duration
        audio_duration = await self._get_audio_duration(audio_path)
        
        # Create video from image and audio
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output file
            '-loop', '1',  # Loop the image
            '-i', image_path,  # Input image
            '-i', audio_path,  # Input audio
            '-c:v', 'libx264',  # Video codec
            '-t', str(audio_duration),  # Duration based on audio
            '-pix_fmt', 'yuv420p',  # Pixel format for compatibility
            '-vf', 'scale=1920:1080',  # Scale to 1080p
            '-c:a', 'aac',  # Audio codec
            '-strict', 'experimental',
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg error creating scene video: {stderr.decode()}")
    
    async def _concatenate_videos(self, video_paths: List[str], output_path: str):
        """
        Concatenate multiple videos into one
        """
        # Create a temporary file list for FFmpeg
        list_file_path = f"{self.temp_dir}/video_list.txt"
        
        with open(list_file_path, 'w') as f:
            for video_path in video_paths:
                f.write(f"file '{os.path.abspath(video_path)}'\n")
        
        # Concatenate videos
        cmd = [
            'ffmpeg',
            '-y',  # Overwrite output file
            '-f', 'concat',
            '-safe', '0',
            '-i', list_file_path,
            '-c', 'copy',  # Copy streams without re-encoding
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg error concatenating videos: {stderr.decode()}")
        
        # Clean up list file
        if os.path.exists(list_file_path):
            os.remove(list_file_path)
    
    async def _get_audio_duration(self, audio_path: str) -> float:
        """
        Get the duration of an audio file using FFprobe
        """
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            audio_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"FFprobe error: {stderr.decode()}")
        
        try:
            result = json.loads(stdout.decode())
            return float(result['format']['duration'])
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise Exception(f"Error parsing audio duration: {str(e)}")
    
    async def add_background_music(self, video_path: str, music_path: str, output_path: str, volume: float = 0.3):
        """
        Add background music to a video (optional feature)
        """
        cmd = [
            'ffmpeg',
            '-y',
            '-i', video_path,
            '-i', music_path,
            '-filter_complex', f'[1:a]volume={volume}[music];[0:a][music]amix=inputs=2:duration=first',
            '-c:v', 'copy',
            '-c:a', 'aac',
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg error adding background music: {stderr.decode()}")
        
        return output_path
