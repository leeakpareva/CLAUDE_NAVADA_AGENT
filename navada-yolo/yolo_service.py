"""
NAVADA YOLO Service — Local Object Detection API
Runs on ASUS (dev workstation), accessible via Tailscale mesh.
Falls back to AWS SageMaker when ASUS is offline.

Endpoints:
  POST /detect       — Upload image, get annotated image + detections JSON
  POST /detect/json  — Upload image, get detections JSON only
  GET  /health       — Health check
  GET  /model        — Model info

Usage from Telegram: Send a photo → bot calls this API → returns annotated image
"""

import io
import os
import time
import base64
from pathlib import Path
from datetime import datetime

import uvicorn
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="NAVADA YOLO Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once at startup
MODEL_PATH = Path(__file__).parent / "yolov8n.pt"
model = YOLO(str(MODEL_PATH))

UPLOAD_DIR = Path(__file__).parent / "detections"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "navada-yolo",
        "node": "ASUS (NAVADA2025)",
        "model": "yolov8n",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/model")
async def model_info():
    return {
        "name": "YOLOv8n",
        "type": "Object Detection",
        "classes": len(model.names),
        "class_names": model.names,
        "device": "cpu",
        "node": "ASUS (NAVADA2025)"
    }


@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.0, le=1.0, description="Confidence threshold"),
    annotate: bool = Query(True, description="Return annotated image")
):
    """Run YOLOv8 detection on an uploaded image. Returns annotated image + JSON."""
    start = time.time()

    # Read image
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))

    # Run inference
    results = model(img, conf=conf, verbose=False)
    result = results[0]

    # Parse detections
    detections = []
    for box in result.boxes:
        detections.append({
            "class": model.names[int(box.cls[0])],
            "confidence": round(float(box.conf[0]), 3),
            "bbox": [round(float(x), 1) for x in box.xyxy[0].tolist()]
        })

    elapsed_ms = round((time.time() - start) * 1000, 1)

    if annotate:
        # Get annotated image
        annotated = result.plot()
        img_out = Image.fromarray(annotated)
        buf = io.BytesIO()
        img_out.save(buf, format="JPEG", quality=90)
        buf.seek(0)

        # Save a copy
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = UPLOAD_DIR / f"detect_{ts}.jpg"
        img_out.save(str(save_path))

        # Return as multipart: image first, JSON in header
        import json
        return StreamingResponse(
            buf,
            media_type="image/jpeg",
            headers={
                "X-Detections": json.dumps(detections),
                "X-Inference-Ms": str(elapsed_ms),
                "X-Object-Count": str(len(detections))
            }
        )
    else:
        return JSONResponse({
            "detections": detections,
            "count": len(detections),
            "inference_ms": elapsed_ms,
            "image_size": [img.width, img.height],
            "model": "yolov8n",
            "node": "ASUS"
        })


@app.post("/detect/json")
async def detect_json(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.0, le=1.0)
):
    """JSON-only detection results (no annotated image)."""
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    start = time.time()
    results = model(img, conf=conf, verbose=False)
    result = results[0]
    elapsed_ms = round((time.time() - start) * 1000, 1)

    detections = []
    for box in result.boxes:
        detections.append({
            "class": model.names[int(box.cls[0])],
            "confidence": round(float(box.conf[0]), 3),
            "bbox": [round(float(x), 1) for x in box.xyxy[0].tolist()]
        })

    # Summary by class
    summary = {}
    for d in detections:
        summary[d["class"]] = summary.get(d["class"], 0) + 1

    return {
        "detections": detections,
        "summary": summary,
        "count": len(detections),
        "inference_ms": elapsed_ms,
        "image_size": [img.width, img.height],
        "model": "yolov8n",
        "node": "ASUS"
    }


if __name__ == "__main__":
    port = int(os.environ.get("YOLO_PORT", 8765))
    print(f"NAVADA YOLO Service starting on 0.0.0.0:{port}")
    print(f"Health: http://localhost:{port}/health")
    print(f"Detect: POST http://localhost:{port}/detect")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
