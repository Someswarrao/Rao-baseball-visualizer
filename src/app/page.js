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
    velocityUnit: "km/h",
    theta: "0",
    phi: "0",
  });

  const [angleError, setAngleError] = useState("");

  const handleChange = (field, value) => {
    setPitchData({ ...pitchData, [field]: value });

    if (
      (field === "theta" || field === "phi") &&
      (parseFloat(value) < -90 || parseFloat(value) > 90)
    ) {
      setAngleError(`${field.toUpperCase()} must be between -90° and 90°`);
    } else {
      setAngleError("");
    }
  };

  const handleSubmit = async () => {
    const { theta, phi, initialVelocity, velocityUnit } = pitchData;

    if (
      parseFloat(theta) < -90 ||
      parseFloat(theta) > 90 ||
      parseFloat(phi) < -90 ||
      parseFloat(phi) > 90
    ) {
      setAngleError("Angles must be between -90° and 90°");
      return;
    }

    // Convert velocity to m/s if needed
    const velocityInMs =
      velocityUnit === "km/h"
        ? (parseFloat(initialVelocity) / 3.6).toFixed(2)
        : (parseFloat(initialVelocity) * 0.44704).toFixed(2);

    const payload = {
      handedness: String(pitchData.pitcher),
      initialVelocity: velocityInMs,
      spinRate: String(pitchData.spinRate),
      releasePosition: `${String(pitchData.releaseX)},${String(pitchData.releaseY)},${String(pitchData.releaseZ)}`,
      theta: String(pitchData.theta),
      phi: String(pitchData.phi),
    };

    try {
      const res = await fetch(
        "https://rao-baseball-visualizer.onrender.com/simulate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch from backend.");
      }

      const result = await res.json();
      console.log("✅ Backend response:", result);

      alert(
        `✅ Pitch simulation complete!\n📍 Final Y: ${result.finalPosition.y}\n📍 Final Z: ${result.finalPosition.z}\n🧾 File: ${result.htmlFile}`
      );

      window.open(
        `https://rao-baseball-visualizer.onrender.com/${result.htmlFile}`,
        "_blank"
      );
    } catch (err) {
      console.error("❌ Backend error:", err);
      alert("⚠️ Error calling the simulation backend. Check console.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-center">
            Baseball Pitch Visualization
          </h2>
          <img
            src="/pitch-visual.png"
            alt="Pitch Trajectory"
            className="rounded"
          />

          <div className="space-y-2">
            <label>Pitcher</label>
            <Select
              value={pitchData.pitcher}
              onValueChange={(val) => handleChange("pitcher", val)}
            >
              <SelectTrigger suppressHydrationWarning>
                {pitchData.pitcher}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LHP">LHP</SelectItem>
                <SelectItem value="RHP">RHP</SelectItem>
              </SelectContent>
            </Select>

            <label>Pitch Type</label>
            <Select
              value={pitchData.pitchType}
              onValueChange={(val) => handleChange("pitchType", val)}
            >
              <SelectTrigger suppressHydrationWarning>
                {pitchData.pitchType}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fastball">Fastball</SelectItem>
                <SelectItem value="Slider">Slider</SelectItem>
                <SelectItem value="Curveball">Curveball</SelectItem>
              </SelectContent>
            </Select>

            <label>Release Position (X, Y, Z)</label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={pitchData.releaseX}
                onChange={(e) => handleChange("releaseX", e.target.value)}
                placeholder="X"
              />
              <Input
                value={pitchData.releaseY}
                onChange={(e) => handleChange("releaseY", e.target.value)}
                placeholder="Y"
              />
              <Input
                value={pitchData.releaseZ}
                onChange={(e) => handleChange("releaseZ", e.target.value)}
                placeholder="Z"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Spin Rate (rpm)</label>
                <Input
                  value={pitchData.spinRate}
                  onChange={(e) => handleChange("spinRate", e.target.value)}
                />
              </div>
              <div>
                <label>Initial Velocity</label>
                <Input
                  value={pitchData.initialVelocity}
                  onChange={(e) =>
                    handleChange("initialVelocity", e.target.value)
                  }
                />
                <Select
                  value={pitchData.velocityUnit}
                  onValueChange={(val) => handleChange("velocityUnit", val)}
                >
                  <SelectTrigger className="mt-1">
                    {pitchData.velocityUnit}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km/h">km/h</SelectItem>
                    <SelectItem value="mph">mph</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Theta (°)</label>
                <Input
                  value={pitchData.theta}
                  onChange={(e) => handleChange("theta", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  θ (Theta): Vertical launch angle.
                  <br />
                  Range: -90° to 90°
                </p>
              </div>
              <div>
                <label>Phi (°)</label>
                <Input
                  value={pitchData.phi}
                  onChange={(e) => handleChange("phi", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ϕ (Phi): Lateral deviation angle.
                  <br />
                  Range: -90° to 90°
                </p>
              </div>
            </div>

            {angleError && (
              <p className="text-red-500 text-sm">{angleError}</p>
            )}

            <Button onClick={handleSubmit} className="w-full mt-4">
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
