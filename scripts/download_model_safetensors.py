"""
download_model_safetensors.py — Resilient resume-capable downloader for DeBERTa weights.
"""
import os
import shutil
import time
import urllib.request

SNAPSHOT_DIR = os.path.expanduser("~/.cache/huggingface/hub/models--cross-encoder--nli-deberta-v3-base/snapshots/6c749ce3425cd33b46d187e45b92bbf96ee12ec7")
BLOBS_DIR = os.path.expanduser("~/.cache/huggingface/hub/models--cross-encoder--nli-deberta-v3-base/blobs")
TARGET_FILE = os.path.join(SNAPSHOT_DIR, "model.safetensors")
URL = "https://huggingface.co/cross-encoder/nli-deberta-v3-base/resolve/main/model.safetensors"
TOTAL_SIZE = 737726552

def main():
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    
    # If target already exists and is complete, we are done
    if os.path.exists(TARGET_FILE) and os.path.getsize(TARGET_FILE) == TOTAL_SIZE:
        print(f"Target already fully downloaded: {TARGET_FILE} ({TOTAL_SIZE} bytes)")
        return

    # Check if we have an incomplete file we can resume from
    incomplete_candidates = [
        os.path.join(BLOBS_DIR, "d8148c6d49e0a7925134294c56326c71fe0ab1dc390e37355e00c7efbb488afa.a2d24a0c.incomplete"),
        TARGET_FILE + ".part"
    ]
    
    part_file = TARGET_FILE + ".part"
    if not os.path.exists(part_file):
        for cand in incomplete_candidates:
            if os.path.exists(cand) and os.path.getsize(cand) > 0:
                print(f"Seeding part file from {cand} ({os.path.getsize(cand)} bytes)...")
                shutil.copyfile(cand, part_file)
                break

    existing_bytes = os.path.getsize(part_file) if os.path.exists(part_file) else 0
    print(f"Starting download from byte {existing_bytes}/{TOTAL_SIZE} ({existing_bytes/TOTAL_SIZE*100:.1f}%)")

    chunk_size = 1024 * 1024 * 4  # 4 MB chunks
    retries = 10
    
    while existing_bytes < TOTAL_SIZE:
        try:
            req = urllib.request.Request(
                URL,
                headers={"Range": f"bytes={existing_bytes}-{TOTAL_SIZE - 1}"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp, open(part_file, "ab") as f:
                while True:
                    data = resp.read(chunk_size)
                    if not data:
                        break
                    f.write(data)
                    existing_bytes += len(data)
                    pct = (existing_bytes / TOTAL_SIZE) * 100
                    mb = existing_bytes / (1024 * 1024)
                    print(f"Progress: {mb:.1f} MB / {TOTAL_SIZE/(1024*1024):.1f} MB ({pct:.1f}%)", flush=True)
        except Exception as e:
            print(f"Download chunk error: {e}. Retrying in 2 seconds...", flush=True)
            time.sleep(2)
            existing_bytes = os.path.getsize(part_file) if os.path.exists(part_file) else 0
            retries -= 1
            if retries <= 0:
                print("Max retries exceeded")
                return

    if os.path.getsize(part_file) == TOTAL_SIZE:
        if os.path.exists(TARGET_FILE):
            os.remove(TARGET_FILE)
        os.rename(part_file, TARGET_FILE)
        print("Download COMPLETE! Successfully saved model.safetensors")

if __name__ == "__main__":
    main()
