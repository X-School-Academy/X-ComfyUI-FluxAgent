**AI Prompt:**

You are an expert full-stack developer and AI engineer. Build a Python-based backend system for a web application that turns a user-provided story into a multi-scene video using AI. The workflow includes:

1. **Input**: Receive a story (text) from a frontend via API.
2. **Script Generation**: Break the story into multiple scenes using natural narrative segmentation.
3. **Scene Processing** (for each scene):

   * Use the latest OpenAI GPT model to generate a concise narration script for each scene.
   * Use the latest OpenAI TTS model to generate a high-quality audio file for the scene.
   * Use the latest OpenAI image generation model to create an image that visually represents the scene.
4. **Video Creation**:

   * Use FFmpeg to compile each image and its corresponding audio into a short video clip.
   * Concatenate all clips into one final video.
5. **Output**:

   * Save the video file and return a downloadable link via the API.
   * Optionally, provide progress updates or status tracking if processing time is long.

The entire system should be modular, reusable, and easily deployable on cloud environments. Please write the Python code for this backend, using FastAPI for API endpoints and standard libraries for file management. Include all necessary API calls to OpenAI, scene handling logic, audio/image generation steps, and FFmpeg usage for final video production. You may assume API keys and file paths are securely managed.
