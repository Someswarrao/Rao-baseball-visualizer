import math
import numpy as np
import plotly.graph_objects as go
import plotly.io as pio
import os

def run_simulation(pitch_data):
    try:
        required_keys = ["handedness", "initialVelocity", "spinRate", "releasePosition", "theta", "phi"]
        for key in required_keys:
            if key not in pitch_data:
                raise ValueError(f"Missing input: {key}")

        handedness = pitch_data["handedness"].strip().upper()
        if handedness not in ["LHP", "RHP"]:
            raise ValueError("Handedness must be 'LHP' or 'RHP'")

        V0 = float(pitch_data["initialVelocity"])
        spin_rate = float(pitch_data["spinRate"])
        x0, y0, z0 = map(float, pitch_data["releasePosition"].split(","))
        theta = math.radians(float(pitch_data["theta"]))
        phi = math.radians(float(pitch_data["phi"]))

        m = 0.145
        g = 9.81
        rho = 1.225
        A = 0.00421
        R = 0.037
        dt = 0.0005
        L = 18.4

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
            spin_factor = (R * spin_rate / 60) / V

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
            x=trajectory[:, 0], y=trajectory[:, 1], z=trajectory[:, 2],
            mode='lines',
            line=dict(color='royalblue', width=7),
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
                line=dict(color='black', width=5),
                name='Strike Zone' if i == 0 else ''
            ) for i, line in enumerate(strike_zone_lines)
        ]

        home_x = [18.4, 18.35, 18.45, 18.48, 18.32, 18.4]
        home_y = [0, 0, 0, 0.02, 0.02, 0]
        home_z = [0, -0.10795, -0.10795, 0.0, 0.0, 0.0]
        home_plate = go.Scatter3d(
            x=home_x, y=home_y, z=home_z,
            mode='lines',
            line=dict(color='white', width=4),
            name='Home Plate'
        )

        def wall_surface(x, y, z):
            return go.Surface(
                x=x, y=y, z=z,
                surfacecolor=[[0, 1], [0, 1]],
                colorscale=[[0, 'green'], [1, 'green']],
                opacity=0.4,
                showscale=False,
            )

        xz_plane = go.Surface(
            x=[[0, 20], [0, 20]],
            y=[[0, 0], [0, 0]],
            z=[[-2.5, -2.5], [2.5, 2.5]],
            surfacecolor=[[0, 0], [0, 0]],
            colorscale=[[0, 'saddlebrown'], [1, 'saddlebrown']],
            opacity=1,
            showscale=False,
            name='Dirt Ground'
        )

        yz_right = wall_surface([[20.001, 20.001], [20.001, 20.001]], [[0, 2.5], [0, 2.5]], [[-2.5, -2.5], [2.5, 2.5]])
        yz_left = wall_surface([[0, 0], [0, 0]], [[0, 2.5], [0, 2.5]], [[-2.5, -2.5], [2.5, 2.5]])
        xz_front = wall_surface([[0, 20], [0, 20]], [[0, 2.5], [0, 2.5]], [[2.5, 2.5], [2.5, 2.5]])

        # --- All custom camera views as in your UI ---
        camera_views = {
            "Side View":      dict(eye=dict(x=9, y=1.2, z=6),   up=dict(x=0, y=1, z=0)),
            "Catcher View":   dict(eye=dict(x=18.4, y=1.4, z=0), up=dict(x=0, y=1, z=0)),
            "Pitcher View":   dict(eye=dict(x=-10, y=1.4, z=0), up=dict(x=0, y=1, z=0)),
            "Top View":       dict(eye=dict(x=9, y=12, z=0), up=dict(x=0, y=0, z=1)),
            "Diagonal View":  dict(eye=dict(x=15, y=4, z=4), up=dict(x=0, y=1, z=0)),
            "Umpire View":    dict(eye=dict(x=18.3, y=1.5, z=0.2), up=dict(x=0, y=1, z=0)),
            "Mobile Tilt":    dict(eye=dict(x=18, y=2, z=1.2), up=dict(x=0, y=1, z=0)),
        }

        buttons = [
            dict(label=name, method="relayout", args=[{"scene.camera": view}])
            for name, view in camera_views.items()
        ]

        layout = go.Layout(
            title=f"{handedness} Pitch Trajectory with Strike Zone",
            autosize=True,
            margin=dict(l=0, r=0, t=50, b=0),
            scene=dict(
                xaxis=dict(title='X (Distance to Catcher)', range=[0, 20], showgrid=False, zeroline=False, showbackground=False),
                yaxis=dict(title='Y (Height)', range=[0, 2.5], showgrid=False, zeroline=False, showbackground=False),
                zaxis=dict(title='Z (Horizontal Break)', range=[-2.5, 2.5], showgrid=False, zeroline=False, showbackground=False),
                aspectmode="manual",
                aspectratio=dict(x=5, y=2, z=2),
                camera=camera_views["Side View"]
            ),
            updatemenus=[
                dict(type="buttons", direction="right", x=0.1, y=1.2, buttons=buttons)
            ],
            paper_bgcolor="white",
            plot_bgcolor="white"
        )

        fig = go.Figure(
            data=[trace_traj] + strike_traces + [home_plate, xz_plane, yz_right, yz_left, xz_front],
            layout=layout
        )

        os.makedirs("static", exist_ok=True)
        file_path = os.path.join("static", "pitch_result.html")
        pio.write_html(fig, file_path, full_html=True)

        return file_path, {"y": round(fy, 2), "z": round(fz, 2)}

    except Exception as e:
        return None, {"error": str(e)}
