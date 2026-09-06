"""
convert_dataset.py — Merge CoAID + FakeHealth into a unified health_news.csv

Reads raw data from:
  - data/raw/coaid/   (all date folders)
  - data/raw/fakehealth/dataset/

Outputs:
  - data/health_news.csv  (columns: text, label, source)
    label: 0 = fake/unreliable, 1 = real/reliable
"""

import pandas as pd
import json
import os
import glob
from pathlib import Path

# Base directory = directory where this script lives (data/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_coaid(base_path=None):
    if base_path is None:
        base_path = os.path.join(SCRIPT_DIR, "raw", "coaid")
    """Load CoAID news articles and claims from all date folders."""
    rows = []
    date_folders = ["05-01-2020", "07-01-2020", "09-01-2020", "11-01-2020"]

    for folder in date_folders:
        folder_path = os.path.join(base_path, folder)
        if not os.path.exists(folder_path):
            print(f"  [SKIP] {folder_path} not found")
            continue

        # --- News articles (have content column) ---
        for prefix, label in [("NewsFakeCOVID-19", 0), ("NewsRealCOVID-19", 1)]:
            csv_path = os.path.join(folder_path, f"{prefix}.csv")
            if not os.path.exists(csv_path):
                continue
            df = pd.read_csv(csv_path)

            # Use content if available, fall back to title
            for _, row in df.iterrows():
                text = ""
                title = str(row.get("title", "")).strip() if pd.notna(row.get("title")) else ""
                content = str(row.get("content", "")).strip() if pd.notna(row.get("content")) else ""

                if content and len(content) > 50:
                    text = f"{title}. {content}" if title else content
                elif title and len(title) > 20:
                    text = title
                else:
                    continue  # Skip entries without meaningful text

                rows.append({"text": text, "label": label, "source": "CoAID"})

        # --- Claims (title only, shorter text) ---
        for prefix, label in [("ClaimFakeCOVID-19", 0), ("ClaimRealCOVID-19", 1)]:
            csv_path = os.path.join(folder_path, f"{prefix}.csv")
            if not os.path.exists(csv_path):
                continue
            df = pd.read_csv(csv_path)
            for _, row in df.iterrows():
                title = str(row.get("title", "")).strip() if pd.notna(row.get("title")) else ""
                if title and len(title) > 20:
                    rows.append({"text": title, "label": label, "source": "CoAID-Claim"})

    print(f"  [CoAID] Loaded {len(rows)} entries")
    return pd.DataFrame(rows)


def load_fakehealth(base_path=None):
    if base_path is None:
        base_path = os.path.join(SCRIPT_DIR, "raw", "fakehealth", "dataset")
    """
    Load FakeHealth (HealthStory + HealthRelease).

    Rating system (0-5 scale from expert reviewers):
      - Ratings 0, 1, 2 → label 0 (fake / unreliable / misleading)
      - Ratings 3, 4, 5 → label 1 (real / reliable / credible)

    We use article content from the content/ JSONs, matched by news_id
    to the review ratings.
    """
    rows = []

    for dataset_name in ["HealthStory", "HealthRelease"]:
        reviews_path = os.path.join(base_path, "reviews", f"{dataset_name}.json")
        content_dir = os.path.join(base_path, "content", dataset_name)

        if not os.path.exists(reviews_path):
            print(f"  [SKIP] {reviews_path} not found")
            continue

        # Load reviews to get ratings
        with open(reviews_path, encoding="utf-8") as f:
            reviews = json.load(f)

        # Build a mapping: news_id → rating
        id_to_rating = {}
        id_to_title = {}
        for review in reviews:
            news_id = review.get("news_id", "")
            rating = review.get("rating")
            title = review.get("title", "")
            if news_id and rating is not None:
                id_to_rating[news_id] = rating
                id_to_title[news_id] = title

        # Load content files and match with ratings
        if os.path.exists(content_dir):
            content_files = sorted(glob.glob(os.path.join(content_dir, "*.json")))
            for cf in content_files:
                # Extract news_id from filename (e.g., story_reviews_00123.json → 00123)
                fname = os.path.basename(cf)
                # The news_id in reviews matches the number in the filename
                try:
                    with open(cf, encoding="utf-8") as f:
                        article = json.load(f)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    continue

                text = article.get("text", "").strip()
                title = article.get("title", "").strip()

                if not text or len(text) < 50:
                    continue

                full_text = f"{title}. {text}" if title else text

                # Try to match with review by index
                # Filename: story_reviews_XXXXX.json → index XXXXX
                try:
                    idx_str = fname.replace("story_reviews_", "").replace(
                        "release_reviews_", ""
                    ).replace(".json", "")
                    idx = int(idx_str)
                except ValueError:
                    continue

                # Look up rating — if we can match by index position
                if idx < len(reviews):
                    rating = reviews[idx].get("rating", None)
                    if rating is None:
                        continue
                    # Convert rating to binary label
                    # 0, 1, 2 → unreliable (label 0)
                    # 3, 4, 5 → reliable (label 1)
                    label = 0 if rating <= 2 else 1
                    rows.append({
                        "text": full_text,
                        "label": label,
                        "source": f"FakeHealth-{dataset_name}"
                    })

    print(f"  [FakeHealth] Loaded {len(rows)} entries")
    return pd.DataFrame(rows)


def main():
    print("=" * 60)
    print("HealthGuard AI — Dataset Conversion")
    print("=" * 60)

    # Load both datasets
    print("\n[1/4] Loading CoAID...")
    df_coaid = load_coaid()

    print("\n[2/4] Loading FakeHealth...")
    df_fakehealth = load_fakehealth()

    # Combine
    print("\n[3/4] Merging datasets...")
    df = pd.concat([df_coaid, df_fakehealth], ignore_index=True)

    # Clean up
    df["text"] = df["text"].astype(str).str.strip()
    df = df[df["text"].str.len() > 30]  # Remove very short entries
    df = df.drop_duplicates(subset=["text"])  # Deduplicate
    df = df.dropna(subset=["text", "label"])
    df["label"] = df["label"].astype(int)

    print(f"\n  Combined dataset: {len(df)} entries")
    print(f"  Class distribution:")
    print(f"    Fake (0): {(df['label'] == 0).sum()}")
    print(f"    Real (1): {(df['label'] == 1).sum()}")
    print(f"  Sources: {df['source'].value_counts().to_dict()}")

    # Balance the dataset (undersample majority class)
    fake_count = (df["label"] == 0).sum()
    real_count = (df["label"] == 1).sum()

    if real_count > fake_count * 3:
        print(f"\n  [BALANCE] Real class ({real_count}) >> Fake class ({fake_count})")
        print(f"  Undersampling real class to {fake_count * 2} entries...")
        df_fake = df[df["label"] == 0]
        df_real = df[df["label"] == 1].sample(n=min(fake_count * 2, real_count), random_state=42)
        df = pd.concat([df_fake, df_real], ignore_index=True)

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Save
    print("\n[4/4] Saving...")
    output_path = os.path.join(SCRIPT_DIR, "health_news.csv")
    df.to_csv(output_path, index=False)

    print(f"\n{'=' * 60}")
    print(f"[OK] Saved to {output_path}")
    print(f"   Total entries: {len(df)}")
    print(f"   Fake (0): {(df['label'] == 0).sum()}")
    print(f"   Real (1): {(df['label'] == 1).sum()}")
    print(f"   Columns: {df.columns.tolist()}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
