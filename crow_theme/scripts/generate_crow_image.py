"""
Crow Theme — DALL-E Image Generator

Generates monochrome, high-contrast images that conform to the Crow Theme
design system. Every image is strictly grayscale with near-black backgrounds
and dramatic studio lighting.

Usage:
    python generate_crow_image.py "a gaming laptop" --use-case product --size 1792x1024 --output hero.png
    python generate_crow_image.py "circuit board patterns" --use-case abstract
    python generate_crow_image.py "a CEO in a dark office" --use-case portrait

Requires:
    pip install openai Pillow requests
    OPENAI_API_KEY environment variable set
"""

import argparse
import os
import sys
import requests
from pathlib import Path

try:
    import openai
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

try:
    from PIL import Image, ImageStat
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# ─── Crow Theme Style Directives ────────────────────────────────────────────

BASE_STYLE = (
    "Pure monochrome black and white, high contrast, near-black background (#050505), "
    "dramatic studio lighting with sharp directional light from the upper-left. "
    "Ultra-clean minimal composition. No color whatsoever — strictly grayscale. "
    "Brutalist editorial aesthetic. Sharp focus, generous negative space. "
    "Professional, precise, restrained."
)

USE_CASE_PROMPTS = {
    "product": (
        "{subject}. {base} "
        "Studio product photography. Object fills 60% of frame. "
        "Single key light creating dramatic edge highlights. "
        "No reflections on background surface."
    ),
    "abstract": (
        "Abstract representation of {subject}. {base} "
        "Subtle texture emerging from near-black tones. "
        "Almost invisible detail — could be mistaken for solid dark surface at first glance. "
        "Suitable as a dark background with very subtle visual interest."
    ),
    "portrait": (
        "{subject}. {base} "
        "Rembrandt-style lighting with single key light. Deep shadows. "
        "Only face and key details illuminated. "
        "Editorial fashion photography aesthetic. Confident, composed expression."
    ),
    "architecture": (
        "{subject}. {base} "
        "Stark geometric forms, brutalist or minimalist architecture. "
        "Near-black atmosphere with selective highlights on structural edges. "
        "Architectural photography monograph quality."
    ),
    "tech": (
        "{subject}. {base} "
        "Faint grayscale glow from screens or interfaces. "
        "No coloured LEDs or indicators — everything grayscale. "
        "Clean technical aesthetic, precise studio shot."
    ),
    "vehicle": (
        "{subject}. {base} "
        "Three-quarter front angle, low camera position. "
        "Single dramatic sidelight revealing contours and surface details. "
        "Automotive photography style, showroom darkness."
    ),
    "ui": (
        "A UI mockup showing {subject}. {base} "
        "Dark interface on near-black background. All text in grayscale. "
        "Clean grid layout, minimal elements, monospace and serif typography. "
        "No color accents — brightness hierarchy only."
    ),
}


def generate_image(
    subject: str,
    use_case: str = "product",
    size: str = "1792x1024",
    output_path: str = None,
    quality: str = "hd",
) -> str:
    """Generate a Crow Theme image using DALL-E 3.

    Args:
        subject: What to depict
        use_case: One of: product, abstract, portrait, architecture, tech, vehicle, ui
        size: DALL-E 3 sizes — 1024x1024, 1792x1024, 1024x1792
        output_path: Where to save (optional, prints URL if not given)
        quality: "hd" or "standard"

    Returns:
        URL of generated image, or local path if output_path provided
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    client = openai.OpenAI(api_key=api_key)

    template = USE_CASE_PROMPTS.get(use_case, USE_CASE_PROMPTS["product"])
    prompt = template.format(subject=subject, base=BASE_STYLE)

    print(f"Generating Crow Theme image...")
    print(f"  Subject:  {subject}")
    print(f"  Use case: {use_case}")
    print(f"  Size:     {size}")
    print()

    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size=size,
        quality=quality,
        style="natural",
    )

    image_url = response.data[0].url
    revised_prompt = response.data[0].revised_prompt

    print(f"Generated successfully.")
    print(f"  Revised prompt: {revised_prompt[:120]}...")
    print()

    if output_path:
        # Download and save
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "wb") as f:
            f.write(img_response.content)

        print(f"  Saved to: {output_path}")

        # Verify grayscale if PIL is available
        if HAS_PIL:
            verify_monochrome(output_path)

        return output_path

    return image_url


def verify_monochrome(image_path: str) -> bool:
    """Check if an image is truly monochrome (grayscale).

    If it has colour, prints a warning. DALL-E occasionally adds subtle
    colour despite instructions — this catches it.
    """
    if not HAS_PIL:
        return True

    img = Image.open(image_path)
    if img.mode == "L":
        print("  ✓ Image is grayscale")
        return True

    if img.mode == "RGBA":
        img = img.convert("RGB")

    r, g, b = img.split()
    r_stat = ImageStat.Stat(r)
    g_stat = ImageStat.Stat(g)
    b_stat = ImageStat.Stat(b)

    # Check if channels are nearly identical (grayscale)
    r_mean, g_mean, b_mean = r_stat.mean[0], g_stat.mean[0], b_stat.mean[0]
    max_diff = max(abs(r_mean - g_mean), abs(r_mean - b_mean), abs(g_mean - b_mean))

    if max_diff < 5:
        print("  ✓ Image is effectively monochrome (channel variance < 5)")
        return True
    else:
        print(f"  ⚠ WARNING: Image has colour! Channel means: R={r_mean:.1f} G={g_mean:.1f} B={b_mean:.1f}")
        print(f"    Max channel difference: {max_diff:.1f}")
        print(f"    Consider desaturating before use.")
        return False


def desaturate(input_path: str, output_path: str = None) -> str:
    """Force-convert an image to grayscale.

    Use this if DALL-E returns an image with subtle colour despite
    the monochrome instructions.
    """
    if not HAS_PIL:
        raise ImportError("Pillow required for desaturation: pip install Pillow")

    if output_path is None:
        p = Path(input_path)
        output_path = str(p.parent / f"{p.stem}_mono{p.suffix}")

    img = Image.open(input_path)
    mono = img.convert("L").convert("RGB")
    mono.save(output_path)
    print(f"  Desaturated: {output_path}")
    return output_path


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate Crow Theme images via DALL-E 3",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "a sports car" --use-case vehicle --output car_hero.png
  %(prog)s "neural network visualization" --use-case abstract
  %(prog)s "a modern office workspace" --use-case architecture --size 1024x1024
  %(prog)s "a woman in a tailored suit" --use-case portrait --output ceo.png
        """,
    )
    parser.add_argument("subject", help="What to depict in the image")
    parser.add_argument(
        "--use-case",
        choices=list(USE_CASE_PROMPTS.keys()),
        default="product",
        help="Image category (default: product)",
    )
    parser.add_argument(
        "--size",
        choices=["1024x1024", "1792x1024", "1024x1792"],
        default="1792x1024",
        help="Image dimensions (default: 1792x1024)",
    )
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--quality", choices=["hd", "standard"], default="hd")

    args = parser.parse_args()
    result = generate_image(
        subject=args.subject,
        use_case=args.use_case,
        size=args.size,
        output_path=args.output,
        quality=args.quality,
    )

    if not args.output:
        print(f"  Image URL: {result}")


if __name__ == "__main__":
    main()
