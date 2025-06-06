from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from simulate_pitch import run_simulation

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (e.g., HTML visualizations)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Request schema for pitch parameters
class PitchRequest(BaseModel):
    handedness: str
    initialVelocity: str
    spinRate: str
    releasePosition: str  # Expected as a string like "x,y,z"
    theta: str
    phi: str

# Health check route
@app.get("/")
async def root():
    return {"message": "Baseball Visualizer backend is running"}

# Route to process simulation and return result
@app.post("/simulate")
async def simulate_pitch(pitch: PitchRequest):
    html_file, final_position = run_simulation(pitch.dict())
    return {
        "htmlFile": html_file,  # e.g., "static/pitch_result.html"
        "finalPosition": final_position
    }
