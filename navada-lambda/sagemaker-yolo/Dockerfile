FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libxcb1 libgl1 libglx-mesa0 curl && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir ultralytics flask gunicorn pillow numpy opencv-python-headless

RUN mkdir -p /opt/ml/code

COPY serve.py /opt/ml/code/serve.py

# Download YOLOv8n weights at build time (accessible to all users)
RUN curl -sL -o /opt/ml/code/yolov8n.pt https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt && \
    chmod 644 /opt/ml/code/yolov8n.pt

WORKDIR /opt/ml/code

ENV PYTHONUNBUFFERED=1
EXPOSE 8080

ENTRYPOINT ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "120", "--workers", "1", "serve:app"]
