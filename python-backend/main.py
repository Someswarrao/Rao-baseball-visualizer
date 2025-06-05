from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import plotly.graph_objects as go
import os

app = FastAPI()

# Allow CORS for local dev and Vercel frontend
origins = [
    "http://localhost:3000",
    "https://rao-baseball-frontend.vercel.app",
    "https://rao-baseball-visualizer.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create and mount static directory
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root route (for Render health check or browser testing)
@app.get("/")
async def root():
    return {"message": "Backend is running"}

# Request model for pitch simulation
class PitchParameters(BaseModel):
    pitcher_hand: str
    pitch_type: str
    x: float
    y: float
    z: float
    speed: float
    spin_rate: float
    theta: float
    phi: float

# Simulation route
@app.post("/simulate")
async def run_simulation(params: PitchParameters):
    # Simulated trajectory data (dummy for now)
    x = [params.x + i * 0.1 for i in range(50)]
    y = [params.y + i * 0.1 for i in range(50)]
    z = [params.z - 0.01 * i**2 for i in range(50)]

    # Create Plotly 3D figure
    fig = go.Figure(data=[go.Scatter3d(x=x, y=y, z=z, mode='lines+markers')])
    fig.update_layout(
        scene=dict(
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z'
        ),
        title="Pitch Trajectory"
    )

    # Save HTML file to static directory
    file_path = os.path.join("static", "pitch_result.html")
    fig.write_html(file_path)

    return {"file_path": "/static/pitch_result.html"}
