"use client";
import React, { useState, useEffect } from "react";

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

  const [validation, setValidation] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [generalError, setGeneralError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }
  }, []);

  // Field validation helper
  const fieldValidate = (field, value) => {
    let err = "";
    if (field === "theta" || field === "phi") {
      const v = parseFloat(value);
      if (isNaN(v) || v < -90 || v > 90) {
        err = `${field.toUpperCase()} must be between -90° and 90°`;
      }
    }
    if (["releaseX", "releaseY", "releaseZ", "spinRate", "initialVelocity"].includes(field)) {
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

  const isValidForm = () => {
    for (const [field, err] of Object.entries(validation)) if (err) return false;
    for (const field of [
      "pitcher",
      "pitchType",
      "releaseX",
      "releaseY",
      "releaseZ",
      "spinRate",
      "initialVelocity",
      "theta",
      "phi",
    ])
      if (
        pitchData[field] === "" ||
        (["theta", "phi"].includes(field) && isNaN(Number(pitchData[field])))
      )
        return false;
    return true;
  };

  const handleSubmit = async () => {
    setGeneralError("");
    let localErr = {};
    for (const field in pitchData) localErr[field] = fieldValidate(field, pitchData[field]);
    setValidation(localErr);
    if (!isValidForm()) return;

    setLoading(true);
    setResult(null);

    // Convert velocity to m/s for backend
    const velocityInMs =
      pitchData.velocityUnit === "km/h"
        ? (parseFloat(pitchData.initialVelocity) / 3.6).toFixed(2)
        : (parseFloat(pitchData.initialVelocity) * 0.44704).toFixed(2);

    const payload = {
      handedness: String(pitchData.pitcher),
      initialVelocity: velocityInMs,
      spinRate: String(pitchData.spinRate),
      releasePosition: `${String(pitchData.releaseX)},${String(pitchData.releaseY)},${String(pitchData.releaseZ)}`,
      theta: String(pitchData.theta),
      phi: String(pitchData.phi),
    };

    try {
      const res = await fetch("https://rao-baseball-visualizer.onrender.com/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to fetch from backend.");
      const data = await res.json();

      // Backend response should have htmlFile, pngFile, finalPosition keys
      setResult(data);
      setHistory((h) => [{ ...payload, ...data, date: new Date() }, ...h]);
      setLoading(false);
    } catch (err) {
      setGeneralError("Error calling the simulation backend.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-2 md:p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full">
        <div className="p-4 flex flex-col space-y-4">
          <h2 className="text-xl font-bold text-center">Baseball Pitch Visualization</h2>
          <img
            src="/pitch-visual.png"
            alt="Pitch Trajectory"
            className="rounded mx-auto w-full md:w-3/4"
          />

          {/* ==== Form ==== */}
          <div className="flex flex-col space-y-3">
            <label>
              Pitcher
              <span title="Pitcher’s throwing hand: Left (LHP) or Right (RHP)." className="ml-1 text-blue-700 cursor-pointer">
                ⓘ
              </span>
            </label>
            <select
              className="rounded border px-2 py-1"
              value={pitchData.pitcher}
              onChange={(e) => handleChange("pitcher", e.target.value)}
            >
              <option value="LHP">LHP</option>
              <option value="RHP">RHP</option>
            </select>

            <label>
              Pitch Type
              <span title="Select Fastball, Slider or Curveball." className="ml-1 text-blue-700 cursor-pointer">ⓘ</span>
            </label>
            <select
              className="rounded border px-2 py-1"
              value={pitchData.pitchType}
              onChange={(e) => handleChange("pitchType", e.target.value)}
            >
              <option>Fastball</option>
              <option>Slider</option>
              <option>Curveball</option>
            </select>

            <label>
              Release Position (X, Y, Z)
              <span title="Release point in meters from mound center (X), height above ground (Y), side offset (Z)." className="ml-1 text-blue-700 cursor-pointer">ⓘ</span>
            </label>
            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
              <input
                className={
                  "rounded border px-2 py-1 w-full" + (validation.releaseX ? " border-red-500" : "")
                }
                value={pitchData.releaseX}
                onChange={(e) => handleChange("releaseX", e.target.value)}
                placeholder="X"
              />
              <input
                className={
                  "rounded border px-2 py-1 w-full" + (validation.releaseY ? " border-red-500" : "")
                }
                value={pitchData.releaseY}
                onChange={(e) => handleChange("releaseY", e.target.value)}
                placeholder="Y"
              />
              <input
                className={
                  "rounded border px-2 py-1 w-full" + (validation.releaseZ ? " border-red-500" : "")
                }
                value={pitchData.releaseZ}
                onChange={(e) => handleChange("releaseZ", e.target.value)}
                placeholder="Z"
              />
            </div>
            {["releaseX", "releaseY", "releaseZ"].map(
              (f) => validation[f] && <FormError key={f} msg={validation[f]} />
            )}

            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
              <div className="w-full">
                <label>
                  Spin Rate (rpm)
                  <span title="How fast the ball spins (revolutions per minute)." className="ml-1 text-blue-700 cursor-pointer">ⓘ</span>
                </label>
                <input
                  className={
                    "rounded border px-2 py-1 w-full" + (validation.spinRate ? " border-red-500" : "")
                  }
                  value={pitchData.spinRate}
                  onChange={(e) => handleChange("spinRate", e.target.value)}
                />
                {validation.spinRate && <FormError msg={validation.spinRate} />}
              </div>
              <div className="w-full">
                <label>
                  Initial Velocity
                  <span title="Pitch speed (km/h or mph)." className="ml-1 text-blue-700 cursor-pointer">
                    ⓘ
                  </span>
                </label>
                <input
                  className={
                    "rounded border px-2 py-1 w-full" + (validation.initialVelocity ? " border-red-500" : "")
                  }
                  value={pitchData.initialVelocity}
                  onChange={(e) => handleChange("initialVelocity", e.target.value)}
                />
                <select
                  className="rounded border px-2 py-1 mt-1"
                  value={pitchData.velocityUnit}
                  onChange={(e) => handleChange("velocityUnit", e.target.value)}
                >
                  <option value="km/h">km/h</option>
                  <option value="mph">mph</option>
                </select>
                {validation.initialVelocity && <FormError msg={validation.initialVelocity} />}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
              <div className="w-full">
                <label>
                  Theta (°)
                  <span title="Vertical launch angle: -90 (down) to 90 (up)." className="ml-1 text-blue-700 cursor-pointer">ⓘ</span>
                </label>
                <input
                  className={
                    "rounded border px-2 py-1 w-full" + (validation.theta ? " border-red-500" : "")
                  }
                  value={pitchData.theta}
                  onChange={(e) => handleChange("theta", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  θ (Theta): Vertical launch angle.
                  <br />
                  Range: -90° to 90°
                </p>
                {validation.theta && <FormError msg={validation.theta} />}
              </div>
              <div className="w-full">
                <label>
                  Phi (°)
                  <span title="Horizontal angle: -90 (left) to 90 (right)." className="ml-1 text-blue-700 cursor-pointer">ⓘ</span>
                </label>
                <input
                  className={
                    "rounded border px-2 py-1 w-full" + (validation.phi ? " border-red-500" : "")
                  }
                  value={pitchData.phi}
                  onChange={(e) => handleChange("phi", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ϕ (Phi): Lateral deviation angle.
                  <br />
                  Range: -90° to 90°
                </p>
                {validation.phi && <FormError msg={validation.phi} />}
              </div>
            </div>
          </div>

          {generalError && (
            <p className="text-red-500 text-sm">{generalError}</p>
          )}

          <button
            onClick={handleSubmit}
            className={`w-full mt-4 bg-blue-600 text-white py-2 rounded ${
              loading ? "opacity-60" : ""
            }`}
            disabled={loading || !isValidForm()}
          >
            {loading ? <span>⏳ Simulating...</span> : "Submit"}
          </button>

          {/* ==== Result display ==== */}
          {result && (
            <div className="mt-4 p-4 rounded bg-blue-50 border">
              <b>Pitch Result:</b>
              <br />
              Final Y: {result.finalPosition.y}
              <br />
              Final Z: {result.finalPosition.z}
              <br />
              {isMobile ? (
                <>
                  {result.pngFile ? (
                    <img
                      src={`https://rao-baseball-visualizer.onrender.com/${result.pngFile}`}
                      alt="2D Diagonal View"
                      className="w-full rounded my-2"
                    />
                  ) : (
                    <p className="text-sm italic text-gray-500">
                      Preview image not available
                    </p>
                  )}
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={() =>
                      window.open(
                        `https://rao-baseball-visualizer.onrender.com/${result.htmlFile}`,
                        "_blank"
                      )
                    }
                  >
                    View 3D (Advanced)
                  </button>
                </>
              ) : (
                <a
                  href={`https://rao-baseball-visualizer.onrender.com/${result.htmlFile}`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-700 underline"
                >
                  View 3D Simulation
                </a>
              )}
            </div>
          )}

          {/* ==== Pitch History ==== */}
          {history.length > 0 && (
            <div className="mt-6">
              <b>Pitch History</b>
              <ul className="mt-1">
                {history.slice(0, 5).map((h, i) => (
                  <li
                    key={i}
                    className="border-b text-xs py-1 flex flex-col md:flex-row md:items-center gap-1"
                  >
                    <span>
                      <b>{h.pitcher}</b>·{h.pitchType} · Speed:{" "}
                      {pitchData.velocityUnit === "km/h"
                        ? (parseFloat(h.initialVelocity) * 3.6).toFixed(1) + " km/h"
                        : (parseFloat(h.initialVelocity) / 0.44704).toFixed(1) + " mph"}
                      · Θ={h.theta}° Φ={h.phi}°
                      <br />
                      Result Y={h.finalPosition?.y}, Z={h.finalPosition?.z}
                    </span>
                    <a
                      href={`https://rao-baseball-visualizer.onrender.com/${h.htmlFile}`}
                      className="text-blue-600 ml-2"
                      target="_blank"
                      rel="noopener"
                    >
                      [Open]
                    </a>
                    <span className="ml-auto text-gray-400">
                      {h.date?.toLocaleString?.() || ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormError({ msg }) {
  return msg ? <div className="text-xs text-red-500">{msg}</div> : null;
}
