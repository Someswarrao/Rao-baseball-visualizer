"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function BaseballPitchApp() {
  const [pitchData, setPitchData] = useState({
    pitcher: "LHP",
    pitchType: "Slider",
    releaseX: "0",
    releaseY: "1.83",
    releaseZ: "0.40",
    spinRate: "2300",
    initialVelocity: "83",
    theta: "0",
    phi: "0",
  });

  const [angleError, setAngleError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setPitchData((prev) => ({ ...prev, [field]: value }));

    if ((field === "theta" || field === "phi") && (parseFloat(value) < -90 || parseFloat(value) > 90)) {
      setAngleError(`${field.toUpperCase()} must be between -90° and 90°`);
    } else {
      setAngleError("");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    const {
      releaseX, releaseY, releaseZ,
      spinRate, initialVelocity,
      theta, phi, pitcher, pitchType
    } = pitchData;

    const parsed = {
      x: parseFloat(releaseX),
      y: parseFloat(releaseY),
      z: parseFloat(releaseZ),
      spin_rate: parseFloat(spinRate),
      speed: parseFloat(initialVelocity),
      theta: parseFloat(theta),
      phi: parseFloat(phi),
    };

    // Validate numbers
    if (Object.values(parsed).some(val => isNaN(val))) {
      setAngleError("All input fields must contain valid numbers.");
      setLoading(false);
      return;
    }

    // Validate angles
    if (parsed.theta < -90 || parsed.theta > 90 || parsed.phi < -90 || parsed.phi > 90) {
      setAngleError("Angles must be between -90° and 90°.");
      setLoading(false);
      return;
    }

    // Optional: Velocity and spin sanity checks
    if (parsed.speed < 50 || parsed.speed > 110) {
      alert("⚠️ Initial velocity seems unrealistic (recommended: 50–110 m/s).");
    }
    if (parsed.spin_rate < 1000 || parsed.spin_rate > 3500) {
      alert("⚠️ Spin rate seems unrealistic (recommended: 1000–3500 rpm).");
    }

    const payload = {
      pitcher_hand: pitcher,
      pitch_type: pitchType,
      ...parsed,
    };

    try {
      const res = await fetch("https://rao-baseball-visualizer.onrender.com/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to fetch from backend.");

      const result = await res.json();
      const filePath = result.file_path;

      if (!filePath) {
        alert("⚠ Backend returned invalid or incomplete data.");
        console.error("❌ Incomplete backend response:", result);
        return;
      }

      const fullUrl = `https://rao-baseball-visualizer.onrender.com${filePath}`;
      if (window.confirm("✅ Pitch simulation complete!\n\nClick OK to view the 3D pitch.")) {
        window.open(fullUrl, "_blank");
      }
    } catch (err) {
      console.error("❌ Backend error:", err);
      alert("⚠ Error calling the simulation backend. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-center">Baseball Pitch Visualization</h2>
          <img src="/pitch-visual.png" alt="Pitch Trajectory" className="rounded" />

          <div className="space-y-2">
            <label>Pitcher</label>
            <Select value={pitchData.pitcher} onValueChange={(val) => handleChange("pitcher", val)}>
              <SelectTrigger suppressHydrationWarning>{pitchData.pitcher}</SelectTrigger>
              <SelectContent>
                <SelectItem value="LHP">LHP</SelectItem>
                <SelectItem value="RHP">RHP</SelectItem>
              </SelectContent>
            </Select>

            <label>Pitch Type</label>
            <Select value={pitchData.pitchType} onValueChange={(val) => handleChange("pitchType", val)}>
              <SelectTrigger suppressHydrationWarning>{pitchData.pitchType}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Fastball">Fastball</SelectItem>
                <SelectItem value="Slider">Slider</SelectItem>
                <SelectItem value="Curveball">Curveball</SelectItem>
              </SelectContent>
            </Select>

            <label>Release Position (X, Y, Z)</label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="X (m)" value={pitchData.releaseX} onChange={(e) => handleChange("releaseX", e.target.value)} />
              <Input placeholder="Y (m)" value={pitchData.releaseY} onChange={(e) => handleChange("releaseY", e.target.value)} />
              <Input placeholder="Z (m)" value={pitchData.releaseZ} onChange={(e) => handleChange("releaseZ", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Spin Rate (rpm)</label>
                <Input value={pitchData.spinRate} onChange={(e) => handleChange("spinRate", e.target.value)} />
              </div>
              <div>
                <label>Initial Velocity (m/s)</label>
                <Input value={pitchData.initialVelocity} onChange={(e) => handleChange("initialVelocity", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Theta (°)</label>
                <Input value={pitchData.theta} onChange={(e) => handleChange("theta", e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">Vertical launch angle.</p>
              </div>
              <div>
                <label>Phi (°)</label>
                <Input value={pitchData.phi} onChange={(e) => handleChange("phi", e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">Lateral deviation angle.</p>
              </div>
            </div>

            {angleError && (
              <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
                {angleError}
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
              {loading ? "Simulating..." : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
