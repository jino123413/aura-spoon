"""
Generate 20 aura-type × 5 evolution-level = 100 images via txt2img.
Each aura type has its OWN evolution chain with unique forms.
Consistent rules: Lv0=orb, Lv1=eyes, Lv2=arms, Lv3=wings, Lv4=crown+wings
Consistent style: kawaii chibi spirit, white bg, 512x512, transparent PNG.
Output: public/auras/{id}/lv{level}.png
"""

import urllib.request
import json
import time
import os
import shutil
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_BASE = Path(r"C:\Users\USER-PC\Desktop\appintoss-project\aura-spoon\public\auras")
COMFYUI_OUTPUT = Path(r"C:\Users\USER-PC\Downloads\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\ComfyUI\output")

WIDTH = 512
HEIGHT = 512
STEPS = 4

# Shared style suffix
STYLE = "kawaii style, digital illustration, soft lighting, clean white background, centered composition, high quality, 512x512"

# Per-aura theme data
AURAS = {
    1:  {"name": "불꽃기운",     "color": "fiery red-orange",           "element": "flame", "feature_small": "tiny ember glow", "feature_mid": "flame hair tendrils, fire energy", "feature_wings": "blazing flame wings made of fire", "feature_crown": "flame crown of condensed fire, large blazing fire wings"},
    2:  {"name": "오로라기운",   "color": "green-purple aurora",        "element": "aurora", "feature_small": "faint aurora shimmer", "feature_mid": "aurora borealis ribbons, northern lights", "feature_wings": "flowing aurora borealis light wings", "feature_crown": "aurora crown of northern lights, magnificent aurora wings"},
    3:  {"name": "번개기운",     "color": "electric yellow golden",     "element": "lightning", "feature_small": "tiny electric spark", "feature_mid": "zigzag lightning antenna, electric sparks", "feature_wings": "electric lightning bolt wings crackling with energy", "feature_crown": "lightning crown of electric bolts, large crackling thunder wings"},
    4:  {"name": "해님기운",     "color": "warm golden orange",         "element": "sun", "feature_small": "faint warm sun glow", "feature_mid": "sun ray tendrils, warm golden light", "feature_wings": "radiant sun ray wings of golden light", "feature_crown": "golden sun crown radiating light, magnificent sunray wings"},
    5:  {"name": "달님기운",     "color": "silver-blue moonlight",      "element": "moon", "feature_small": "faint crescent moon glow", "feature_mid": "crescent moon on head, gentle moonbeams", "feature_wings": "silvery moonlight wings of soft blue light", "feature_crown": "silver crescent moon crown, large ethereal moonlight wings"},
    6:  {"name": "바다기운",     "color": "deep blue ocean",            "element": "ocean", "feature_small": "tiny water droplet glow", "feature_mid": "wave patterns on body, water ripple energy", "feature_wings": "flowing ocean wave wings of deep blue water", "feature_crown": "ocean wave crown of blue water, magnificent water wings"},
    7:  {"name": "숲기운",       "color": "emerald green forest",       "element": "forest", "feature_small": "tiny green leaf sprout", "feature_mid": "leaf crown on head, floating leaves", "feature_wings": "lush green leaf wings made of nature", "feature_crown": "forest crown of emerald leaves, magnificent leaf and vine wings"},
    8:  {"name": "바람기운",     "color": "sky blue wind",              "element": "wind", "feature_small": "faint breeze swirl", "feature_mid": "wind swirl patterns, breeze lines", "feature_wings": "flowing wind current wings of sky blue air", "feature_crown": "wind crown of swirling air currents, large flowing breeze wings"},
    9:  {"name": "별빛기운",     "color": "purple-gold starlight",      "element": "star", "feature_small": "faint twinkling star glow", "feature_mid": "star mark on forehead, twinkling stars", "feature_wings": "sparkling starlight wings of purple-gold light", "feature_crown": "star crown of twinkling constellation, magnificent starlight wings"},
    10: {"name": "크리스탈기운", "color": "prismatic rainbow crystal",  "element": "crystal", "feature_small": "faint prismatic glint", "feature_mid": "crystal horn, rainbow refraction", "feature_wings": "prismatic crystal wings refracting rainbow light", "feature_crown": "crystal crown of prismatic gems, large rainbow crystal wings"},
    11: {"name": "용암기운",     "color": "deep red magma",             "element": "lava", "feature_small": "tiny molten ember", "feature_mid": "rocky texture arms, flowing lava patterns", "feature_wings": "molten magma wings of flowing red lava", "feature_crown": "volcanic rock crown with magma glow, massive lava wings"},
    12: {"name": "꽃잎기운",     "color": "pink petal blossom",         "element": "petal", "feature_small": "tiny pink petal glow", "feature_mid": "flower blush cheeks, floating petals", "feature_wings": "beautiful pink flower petal wings", "feature_crown": "flower crown of cherry blossoms, magnificent petal wings"},
    13: {"name": "무지개기운",   "color": "colorful rainbow",           "element": "rainbow", "feature_small": "faint multicolor shimmer", "feature_mid": "rainbow tail, cheerful sparkles", "feature_wings": "vibrant rainbow spectrum wings of multicolor light", "feature_crown": "rainbow arc crown of all colors, large spectrum wings"},
    14: {"name": "안개기운",     "color": "purple-gray mist",           "element": "mist", "feature_small": "tiny wispy fog", "feature_mid": "wispy fog wisps, gentle mist particles", "feature_wings": "ethereal mist wings of flowing purple-gray fog", "feature_crown": "mist crown of swirling fog, large ethereal fog wings"},
    15: {"name": "눈꽃기운",     "color": "ice blue snowflake",         "element": "snow", "feature_small": "tiny ice crystal glint", "feature_mid": "snowflake crystal on head, ice patterns", "feature_wings": "geometric ice crystal wings of frozen snowflakes", "feature_crown": "ice crystal crown of snowflakes, magnificent frost wings"},
    16: {"name": "대지기운",     "color": "brown-gold earth",           "element": "earth", "feature_small": "tiny earth pebble glow", "feature_mid": "mountain hat, floating earth particles", "feature_wings": "sturdy earth and stone wings with golden veins", "feature_crown": "mountain crown of brown-gold earth, large stone wings"},
    17: {"name": "벚꽃기운",     "color": "soft pink sakura",           "element": "sakura", "feature_small": "tiny sakura petal glow", "feature_mid": "floating sakura petals, pink glow", "feature_wings": "delicate sakura blossom wings of soft pink", "feature_crown": "sakura flower crown, magnificent cherry blossom wings"},
    18: {"name": "천둥기운",     "color": "deep indigo-gold thunder",   "element": "thunder", "feature_small": "tiny deep purple spark", "feature_mid": "lightning bolt mark, electric sparks", "feature_wings": "dramatic thunder wings of indigo-gold lightning", "feature_crown": "thunder crown of electric bolts, large dramatic storm wings"},
    19: {"name": "노을기운",     "color": "orange-pink sunset",         "element": "sunset", "feature_small": "faint warm sunset glow", "feature_mid": "cloud scarf, warm sunset gradient", "feature_wings": "beautiful sunset gradient wings of orange-pink light", "feature_crown": "sunset cloud crown, magnificent warm gradient wings"},
    20: {"name": "새벽기운",     "color": "pale blue-pink dawn",        "element": "dawn", "feature_small": "faint dawn light glow", "feature_mid": "morning star above head, dawn gradient", "feature_wings": "gentle dawn light wings of pale blue-pink", "feature_crown": "morning star crown of dawn light, large ethereal dawn wings"},
}


