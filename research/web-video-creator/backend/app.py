import os
from typing import List, Dict, Any
import asyncio
import uuid
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

from services.openai_service import OpenAIService
from services.scene_processor import SceneProcessor
from services.video_creator import VideoCreator

# Initialize FastAPI app
app = FastAPI(title="AI Web Video Creator", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
openai_service = OpenAIService()
scene_processor = SceneProcessor(openai_service)
video_creator = VideoCreator()

# Create necessary directories
os.makedirs("outputs", exist_ok=True)
os.makedirs("temp", exist_ok=True)

# Pydantic models
class StoryRequest(BaseModel):
    story: str
    style: str = "cinematic"
    voice: str = "alloy"

class VideoJobStatus(BaseModel):
    job_id: str
    status: str
    progress: float
    message: str
    video_url: str = None
    scenes: List[Dict[str, Any]] = []

# In-memory job storage (use Redis in production)
job_storage: Dict[str, VideoJobStatus] = {}

@app.get("/")
async def root():
    return {"message": "AI Web Video Creator API", "version": "1.0.0"}

@app.post("/create-video")
async def create_video(request: StoryRequest, background_tasks: BackgroundTasks):
    """
    Create a video from a story using AI
    """
    job_id = str(uuid.uuid4())
    
    # Initialize job status
    job_storage[job_id] = VideoJobStatus(
        job_id=job_id,
        status="started",
        progress=0.0,
        message="Processing story..."
    )
    
    # Start background task
    background_tasks.add_task(process_video_creation, job_id, request)
    
    return {"job_id": job_id, "message": "Video creation started"}

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status of a video creation job
    """
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job_storage[job_id]

@app.get("/download/{job_id}")
async def download_video(job_id: str):
    """
    Download the created video
    """
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_status = job_storage[job_id]
    if job_status.status != "completed":
        raise HTTPException(status_code=400, detail="Video not ready")
    
    video_path = f"outputs/{job_id}.mp4"
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"video_{job_id}.mp4"
    )

@app.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its associated files
    """
    if job_id in job_storage:
        # Clean up files
        video_path = f"outputs/{job_id}.mp4"
        temp_dir = f"temp/{job_id}"
        
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir)
        
        del job_storage[job_id]
        return {"message": "Job deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Job not found")

async def process_video_creation(job_id: str, request: StoryRequest):
    """
    Background task to process video creation
    """
    try:
        # Update status
        job_storage[job_id].status = "processing"
        job_storage[job_id].progress = 10.0
        job_storage[job_id].message = "Breaking story into scenes..."
        
        # Step 1: Break story into scenes
        scenes = await scene_processor.break_story_into_scenes(request.story)
        job_storage[job_id].progress = 20.0
        job_storage[job_id].message = f"Generated {len(scenes)} scenes. Processing scenes..."
        
        # Step 2: Process each scene
        processed_scenes = []
        for i, scene in enumerate(scenes):
            job_storage[job_id].message = f"Processing scene {i+1}/{len(scenes)}..."
            
            # Generate script
            script = await scene_processor.generate_scene_script(scene, request.style)
            
            # Generate image
            image_path = await scene_processor.generate_scene_image(
                scene, f"temp/{job_id}/scene_{i}.png", request.style
            )
            
            # Generate audio
            audio_path = await scene_processor.generate_scene_audio(
                script, f"temp/{job_id}/scene_{i}.mp3", request.voice
            )
            
            processed_scene = {
                "scene_number": i + 1,
                "original_text": scene,
                "script": script,
                "image_path": image_path,
                "audio_path": audio_path
            }
            processed_scenes.append(processed_scene)
            
            # Update progress
            progress = 20.0 + (60.0 * (i + 1) / len(scenes))
            job_storage[job_id].progress = progress
        
        job_storage[job_id].scenes = processed_scenes
        job_storage[job_id].progress = 80.0
        job_storage[job_id].message = "Creating final video..."
        
        # Step 3: Create video
        video_path = f"outputs/{job_id}.mp4"
        await video_creator.create_video_from_scenes(processed_scenes, video_path)
        
        # Complete
        job_storage[job_id].status = "completed"
        job_storage[job_id].progress = 100.0
        job_storage[job_id].message = "Video created successfully!"
        job_storage[job_id].video_url = f"/download/{job_id}"
        
    except Exception as e:
        job_storage[job_id].status = "failed"
        job_storage[job_id].message = f"Error: {str(e)}"
        print(f"Error processing job {job_id}: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
