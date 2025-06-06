from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulate_pitch import run_simulation  # ⬅️ You must have simulate_pitch.py in same folder

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define expected input model
class PitchRequest(BaseModel):
    handedness: str
    initialVelocity: str
    spinRate: str
    releasePosition: str
    theta: str
    phi: str

@app.post("/simulate")
def simulate_pitch(pitch: PitchRequest):
    html_file, final_position = run_simulation(pitch.dict())
    return {
        "htmlFile": html_file,
        "finalPosition": final_position
    } 