def build_prompts(aura_id: int, level: int):
    """Build clip_l and t5xxl prompts for a specific aura + evolution level."""
    a = AURAS[aura_id]
    color = a["color"]

    if level == 0:
        clip_l = (
            f"a very tiny faint translucent {color} glowing orb, "
            f"{a['feature_small']}, very small, simple dot eyes, no mouth, "
            f"no arms, no legs, round bubble, white background"
        )
        t5xxl = (
            f"A very tiny faint translucent round {color} glowing orb, "
            f"{a['feature_small']}, barely formed, semi-transparent like a soap bubble, "
            f"only two tiny dot eyes, no mouth, no arms, no legs, "
            f"just a small {color} tinted energy bubble, ethereal and fragile, "
            f"{STYLE}"
        )
    elif level == 1:
        clip_l = (
            f"a small cute round {color} glowing spirit, big sparkly eyes, tiny smile, "
            f"{color} translucent body, pink blush, no arms, no legs, "
            f"{a['feature_small']}, kawaii baby spirit, white background"
        )
        t5xxl = (
            f"A small cute round luminous spirit with big sparkling eyes and tiny smile, "
            f"{color} glowing translucent round body, pink blush on cheeks, "
            f"no arms, no legs, just a round floating body with a face, "
            f"gentle {color} aura glow, {a['feature_small']}, "
            f"innocent and newborn looking, {STYLE}"
        )
    elif level == 2:
        clip_l = (
            f"a cute round {color} glowing spirit, big sparkly eyes, happy smile, "
            f"short stubby arms, small feet, {a['feature_mid']}, "
            f"kawaii spirit, white background"
        )
        t5xxl = (
            f"A cute round luminous spirit creature with big sparkling confident eyes "
            f"and cheerful smile, {color} glowing body, "
            f"short stubby arms and small feet have grown, "
            f"{a['feature_mid']}, {color} energy aura, "
            f"growing and getting stronger, {STYLE}"
        )
    elif level == 3:
        clip_l = (
            f"a bright cute round {color} glowing spirit, big sparkly eyes, confident smile, "
            f"short arms, {a['feature_wings']}, {a['feature_mid']}, "
            f"radiant {color} aura, kawaii spirit, white background"
        )
        t5xxl = (
            f"A bright radiant cute round luminous spirit with big sparkling proud eyes "
            f"and confident happy expression, {color} glowing body with short arms, "
            f"{a['feature_wings']}, {a['feature_mid']}, "
            f"bright {color} aura radiating outward, sparkle particles, "
            f"visibly powerful and shining, {STYLE}"
        )
    elif level == 4:
        clip_l = (
            f"a majestic cute round {color} glowing spirit, big sparkly regal eyes, "
            f"confident smile, short arms, {a['feature_crown']}, "
            f"intense {color} aura, golden sparkles, kawaii spirit royalty, white background"
        )
        t5xxl = (
            f"A majestic fully evolved cute round luminous spirit, the ultimate form, "
            f"big sparkling regal eyes with confident radiant smile, "
            f"{color} intensely glowing body with short arms, "
            f"{a['feature_crown']}, "
            f"powerful {color} aura radiating in all directions, golden sparkle particles, "
            f"the complete and perfected evolution, clearly the most grand and powerful form, "
            f"{STYLE}"
        )

    return clip_l, t5xxl


