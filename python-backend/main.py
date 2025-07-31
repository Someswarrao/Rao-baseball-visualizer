from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from simulate_pitch import run_simulation
import os

app = FastAPI()

# Allow your real frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rao-baseball-visualizer.vercel.app"],  # or ["*"] for testing only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

class PitchRequest(BaseModel):
    handedness: str
    initialVelocity: str
    spinRate: str
    releasePosition: str
    theta: str
    phi: str

@app.post("/simulate")
async def simulate_pitch(pitch: PitchRequest):
    try:
        html_file, final_position = run_simulation(pitch.dict())
        if not html_file:
            return JSONResponse(status_code=500, content=final_position)
        return {
            "htmlFile": html_file,  # e.g., static/pitch_result.html
            "finalPosition": final_position
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Internal error: {e}"})

@app.api_route("/", methods=["GET", "HEAD"])
async def root(request: Request):
    return JSONResponse(content={"message": "✅ Baseball simulation backend is running"})
