from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from simulate_pitch import run_simulation
import os

app = FastAPI()

# ───── CORS Middleware ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rao-baseball-visualizer.vercel.app"],  # Update for your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───── Serve Static Files ─────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ───── Input Schema ─────
class PitchRequest(BaseModel):
    handedness: str
    initialVelocity: str
    spinRate: str
    releasePosition: str
    theta: str
    phi: str

# ───── Simulation Route ─────
@app.post("/simulate")
async def simulate_pitch(pitch: PitchRequest):
    # Updated to unpack 3 values returned by run_simulation
    html_file, png_file, final_position = run_simulation(pitch.dict())

    if not html_file:
        return JSONResponse(status_code=500, content=final_position)  # final_position may contain error info

    # Return the new png_file key alongside htmlFile and finalPosition
    return {
        "htmlFile": html_file,        # e.g., static/pitch_result.html
        "pngFile": png_file,          # e.g., static/pitch_result.png
        "finalPosition": final_position
    }

# ───── Root Route for Health Check (HEAD + GET) ─────
@app.api_route("/", methods=["GET", "HEAD"])
async def root(request: Request):
    return JSONResponse(content={"message": "✅ Baseball simulation backend is running"})
