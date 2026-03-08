"""YOLOv8n SageMaker inference server."""
import base64
import io
import json
import os

from flask import Flask, request, jsonify
from PIL import Image
from ultralytics import YOLO

app = Flask(__name__)
model = YOLO("/opt/ml/code/yolov8n.pt")


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify(status="healthy"), 200


@app.route("/invocations", methods=["POST"])
def invoke():
    content_type = request.content_type or ""

    if "application/json" in content_type:
        data = request.get_json(force=True)
        image_b64 = data.get("imageBase64", "")
        conf_threshold = data.get("confidence", 0.25)
        max_detections = data.get("maxDetections", 50)
        img = Image.open(io.BytesIO(base64.b64decode(image_b64)))
    elif "image/" in content_type:
        img = Image.open(io.BytesIO(request.data))
        conf_threshold = 0.25
        max_detections = 50
    else:
        return jsonify(error="Unsupported content type"), 415

    results = model.predict(img, conf=conf_threshold, max_det=max_detections, verbose=False)
    result = results[0]

    detections = []
    for box in result.boxes:
        cls_id = int(box.cls[0])
        detections.append({
            "class": result.names[cls_id],
            "classId": cls_id,
            "confidence": round(float(box.conf[0]), 3),
            "bbox": {
                "x1": round(float(box.xyxy[0][0]), 1),
                "y1": round(float(box.xyxy[0][1]), 1),
                "x2": round(float(box.xyxy[0][2]), 1),
                "y2": round(float(box.xyxy[0][3]), 1),
            },
        })

    return jsonify({
        "model": "yolov8n",
        "imageSize": {"width": result.orig_shape[1], "height": result.orig_shape[0]},
        "detectionCount": len(detections),
        "detections": detections,
    })
