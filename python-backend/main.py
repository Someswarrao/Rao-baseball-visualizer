from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from simulate_pitch import run_simulation  # Your simulation function
import uuid
import os

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from 'static' folder
app.mount("/static", StaticFiles(directory="static"), name="static")

class PitchRequest(BaseModel):
    handedness: str
    pitchType: str = None  # optional if you want
    initialVelocity: str
    spinRate: str
    releasePosition: str
    theta: str
    phi: str

@app.get("/")
async def root():
    return {"message": "Baseball Visualizer backend is running"}

@app.post("/simulate")
async def simulate_pitch(pitch: PitchRequest):
    # Generate a unique filename for each request
    unique_id = str(uuid.uuid4())
    filename = f"pitch_result_{unique_id}.html"
    filepath = os.path.join("static", filename)

    # Run your simulation, save result plot HTML to 'filepath'
    # Modify run_simulation to accept filepath or adapt accordingly
    html_file, final_position = run_simulation(pitch.dict(), output_html_path=filepath)

    # Make sure run_simulation returns the path you wrote to
    # Return only the filename to frontend (without 'static/')
    return {
        "htmlFile": filename,
        "finalPosition": final_position
    }
