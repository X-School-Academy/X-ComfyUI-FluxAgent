# AI Web Video Creator

A full-stack web application that transforms user stories into engaging videos using AI. The system leverages OpenAI's latest models for text generation, image creation, and text-to-speech, combined with FFmpeg for video production.

## Features

- **Story-to-Video Pipeline**: Convert text stories into multi-scene videos
- **AI-Powered Content Generation**:
  - GPT-4 for scene segmentation and script writing
  - DALL-E 3 for image generation
  - TTS-1-HD for high-quality voice narration
- **Customizable Styles**: Choose from different visual styles and voice options
- **Real-time Progress Tracking**: Monitor video creation progress
- **Modern Web Interface**: Responsive UI built with Tailwind CSS and Alpine.js
- **RESTful API**: FastAPI backend with comprehensive documentation

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenAI API**: GPT-4, DALL-E 3, TTS-1-HD
- **FFmpeg**: Video processing and creation
- **Python AsyncIO**: Asynchronous processing

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Tailwind CSS**: Utility-first CSS framework
- **Alpine.js**: Lightweight JavaScript framework
- **Responsive Design**: Mobile-friendly interface

## Project Structure

```
web-video-creator/
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── services/
│   │   ├── openai_service.py  # OpenAI API integration
│   │   ├── scene_processor.py # Scene processing logic
│   │   └── video_creator.py   # Video creation with FFmpeg
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── setup.sh              # Setup script
├── frontend/
│   └── index.html            # Web interface
└── README.md                 # This file
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- FFmpeg
- OpenAI API key

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Run the setup script** (macOS/Linux):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Manual setup** (if script doesn't work):
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create directories
   mkdir -p outputs temp uploads
   
   # Copy environment file
   cp .env.example .env
   ```

4. **Configure environment variables**:
   - Edit `.env` file
   - Add your OpenAI API key: `OPENAI_API_KEY=your_key_here`

5. **Start the backend server**:
   ```bash
   python app.py
   ```

   The API will be available at: `http://localhost:8000`
   API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Serve the frontend**:
   ```bash
   cd frontend
   python -m http.server 8080  # Or use any web server
   ```

2. **Open in browser**:
   Navigate to `http://localhost:8080`

## Usage

### Via Web Interface

1. Open the web interface in your browser
2. Enter your story in the text area
3. Choose your preferred style and voice
4. Click "Create Video"
5. Monitor progress in real-time
6. Download your completed video

### Via API

**Create a video**:
```bash
curl -X POST "http://localhost:8000/create-video" \
     -H "Content-Type: application/json" \
     -d '{
       "story": "Once upon a time, there was a brave knight who embarked on a quest to save the kingdom.",
       "style": "cinematic",
       "voice": "alloy"
     }'
```

**Check status**:
```bash
curl "http://localhost:8000/status/{job_id}"
```

**Download video**:
```bash
curl "http://localhost:8000/download/{job_id}" -o video.mp4
```

## API Endpoints

- `POST /create-video`: Start video creation
- `GET /status/{job_id}`: Check job status
- `GET /download/{job_id}`: Download completed video
- `DELETE /job/{job_id}`: Cancel job and cleanup files
- `GET /docs`: API documentation

## Configuration Options

### Video Styles
- `cinematic`: Professional, movie-like visuals
- `natural`: Realistic, natural imagery
- `vivid`: Bright, colorful, vibrant scenes

### Voice Options
- `alloy`: Balanced, neutral voice
- `echo`: Calm, soothing voice
- `fable`: Expressive, storytelling voice
- `onyx`: Deep, authoritative voice
- `nova`: Young, energetic voice
- `shimmer`: Bright, cheerful voice

## Development

### Adding New Features

1. **New AI Services**: Extend `openai_service.py`
2. **Video Processing**: Modify `video_creator.py`
3. **API Endpoints**: Add routes in `app.py`
4. **Frontend**: Update `index.html`

### Testing

```bash
# Install development dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy and install requirements
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "app.py"]
```

### Cloud Deployment

The application is ready for deployment on:
- AWS (EC2, ECS, Lambda with layers)
- Google Cloud Platform (Cloud Run, Compute Engine)
- Heroku (with buildpacks for FFmpeg)
- DigitalOcean App Platform

## Troubleshooting

### Common Issues

1. **FFmpeg not found**:
   - Install FFmpeg: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)

2. **OpenAI API errors**:
   - Check your API key in `.env`
   - Verify API quota and billing

3. **Memory issues**:
   - Adjust video resolution in `video_creator.py`
   - Implement file cleanup

4. **CORS issues**:
   - Configure CORS settings in `app.py` for production

### Performance Optimization

- Implement Redis for job storage
- Add file caching for generated content
- Use CDN for video delivery
- Implement queue system for high load

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- OpenAI for providing state-of-the-art AI models
- FFmpeg community for excellent video processing tools
- FastAPI team for the amazing framework
