from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from simulate_pitch import run_simulation
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

# ✅ Serve static HTML files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Input schema
class PitchRequest(BaseModel):
    handedness: str
    initialVelocity: str
    spinRate: str
    releasePosition: str
    theta: str
    phi: str

# Route
@app.post("/simulate")
def simulate_pitch(pitch: PitchRequest):
    html_file, final_position = run_simulation(pitch.dict())
    return {
        "htmlFile": html_file,  # e.g., static/pitch_result.html
        "finalPosition": final_position
    }
