"""
Generate 5 Evolution Stage mascot images using ComfyUI Flux Schnell GGUF.
Style: Same cute round glowing energy spirit "기운이" but at different growth stages.
Output: aura-spoon/public/evolution/lv0.png ~ lv4.png (512x512px, transparent BG)
"""

import urllib.request
import json
import time
import os
import shutil
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = Path(r"C:\Users\USER-PC\Desktop\appintoss-project\aura-spoon\public\evolution")
COMFYUI_OUTPUT = Path(r"C:\Users\USER-PC\Downloads\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\ComfyUI\output")

WIDTH = 512
HEIGHT = 512
STEPS = 4

# Base style (matches existing aura spirit art style)
BASE = (
    "A cute chibi energy spirit mascot character with big sparkly eyes, round body, soft glow, kawaii style, "
    "digital illustration, soft lighting, pastel colors, clean white background, centered composition, high quality"
)

# 5 evolution stages — energy condensation + form evolution (D-plan)
# Color: purple-lavender (#7B61FF) consistent across all stages
# Concept: energy gathers → body forms → limbs grow → light ribbons become wings → full radiance
EVOLUTION_DATA = {
    0: {
        "name": "씨앗 (Lv.0)",
        "seed": 99200,
        "clip_l": (
            "a very tiny cute round glowing spirit, very small, simple dot eyes, no mouth, "
            "round pale lavender translucent body, very faint, semi-transparent, misty edges, "
            "no arms no legs, much smaller than normal, soft purple glow, white background"
        ),
        "t5xxl": (
            "A very tiny and very small cute round luminous spirit, much smaller than normal size, "
            "round pale lavender translucent semi-transparent body with misty dissolving edges, "
            "only two simple tiny dot eyes barely visible, no mouth, no expression, no arms, no legs, "
            "the body is very faint and semi-transparent like a soap bubble, "
            "barely formed, looks fragile and newborn, "
            "very subtle soft lavender glow around it, "
            "kawaii style, pastel lavender, clean white background, centered, digital art, 512x512"
        ),
    },
    1: {
        "name": "새싹 (Lv.1)",
        "seed": 99101,
        "clip_l": (
            "a small cute round glowing spirit, big sparkly purple eyes, tiny smile, "
            "round lavender translucent body, pink blush cheeks, no arms no legs, "
            "soft purple glow, kawaii baby spirit, white background"
        ),
        "t5xxl": (
            "A small cute round luminous spirit creature, big sparkling purple eyes "
            "and a tiny cute smile just appeared on its round translucent lavender-purple glowing body, "
            "soft pink blush on both cheeks, no arms and no legs, just a round floating orb with a face, "
            "gentle soft purple aura glow around it, looking curious and innocent, "
            "kawaii baby spirit, pastel purple-lavender tones, "
            "clean white background, centered, digital art, 512x512"
        ),
    },
    2: {
        "name": "성장 (Lv.2)",
        "seed": 99102,
        "clip_l": (
            "a cute round glowing lavender spirit, big sparkly purple eyes, happy smile, "
            "round purple body with short stubby arms, thin purple light ribbon trails flowing from head, "
            "soft purple aura, kawaii spirit, white background"
        ),
        "t5xxl": (
            "A cute round luminous spirit creature with big sparkling confident purple eyes "
            "and a cheerful happy smile, round translucent lavender-purple glowing body, "
            "short stubby little arms grown from the sides, "
            "thin translucent purple light ribbon energy trails flowing upward from top of head "
            "like ethereal silk scarves made of purple light energy, "
            "soft purple energy aura glow, gentle sparkle particles, "
            "kawaii style, pastel purple-lavender tones, "
            "clean white background, centered, digital art, 512x512"
        ),
    },
    3: {
        "name": "빛남 (Lv.3)",
        "seed": 99103,
        "clip_l": (
            "a bright cute round glowing lavender spirit, big sparkly purple eyes, proud confident smile, "
            "round purple body with short arms, translucent purple energy wings spreading from back, "
            "NOT feathered wings NOT angel wings, wings made of flowing purple light energy, "
            "purple-gold aura glow, kawaii spirit, white background"
        ),
        "t5xxl": (
            "A bright radiant cute round luminous spirit creature with big sparkling proud purple eyes "
            "and a confident happy expression, round translucent lavender-purple glowing body with short arms, "
            "the light ribbon energy trails from its head have expanded into translucent energy wings "
            "spreading from its back, the wings are made of flowing purple-gold transparent light energy, "
            "NOT feathered wings, NOT bird wings, NOT angel wings, "
            "the wings look like aurora borealis or flowing liquid light, "
            "soft purple-gold energy aura radiating outward, sparkle particles floating around, "
            "kawaii style, purple-lavender with hints of warm gold, "
            "clean white background, centered, digital art, 512x512"
        ),
    },
    4: {
        "name": "완성 (Lv.4)",
        "seed": 99200,
        "clip_l": (
            "a majestic cute round glowing spirit, big sparkly purple eyes, confident smile, "
            "round lavender-purple body with arms, big beautiful purple translucent fairy wings, "
            "small golden crown on head, golden-purple glowing aura, kawaii spirit queen, white background"
        ),
        "t5xxl": (
            "A majestic cute round luminous spirit creature, the fully evolved final form, "
            "big sparkling regal purple eyes with a confident radiant smile, pink blush cheeks, "
            "round glowing lavender-purple body with short arms, "
            "big beautiful translucent fairy-like wings made of purple and gold flowing light, "
            "the wings are large and spread wide, bigger than the body, "
            "a small cute golden crown sitting on top of its head, "
            "the entire body radiates a warm golden-purple glow aura, "
            "small golden sparkle particles floating around, "
            "kawaii spirit queen royalty style, pastel purple and warm gold tones, "
            "clean white background, centered, digital art, 512x512"
        ),
    },
}


