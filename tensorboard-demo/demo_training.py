"""
TensorBoard Demo — Simulates a real ML training run
=====================================================
This script creates fake but realistic training logs so you can
explore every TensorBoard tab without needing a GPU or real dataset.
"""

import os
import math
import random
import numpy as np
from torch.utils.tensorboard import SummaryWriter

LOG_DIR = os.path.join(os.path.dirname(__file__), "runs")

# ── 1. SCALARS — the bread and butter ──────────────────────────────
# Two experiments so you can compare them side-by-side
for experiment, lr in [("adam_lr0.001", 0.001), ("sgd_lr0.01", 0.01)]:
    writer = SummaryWriter(log_dir=os.path.join(LOG_DIR, experiment))

    train_loss = 2.5
    val_loss = 2.8
    accuracy = 0.10

    for epoch in range(1, 101):
        # Simulate decreasing loss with noise
        noise = random.gauss(0, 0.05)
        decay = math.exp(-lr * epoch * 0.5)

        train_loss = 2.5 * decay + noise
        val_loss = 2.8 * decay + noise * 1.3 + (0.1 if epoch > 70 and lr == 0.01 else 0)
        accuracy = min(0.98, 1.0 - decay + random.gauss(0, 0.01))

        # Log scalars — these appear in the SCALARS tab
        writer.add_scalar("Loss/train", max(0, train_loss), epoch)
        writer.add_scalar("Loss/validation", max(0, val_loss), epoch)
        writer.add_scalar("Metrics/accuracy", accuracy, epoch)
        writer.add_scalar("Metrics/learning_rate", lr, epoch)

    # ── 2. HISTOGRAMS — weight distributions over time ──────────
    for epoch in range(1, 101):
        # Simulate weights shrinking as training progresses
        weights = np.random.randn(1000) * (1.0 / (1 + epoch * 0.05))
        biases = np.random.randn(100) * 0.1 + 0.01 * epoch
        gradients = np.random.randn(1000) * (0.5 / (1 + epoch * 0.1))

        writer.add_histogram("Weights/layer1", weights, epoch)
        writer.add_histogram("Biases/layer1", biases, epoch)
        writer.add_histogram("Gradients/layer1", gradients, epoch)

    # ── 3. IMAGES — visualise inputs, outputs, attention maps ───
    # Create a fake 8x8 grid of "images"
    for step in range(5):
        fake_images = np.random.rand(16, 3, 32, 32).astype(np.float32)
        writer.add_images("Samples/input_batch", fake_images, step)

    # ── 4. TEXT — log predictions, prompts, samples ─────────────
    sample_texts = [
        "Epoch 1: Model predicts 'cat' for a dog image (confidence: 0.3)",
        "Epoch 25: Model predicts 'dog' correctly (confidence: 0.7)",
        "Epoch 50: Model predicts 'dog' correctly (confidence: 0.92)",
        "Epoch 75: Model predicts 'dog' correctly (confidence: 0.97)",
        "Epoch 100: Model predicts 'dog' correctly (confidence: 0.99)",
    ]
    for i, text in enumerate(sample_texts):
        writer.add_text("Predictions/sample", text, i * 25)

    # ── 5. HYPERPARAMETERS — compare experiments ────────────────
    writer.add_hparams(
        {"optimizer": experiment.split("_")[0], "lr": lr, "batch_size": 32},
        {"hparam/final_accuracy": accuracy, "hparam/final_loss": max(0, train_loss)},
    )

    # ── 6. EMBEDDINGS — visualise high-dim data in 2D/3D ───────
    # 200 points in 50-dimensional space with labels
    embeddings = np.random.randn(200, 50).astype(np.float32)
    labels = [f"class_{i % 10}" for i in range(200)]
    writer.add_embedding(
        embeddings,
        metadata=labels,
        tag=f"Embeddings/{experiment}",
        global_step=100,
    )

    writer.close()
    print(f"[OK] Logged experiment: {experiment}")

# ── 7. PR CURVES — precision/recall for classification ──────────
writer = SummaryWriter(log_dir=os.path.join(LOG_DIR, "pr_curves"))
for step in range(5):
    labels = np.random.randint(0, 2, size=100)
    # Predictions improve over time
    noise = 1.0 - step * 0.2
    predictions = labels.astype(float) + np.random.randn(100) * noise
    predictions = 1 / (1 + np.exp(-predictions))  # sigmoid
    writer.add_pr_curve("PR/binary_classifier", labels, predictions, step)
writer.close()
print("[OK] Logged PR curves")

print(f"\nAll logs written to: {LOG_DIR}")
print("Ready for TensorBoard!")
