from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import plotly.graph_objects as go
import os

app = FastAPI()

# Allow CORS
origins = [
    "http://localhost:3000",  # local dev
    "https://rao-baseball-frontend.vercel.app",  # Vercel frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create static folder if not exist
if not os.path.exists("static"):
    os.makedirs("static")

# Define request model
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

@app.post("/simulate")
async def run_simulation(params: PitchParameters):
    # Dummy data for plotting
    x = [params.x + i * 0.1 for i in range(50)]
    y = [params.y + i * 0.1 for i in range(50)]
    z = [params.z - 0.01 * i**2 for i in range(50)]

    fig = go.Figure(data=[go.Scatter3d(x=x, y=y, z=z, mode='lines+markers')])
    fig.update_layout(
        scene=dict(
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z'
        ),
        title="Pitch Trajectory"
    )

    # Save file
    file_path = os.path.join("static", "pitch_result.html")
    fig.write_html(file_path)

    return {"file_path": "/static/pitch_result.html"}