def build_workflow(level: int) -> dict:
    """Build ComfyUI txt2img workflow for Flux Schnell GGUF."""
    data = EVOLUTION_DATA[level]
    t5xxl = f"{BASE}, {data['t5xxl']}"
    prefix = f"evolution_lv{level}"

    return {
        "prompt": {
            "1": {
                "class_type": "UnetLoaderGGUF",
                "inputs": {"unet_name": "flux1-schnell-Q4_K_S.gguf"}
            },
            "2": {
                "class_type": "DualCLIPLoaderGGUF",
                "inputs": {
                    "clip_name1": "clip_l.safetensors",
                    "clip_name2": "t5-v1_1-xxl-encoder-Q4_K_M.gguf",
                    "type": "flux"
                }
            },
            "3": {
                "class_type": "CLIPTextEncodeFlux",
                "inputs": {
                    "clip": ["2", 0],
                    "clip_l": data["clip_l"],
                    "t5xxl": t5xxl,
                    "guidance": 3.5
                }
            },
            "4": {
                "class_type": "CLIPTextEncodeFlux",
                "inputs": {
                    "clip": ["2", 0],
                    "clip_l": "",
                    "t5xxl": "",
                    "guidance": 3.5
                }
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": WIDTH,
                    "height": HEIGHT,
                    "batch_size": 1
                }
            },
            "6": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "seed": data["seed"],
                    "steps": STEPS,
                    "cfg": 1.0,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "positive": ["3", 0],
                    "negative": ["4", 0],
                    "latent_image": ["5", 0],
                    "denoise": 1.0
                }
            },
            "7": {
                "class_type": "VAELoader",
                "inputs": {"vae_name": "ae.safetensors"}
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {"samples": ["6", 0], "vae": ["7", 0]}
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {"images": ["8", 0], "filename_prefix": prefix}
            }
        }
    }


def queue_prompt(workflow: dict) -> str:
    data = json.dumps(workflow).encode('utf-8')
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())['prompt_id']


def wait_for_completion(prompt_id: str, timeout: int = 600) -> dict:
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}")
            history = json.loads(resp.read())
            if prompt_id in history:
                status = history[prompt_id].get('status', {})
                if status.get('completed', False) or status.get('status_str') == 'success':
                    return history[prompt_id]
                if status.get('status_str') == 'error':
                    print(f"  ERROR: {json.dumps(status, indent=2)[:500]}")
                    return None
        except Exception:
            pass
        time.sleep(3)
    print(f"  TIMEOUT after {timeout}s")
    return None


def find_output_file(history: dict) -> str:
    try:
        outputs = history.get('outputs', {})
        for node_id, node_out in outputs.items():
            if 'images' in node_out:
                for img in node_out['images']:
                    return img.get('filename', '')
    except Exception as e:
        print(f"  Error parsing output: {e}")
    return ''


def resize_image(src: str, dst: str, w: int, h: int):
    try:
        from PIL import Image
        from rembg import remove
        img = Image.open(src)
        img = img.resize((w, h), Image.LANCZOS)
        # Remove background -> transparent PNG
        img = remove(img)
        img.save(dst, 'PNG', optimize=True)
        return True
    except ImportError:
        shutil.copy2(src, dst)
        return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("Generating 5 Evolution Stage images via ComfyUI Flux Schnell")
    print(f"Resolution: {WIDTH}x{HEIGHT}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    # Check ComfyUI connection
    try:
        resp = urllib.request.urlopen(f"{COMFYUI_URL}/system_stats")
        stats = json.loads(resp.read())
        gpu = stats.get("devices", [{}])[0].get("name", "unknown")
        print(f"ComfyUI connected: {gpu}")
    except Exception as e:
        print(f"ComfyUI not available: {e}")
        print("Please start ComfyUI first!")
        return

    success_count = 0
    fail_count = 0

    for level in range(5):
        data = EVOLUTION_DATA[level]
        print(f"\n[Lv.{level}] {data['name']} (seed={data['seed']})")

        workflow = build_workflow(level)
        try:
            prompt_id = queue_prompt(workflow)
            print(f"  Queued: {prompt_id}")
        except Exception as e:
            print(f"  FAILED to queue: {e}")
            fail_count += 1
            continue

        history = wait_for_completion(prompt_id, timeout=300)
        if not history:
            fail_count += 1
            continue

        filename = find_output_file(history)
        if not filename:
            print("  No output file found")
            fail_count += 1
            continue

        src_path = COMFYUI_OUTPUT / filename
        dst_path = OUTPUT_DIR / f"lv{level}.png"

        if not src_path.exists():
            for subdir in COMFYUI_OUTPUT.iterdir():
                if subdir.is_dir():
                    candidate = subdir / filename
                    if candidate.exists():
                        src_path = candidate
                        break

        if src_path.exists():
            resized = resize_image(str(src_path), str(dst_path), WIDTH, HEIGHT)
            size_kb = os.path.getsize(str(dst_path)) / 1024
            print(f"  Saved: {dst_path.name} ({size_kb:.0f}KB) {'(bg removed)' if resized else '(copy)'}")
            success_count += 1
        else:
            print(f"  Output file not found: {src_path}")
            fail_count += 1

    print(f"\n{'=' * 60}")
    print(f"DONE: {success_count} succeeded, {fail_count} failed")
    if list(OUTPUT_DIR.glob('*.png')):
        total_size = sum(f.stat().st_size for f in OUTPUT_DIR.glob('*.png')) / 1024
        print(f"Total size: {total_size:.0f}KB")
    print("=" * 60)


if __name__ == '__main__':
    main()
