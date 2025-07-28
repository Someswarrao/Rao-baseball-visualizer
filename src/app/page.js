"use client";
import React, { useState } from "react";
import {
  Card, CardContent,
  Button, Input, Tooltip, Spinner
} from "@/components/ui"; // Imaginary wrappers (replace with your actual ones)
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Helper for tooltips — adapt to your UI lib
const Info = ({ tip }) => (
  <Tooltip>
    <span className="ml-2 text-blue-500 cursor-pointer" tabIndex={0}>ⓘ
      <span className="tooltip-text">{tip}</span>
    </span>
  </Tooltip>
);

export default function BaseballPitchApp() {
  const [pitchData, setPitchData] = useState({
    pitcher: "LHP", pitchType: "Slider",
    releaseX: "0", releaseY: "1.83", releaseZ: "0.40",
    spinRate: "2300", initialVelocity: "83", velocityUnit: "km/h",
    theta: "0", phi: "0",
  });
  const [angleError, setAngleError] = useState("");
  const [validation, setValidation] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Responsive: Use flex-col on small screens
  const inputClass =
    "rounded border px-2 py-1 w-full" +
    (angleError ? " border-red-500" : "");

  const fieldValidate = (field, value) => {
    let err = "";
    if (field === "theta" || field === "phi") {
      const v = parseFloat(value);
      if (isNaN(v) || v < -90 || v > 90) {
        err = `${field.toUpperCase()} must be between -90° and 90°`;
      }
    }
    if (
      ["releaseX", "releaseY", "releaseZ", "spinRate", "initialVelocity"].includes(field)
    ) {
      if (value === "" || isNaN(Number(value))) {
        err = `${field} must be a number`;
      }
    }
    setValidation((prev) => ({ ...prev, [field]: err }));
    return err;
  };

  const handleChange = (field, value) => {
    setPitchData({ ...pitchData, [field]: value });
    fieldValidate(field, value);
  };

  // Helper
  const isValidForm = () => {
    for (const [field, err] of Object.entries(validation)) if (err) return false;
    for (const field of [
        "pitcher", "pitchType", "releaseX", "releaseY", "releaseZ",
        "spinRate", "initialVelocity", "theta", "phi"
      ]) {
      if (pitchData[field] === "" || (["theta", "phi"].includes(field) && isNaN(Number(pitchData[field]))))
        return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // Validate all on submit
    let localErr = {};
    for (const field in pitchData) localErr[field] = fieldValidate(field, pitchData[field]);
    setValidation(localErr);
    if (!isValidForm()) return;

    setLoading(true);
    setResult(null);

    // Convert velocity to m/s
    const velocityInMs =
      pitchData.velocityUnit === "km/h"
        ? (parseFloat(pitchData.initialVelocity) / 3.6).toFixed(2)
        : (parseFloat(pitchData.initialVelocity) * 0.44704).toFixed(2);

    const payload = {
      handedness: String(pitchData.pitcher),
      initialVelocity: velocityInMs,
      spinRate: String(pitchData.spinRate),
      releasePosition:
        `${String(pitchData.releaseX)},${String(pitchData.releaseY)},${String(pitchData.releaseZ)}`,
      theta: String(pitchData.theta),
      phi: String(pitchData.phi),
    };

    try {
      const res = await fetch(
        "https://rao-baseball-visualizer.onrender.com/simulate",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      if (!res.ok) throw new Error("Failed to fetch from backend.");
      const data = await res.json();
      setResult(data);
      // Add to history
      setHistory((h) => [{ ...payload, ...data, date: new Date() }, ...h]);
      setLoading(false);
    } catch (err) {
      setAngleError("Error calling the simulation backend.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-2 md:p-4">
      <Card className="rounded-2xl shadow-lg w-full">
        <CardContent className="flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-center">
            Baseball Pitch Visualization
          </h2>
          <img src="/pitch-visual.png" alt="Pitch Trajectory" className="rounded mx-auto w-full md:w-3/4" />
          {/* Pitch Form */}
          <div className="flex flex-col space-y-3">
            <label>
              Pitcher
              <Info tip="Pitcher’s throwing hand: Left (LHP) or Right (RHP)." />
            </label>
            <Select
              value={pitchData.pitcher}
              onValueChange={(val) => handleChange("pitcher", val)}
            >
              <SelectTrigger>{pitchData.pitcher}</SelectTrigger>
              <SelectContent>
                <SelectItem value="LHP">LHP</SelectItem>
                <SelectItem value="RHP">RHP</SelectItem>
              </SelectContent>
            </Select>

            <label>
              Pitch Type
              <Info tip="Select Fastball, Slider or Curveball." />
            </label>
            <Select
              value={pitchData.pitchType}
              onValueChange={(val) => handleChange("pitchType", val)}
            >
              <SelectTrigger>{pitchData.pitchType}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Fastball">Fastball</SelectItem>
                <SelectItem value="Slider">Slider</SelectItem>
                <SelectItem value="Curveball">Curveball</SelectItem>
              </SelectContent>
            </Select>

            <label>
              Release Position (X, Y, Z)
              <Info tip="Release point in meters from mound center (X), height above ground (Y), side offset (Z)." />
            </label>
            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
              <Input
                className={validation.releaseX ? "border-red-500" : ""}
                value={pitchData.releaseX}
                onChange={e => handleChange("releaseX", e.target.value)}
                placeholder="X"
              />
              <Input
                className={validation.releaseY ? "border-red-500" : ""}
                value={pitchData.releaseY}
                onChange={e => handleChange("releaseY", e.target.value)}
                placeholder="Y"
              />
              <Input
                className={validation.releaseZ ? "border-red-500" : ""}
                value={pitchData.releaseZ}
                onChange={e => handleChange("releaseZ", e.target.value)}
                placeholder="Z"
              />
            </div>
            <FormError msg={validation.releaseX || validation.releaseY || validation.releaseZ} />

            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
              <div className="w-full">
                <label>
                  Spin Rate (rpm)
                  <Info tip="How fast the ball spins (revolutions per minute)." />
                </label>
                <Input
                  className={validation.spinRate ? "border-red-500" : ""}
                  value={pitchData.spinRate}
                  onChange={e => handleChange("spinRate", e.target.value)}
                />
                <FormError msg={validation.spinRate} />
              </div>
              <div className="w-full">
                <label>
                  Initial Velocity
                  <Info tip="Pitch speed (km/h or mph). Change unit as needed." />
                </label>
                <Input
                  className={validation.initialVelocity ? "border-red-500" : ""}
                  value={pitchData.initialVelocity}
                  onChange={e =>
                    handleChange("initialVelocity", e.target.value)
                  }
                />
                <Select
                  value={pitchData.velocityUnit}
                  onValueChange={(val) => handleChange("velocityUnit", val)}
                >
                  <SelectTrigger>{pitchData.velocityUnit}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km/h">km/h</SelectItem>
                    <SelectItem value="mph">mph</SelectItem>
                  </SelectContent>
                </Select>
                <FormError msg={validation.initialVelocity} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
              <div className="w-full">
                <label>
                  Theta (°)
                  <Info tip="Vertical launch angle: -90 (down) to 90 (up)." />
                </label>
                <Input
                  className={validation.theta ? "border-red-500" : ""}
                  value={pitchData.theta}
                  onChange={e => handleChange("theta", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  θ (Theta): Vertical launch angle.<br />
                  Range: -90° to 90°
                </p>
                <FormError msg={validation.theta} />
              </div>
              <div className="w-full">
                <label>
                  Phi (°)
                  <Info tip="Horizontal angle: -90 (left) to 90 (right)." />
                </label>
                <Input
                  className={validation.phi ? "border-red-500" : ""}
                  value={pitchData.phi}
                  onChange={e => handleChange("phi", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ϕ (Phi): Lateral deviation angle.<br />
                  Range: -90° to 90°
                </p>
                <FormError msg={validation.phi} />
              </div>
            </div>

            {/* Loading state or submit button */}
            {angleError && <p className="text-red-500 text-sm">{angleError}</p>}
            <Button
              onClick={handleSubmit}
              className={`w-full mt-4 ${loading ? "opacity-60" : ""}`}
              disabled={loading || !isValidForm()}
            >
              {loading ? (<>
                  <Spinner className="mr-2" size={18} /> Simulating...
                </>) : "Submit"}
            </Button>

            {/* Result display: show result below form */}
            {result && (
              <div className="mt-4 p-4 rounded bg-blue-50 border">
                <b>Pitch Result:</b><br />
                Final Y: {result.finalPosition.y}<br />
                Final Z: {result.finalPosition.z}<br />
                <a
                  href={`https://rao-baseball-visualizer.onrender.com/${result.htmlFile}`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-700 underline"
                >View 3D Simulation</a>
              </div>
            )}

            {/* Pitch history */}
            {history.length > 0 && (
              <div className="mt-6">
                <b>Pitch History</b>
                <ul className="mt-1">
                  {history.slice(0, 5).map((h, i) => (
                    <li key={i} className="border-b text-xs py-1 flex flex-col md:flex-row md:items-center gap-1">
                      <span>
                        <b>{h.pitcher}</b>·{h.pitchType}&nbsp;
                        Speed: {pitchData.velocityUnit === "km/h"
                          ? (parseFloat(h.initialVelocity) * 3.6).toFixed(1) + " km/h"
                          : (parseFloat(h.initialVelocity) / 0.44704).toFixed(1) + " mph"}
                        · Θ={h.theta}° Φ={h.phi}°
                        <br />
                        Result Y={h.finalPosition && h.finalPosition.y}, Z={h.finalPosition && h.finalPosition.z}
                      </span>
                      <a href={`https://rao-baseball-visualizer.onrender.com/${h.htmlFile}`}
                         className="text-blue-600 ml-2" target="_blank" rel="noopener">
                        [Open]
                      </a>
                      <span className="ml-auto text-gray-400">{h.date?.toLocaleString?.() || ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Short helper for inline error display (can style as needed)
function FormError({ msg }) {
  return msg ? (<div className="text-xs text-red-500">{msg}</div>) : null;
}
