import math
import numpy as np
import plotly.graph_objects as go
import plotly.io as pio
import os  # ✅ For creating the static folder if it doesn't exist

def run_simulation(pitch_data):
    # ─── Constants ───────────────────────────────────────────
    m = 0.145
    g = 9.81
    rho = 1.225
    A = 0.00421
    mu = 1.81e-5
    R = 0.037
    D = 2 * R
    dt = 0.0005
    L = 18.4

    # ─── Input Parameters ─────────────────────────────────────
    handedness = pitch_data["handedness"]
    V0 = float(pitch_data["initialVelocity"])
    spin_rate = float(pitch_data["spinRate"])
    x0, y0, z0 = map(float, pitch_data["releasePosition"].split(","))
    theta = math.radians(float(pitch_data["theta"]))
    phi = math.radians(float(pitch_data["phi"]))

    # ─── Initial Velocity and Spin ────────────────────────────
    omega = 2 * math.pi * spin_rate / 60
    Vx = V0 * math.cos(theta) * math.cos(phi)
    Vy = V0 * math.sin(theta)
    Vz = V0 * math.cos(theta) * math.sin(phi)

    omega_x = omega * math.cos(theta) * math.cos(phi)
    omega_y = omega * math.sin(theta)
    omega_z = omega * math.cos(theta) * math.sin(phi)
    if handedness == "RHP":
        omega_z = -omega_z

    vertical_lift_scale = 0.85 if handedness == "RHP" else 1.0
    x, y, z = x0, y0, z0
    trajectory = [(x, y, z)]

    while x < L:
        V = math.sqrt(Vx**2 + Vy**2 + Vz**2)
        Re = (rho * D * V) / mu
        rps = spin_rate / 60
        spin_factor = (R * rps) / V
        Cd = 0.30 + 0.15 * spin_factor**2

        Cl = (0.05 if handedness == "RHP" else 0.09) + 0.6 * spin_factor

        Fd = 0.5 * Cd * rho * A * V**2
        Fl = 0.5 * Cl * rho * A * V**2

        ax_d = -Fd * Vx / (m * V)
        ay_d = -Fd * Vy / (m * V)
        az_d = -Fd * Vz / (m * V)

        cx = omega_y * Vz - omega_z * Vy
        cy = omega_z * Vx - omega_x * Vz
        cz = omega_x * Vy - omega_y * Vx
        mag = math.sqrt(cx**2 + cy**2 + cz**2) + 1e-8
        nx, ny, nz = cx / mag, cy / mag, cz / mag

        ax_l = Fl * nx / m
        ay_l = Fl * ny / m * vertical_lift_scale
        az_l = Fl * nz / m

        Vx += (ax_d + ax_l) * dt
        Vy += (ay_d + ay_l - g) * dt
        Vz += (az_d + az_l) * dt

        x += Vx * dt
        y += Vy * dt
        z += Vz * dt
        trajectory.append((x, y, z))

    trajectory = np.array(trajectory)
    fx, fy, fz = trajectory[-1]

    trace_traj = go.Scatter3d(
        x=trajectory[:, 0],
        y=trajectory[:, 1],
        z=trajectory[:, 2],
        mode='lines',
        line=dict(color='royalblue', width=4, dash='dash'),
        name='Trajectory'
    )

    sz_top, sz_bottom = 1.0, 0.6
    sz_left, sz_right = -0.2159, 0.2159
    strike_zone_lines = [
        [[L, L], [sz_bottom, sz_bottom], [sz_left, sz_right]],
        [[L, L], [sz_top, sz_top], [sz_left, sz_right]],
        [[L, L], [sz_bottom, sz_top], [sz_left, sz_left]],
        [[L, L], [sz_bottom, sz_top], [sz_right, sz_right]],
    ]

    strike_traces = [
        go.Scatter3d(
            x=line[0], y=line[1], z=line[2],
            mode='lines',
            line=dict(color='black', width=4),
            name='Strike Zone' if i == 0 else '',
            showlegend=(i == 0)
        ) for i, line in enumerate(strike_zone_lines)
    ]

    layout = go.Layout(
        title=f"{handedness} Pitch Trajectory with Strike Zone",
        scene=dict(
            xaxis=dict(title='Distance to catcher (x)', range=[0, 20]),
            yaxis=dict(title='Height (y)', range=[0, 2]),
            zaxis=dict(title='Horizontal Break (z)', range=[-2, 2]),
            aspectratio=dict(x=2, y=1, z=1),
            camera=dict(eye=dict(x=-2, y=0, z=1.5))
        )
    )

    fig = go.Figure(data=[trace_traj] + strike_traces, layout=layout)

    # ✅ Ensure static directory exists
    os.makedirs("static", exist_ok=True)

    # ✅ Save HTML inside static folder
    file_path = "static/pitch_result.html"
    pio.write_html(fig, file_path)

    return file_path, {"y": round(fy, 2), "z": round(fz, 2)}
