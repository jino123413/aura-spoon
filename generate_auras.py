"""
Generate 20 Aura Spirit CHARACTER images using ComfyUI Flux Schnell GGUF.
Style: Cute round glowing energy spirit "기운이" with aura-specific visual themes.
Output: aura-spoon/public/auras/1.png ~ 20.png (512x512px)
"""

import urllib.request
import json
import time
import os
import shutil
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = Path(r"C:\Users\USER-PC\Desktop\appintoss-project\aura-spoon\public\auras")
COMFYUI_OUTPUT = Path(r"C:\Users\USER-PC\Downloads\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\ComfyUI\output")

WIDTH = 512
HEIGHT = 512
STEPS = 4

# Base mascot description (shared across all 20 aura types)
BASE = (
    "A cute chibi energy spirit mascot character with big sparkly eyes, round body, soft glow, kawaii style"
)

# Style suffix appended to every prompt
STYLE = (
    "digital illustration, soft lighting, pastel colors, clean white background, centered composition, high quality"
)

# 20 aura spirit characters — each uses fluxPrompt from aura-types.ts
AURA_DATA = {
    1: {
        "name": "불꽃기운",
        "seed": 88001,
        "clip_l": "cute round glowing spirit, big sparkly eyes, fiery red-orange aura, flame hair tendrils, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, fiery red-orange energy aura radiating outward, flame-like hair tendrils, soft magical atmosphere, warm orange-red pastel background, kawaii style, digital art, 512x512",
    },
    2: {
        "name": "오로라기운",
        "seed": 88002,
        "clip_l": "cute round glowing spirit, big sparkly eyes, aurora borealis wings, green-purple shimmer, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, green-purple aurora borealis energy wings radiating outward, shimmering northern lights effect, soft magical atmosphere, teal-purple pastel background, kawaii style, digital art, 512x512",
    },
    3: {
        "name": "번개기운",
        "seed": 88003,
        "clip_l": "cute round glowing spirit, big sparkly eyes, electric yellow lightning bolts, zigzag antenna, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, electric yellow lightning bolt energy aura, zigzag antenna tendrils, sparkling electricity, soft magical atmosphere, golden yellow pastel background, kawaii style, digital art, 512x512",
    },
    4: {
        "name": "해님기운",
        "seed": 88004,
        "clip_l": "cute round glowing spirit, big sparkly eyes, golden sun crown, warm light rays, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, warm golden sun energy aura radiating outward, small sun crown on head, gentle warm light rays, soft magical atmosphere, warm orange pastel background, kawaii style, digital art, 512x512",
    },
    5: {
        "name": "달님기운",
        "seed": 88005,
        "clip_l": "cute round glowing spirit, big sparkly eyes, silver-blue moonlight aura, crescent moon earring, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, silver-blue moonlight energy aura radiating outward, crescent moon earring accessory, gentle moonbeams, soft magical atmosphere, silvery blue pastel background, kawaii style, digital art, 512x512",
    },
    6: {
        "name": "바다기운",
        "seed": 88006,
        "clip_l": "cute round glowing spirit, big sparkly eyes, deep blue ocean aura, wave patterns, water ripples, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, deep blue ocean energy aura radiating outward, wave pattern on body, gentle water ripples, soft magical atmosphere, ocean blue pastel background, kawaii style, digital art, 512x512",
    },
    7: {
        "name": "숲기운",
        "seed": 88007,
        "clip_l": "cute round glowing spirit, big sparkly eyes, emerald green forest aura, leaf crown, floating leaves, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, emerald green forest energy aura radiating outward, small leaf crown accessory, gentle floating leaves, soft magical atmosphere, forest green pastel background, kawaii style, digital art, 512x512",
    },
    8: {
        "name": "바람기운",
        "seed": 88008,
        "clip_l": "cute round glowing spirit, big sparkly eyes, sky blue wind aura, swirl patterns, pinwheel accessory, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, sky blue wind energy aura radiating outward with swirl patterns, small pinwheel accessory, gentle breeze lines, soft magical atmosphere, light blue pastel background, kawaii style, digital art, 512x512",
    },
    9: {
        "name": "별빛기운",
        "seed": 88009,
        "clip_l": "cute round glowing spirit, big sparkly eyes, purple-gold starlight aura, star mark on forehead, twinkling stars, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, purple-gold starlight energy aura radiating outward, glowing star mark on forehead, twinkling star particles, soft magical atmosphere, purple pastel background, kawaii style, digital art, 512x512",
    },
    10: {
        "name": "크리스탈기운",
        "seed": 88010,
        "clip_l": "cute round glowing spirit, big sparkly eyes, prismatic crystal aura, crystal horn, rainbow light refraction, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, prismatic rainbow crystal energy aura radiating outward, small crystal horn, light refraction rainbow effect, soft magical atmosphere, iridescent white pastel background, kawaii style, digital art, 512x512",
    },
    11: {
        "name": "용암기운",
        "seed": 88011,
        "clip_l": "cute round glowing spirit, big sparkly eyes, deep red magma aura, rocky arm textures, flowing lava, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, deep red magma energy aura radiating outward, rocky arm textures, slow flowing lava effect, soft magical atmosphere, dark red warm pastel background, kawaii style, digital art, 512x512",
    },
    12: {
        "name": "꽃잎기운",
        "seed": 88012,
        "clip_l": "cute round glowing spirit, big sparkly eyes, pink petal aura, flower blush cheeks, floating cherry blossom petals, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, pink petal energy aura radiating outward, flower petal blush on cheeks, floating cherry blossom petals, soft magical atmosphere, pink pastel background, kawaii style, digital art, 512x512",
    },
    13: {
        "name": "무지개기운",
        "seed": 88013,
        "clip_l": "cute round glowing spirit, big sparkly eyes, rainbow energy aura, colorful rainbow tail, cheerful sparkles, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, rainbow energy aura radiating outward, colorful rainbow tail, cheerful sparkles, soft magical atmosphere, colorful pastel background, kawaii style, digital art, 512x512",
    },
    14: {
        "name": "안개기운",
        "seed": 88014,
        "clip_l": "cute round glowing spirit, big sparkly eyes, purple-gray misty aura, wispy fog clothing, gentle mist, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, soft purple-gray misty energy aura radiating outward, wispy fog clothing, gentle mist particles, soft magical atmosphere, lavender gray pastel background, kawaii style, digital art, 512x512",
    },
    15: {
        "name": "눈꽃기운",
        "seed": 88015,
        "clip_l": "cute round glowing spirit, big sparkly eyes, ice blue snowflake aura, snowflake crystal crown, geometric ice patterns, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, ice blue snowflake energy aura radiating outward, snowflake crystal crown, geometric ice patterns, soft magical atmosphere, icy blue pastel background, kawaii style, digital art, 512x512",
    },
    16: {
        "name": "대지기운",
        "seed": 88016,
        "clip_l": "cute round glowing spirit, big sparkly eyes, brown-gold earth aura, mountain-shaped hat, floating earth particles, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, brown-gold earth energy aura radiating outward, mountain-shaped hat, small floating earth particles, soft magical atmosphere, warm brown pastel background, kawaii style, digital art, 512x512",
    },
    17: {
        "name": "벚꽃기운",
        "seed": 88017,
        "clip_l": "cute round glowing spirit, big sparkly eyes, soft pink cherry blossom aura, floating sakura petals, pink glow, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, soft pink cherry blossom energy aura radiating outward, floating sakura petals swirling around, gentle pink glow, soft magical atmosphere, cherry blossom pink pastel background, kawaii style, digital art, 512x512",
    },
    18: {
        "name": "천둥기운",
        "seed": 88018,
        "clip_l": "cute round glowing spirit, big sparkly eyes, deep purple-gold thunder aura, lightning bolt mark, electric sparks, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, deep purple-gold thunder energy aura radiating outward, lightning bolt mark on body, dramatic electric sparks, soft magical atmosphere, deep indigo pastel background, kawaii style, digital art, 512x512",
    },
    19: {
        "name": "노을기운",
        "seed": 88019,
        "clip_l": "cute round glowing spirit, big sparkly eyes, orange-pink sunset aura, cloud scarf accessory, warm sunset gradient, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, orange-pink sunset energy aura radiating outward, fluffy cloud scarf accessory, warm sunset gradient, soft magical atmosphere, coral orange pastel background, kawaii style, digital art, 512x512",
    },
    20: {
        "name": "새벽기운",
        "seed": 88020,
        "clip_l": "cute round glowing spirit, big sparkly eyes, light blue-pink dawn aura, morning star above head, dawn light gradient, kawaii, white background",
        "fluxPrompt": "A cute small round luminous spirit creature with big sparkling eyes, translucent glowing body, floating in center, light blue-pink dawn energy aura radiating outward, small morning star above head, gentle dawn light gradient, soft magical atmosphere, pale blue-pink pastel background, kawaii style, digital art, 512x512",
    },
}


def build_workflow(aura_id: int) -> dict:
    """Build ComfyUI txt2img workflow for Flux Schnell GGUF."""
    aura = AURA_DATA[aura_id]
    t5xxl = f"{BASE}, {aura['fluxPrompt']}, {STYLE}"
    prefix = f"aura_{aura_id}"

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
                    "clip_l": aura["clip_l"],
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
                    "seed": aura["seed"],
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
    print("Generating 20 Aura Spirit images via ComfyUI Flux Schnell")
    print(f"Resolution: {WIDTH}x{HEIGHT}")
    print(f"Model: flux1-schnell-Q5_0.gguf")
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

    for aura_id in range(1, 21):
        aura = AURA_DATA[aura_id]
        print(f"\n[{aura_id:2d}/20] {aura['name']} (seed={aura['seed']})")

        workflow = build_workflow(aura_id)
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
        dst_path = OUTPUT_DIR / f"{aura_id}.png"

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