def build_workflow(aura_id: int, level: int) -> dict:
    """Build ComfyUI txt2img workflow."""
    clip_l, t5xxl = build_prompts(aura_id, level)
    prefix = f"aura_{aura_id}_lv{level}"
    seed = 66000 + aura_id * 100 + level * 7  # unique per aura+level

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
                    "clip_l": clip_l,
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
                "inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}
            },
            "6": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "seed": seed,
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
        f"{COMFYUI_URL}/prompt", data=data,
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read())['prompt_id']


def wait_for_completion(prompt_id: str, timeout: int = 300) -> dict:
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
                    return None
        except Exception:
            pass
        time.sleep(2)
    return None


def find_output_file(history: dict) -> str:
    try:
        for node_out in history.get('outputs', {}).values():
            if 'images' in node_out:
                return node_out['images'][0].get('filename', '')
    except Exception:
        pass
    return ''


def process_image(src: str, dst: str):
    try:
        from PIL import Image
        from rembg import remove
        img = Image.open(src).resize((WIDTH, HEIGHT), Image.LANCZOS)
        img = remove(img)
        img.save(dst, 'PNG', optimize=True)
    except ImportError:
        shutil.copy2(src, dst)


def main():
    print("=" * 60)
    print("Aura Evolution: 20 types × 5 levels = 100 images (txt2img)")
    print(f"Output: {OUTPUT_BASE}/{{id}}/lv{{level}}.png")
    print("=" * 60)

    try:
        resp = urllib.request.urlopen(f"{COMFYUI_URL}/system_stats")
        stats = json.loads(resp.read())
        gpu = stats.get("devices", [{}])[0].get("name", "unknown")
        print(f"ComfyUI: {gpu}\n")
    except Exception as e:
        print(f"ComfyUI not available: {e}")
        return

    success = 0
    fail = 0

    for aura_id in range(1, 21):
        a = AURAS[aura_id]
        aura_dir = OUTPUT_BASE / str(aura_id)
        os.makedirs(aura_dir, exist_ok=True)

        for level in range(5):
            dst_path = aura_dir / f"lv{level}.png"
            if dst_path.exists():
                print(f"[{aura_id:2d}] {a['name']} Lv.{level} - skip")
                success += 1
                continue

            print(f"[{aura_id:2d}] {a['name']} Lv.{level}", end="", flush=True)
            workflow = build_workflow(aura_id, level)
            try:
                prompt_id = queue_prompt(workflow)
            except Exception:
                print(" FAIL(q)")
                fail += 1
                continue

            history = wait_for_completion(prompt_id)
            if not history:
                print(" FAIL(t)")
                fail += 1
                continue

            filename = find_output_file(history)
            if not filename:
                print(" FAIL(o)")
                fail += 1
                continue

            src_path = COMFYUI_OUTPUT / filename
            if not src_path.exists():
                for subdir in COMFYUI_OUTPUT.iterdir():
                    if subdir.is_dir() and (subdir / filename).exists():
                        src_path = subdir / filename
                        break

            if src_path.exists():
                process_image(str(src_path), str(dst_path))
                kb = os.path.getsize(str(dst_path)) / 1024
                print(f" OK ({kb:.0f}KB)")
                success += 1
            else:
                print(" FAIL(f)")
                fail += 1

    print(f"\n{'=' * 60}")
    print(f"DONE: {success}/100, {fail} failed")
    print("=" * 60)


if __name__ == '__main__':
    main()
