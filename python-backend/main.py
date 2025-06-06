from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, validator
from simulate_pitch import run_simulation  # Your simulation function
import uuid
import os

app = FastAPI()

# Allow your frontend domain or '*' for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (HTML plots)
app.mount("/static", StaticFiles(directory="static"), name="static")

class PitchRequest(BaseModel):
    handedness: str
    pitchType: str = None
    initialVelocity: float
    spinRate: float
    releasePosition: str
    theta: float
    phi: float

    @validator("handedness")
    def validate_handedness(cls, v):
        if v not in ("LHP", "RHP"):
            raise ValueError("handedness must be 'LHP' or 'RHP'")
        return v

    @validator("releasePosition")
    def validate_release_position(cls, v):
        parts = v.split(",")
        if len(parts) != 3:
            raise ValueError("releasePosition must be 'x,y,z'")
        try:
            [float(p) for p in parts]
        except ValueError:
            raise ValueError("releasePosition must contain valid floats")
        return v

@app.get("/")
async def root():
    return {"message": "Baseball Visualizer backend is running"}

@app.post("/simulate")
async def simulate_pitch(pitch: PitchRequest):
    try:
        unique_id = str(uuid.uuid4())
        filename = f"pitch_result_{unique_id}.html"
        filepath = os.path.join("static", filename)

        # run_simulation should:
        # - accept pitch data dict
        # - output HTML plot to filepath
        # - return (html_file_path, final_position_dict)
        html_file, final_position = run_simulation(pitch.dict(), output_html_path=filepath)

        return {
            "htmlFile": filename,
            "finalPosition": final_position
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
