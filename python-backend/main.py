from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict
import os
from simulate_pitch import run_simulation  # You should have this function implemented

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static simulation output files (e.g., HTML)
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Input schema from frontend
class PitchRequest(BaseModel):
    handedness: str
    initialVelocity: str
    spinRate: str
    releasePosition: str  # Comma-separated string: "x,y,z"
    theta: str
    phi: str

@app.post("/simulate")
def simulate_pitch(pitch: PitchRequest) -> Dict:
    try:
        result = run_simulation(pitch.dict())
        html_file, final_position = result

        return {
            "htmlFile": html_file,  # Example: "static/trajectory.html"
            "finalPosition": final_position  # Example: {"y": 17.32, "z": 0.85}
        }

    except Exception as e:
        return {
            "error": f"Simulation failed: {str(e)}"
        }
