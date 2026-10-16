"""
train_healthguard.py — HealthGuard AI Training, Evaluation & Explainability Pipeline

Usage:
    # Run EDA visualizations
    python train_healthguard.py --eda --data data/health_news.csv

    # Train baseline model (TF-IDF + Logistic Regression)
    python train_healthguard.py --model baseline --data data/health_news.csv

    # Train transformer model (requires GPU — use Colab/Kaggle)
    python train_healthguard.py --model bert --data data/health_news.csv --epochs 3

    # Run SHAP explainability on trained baseline
    python train_healthguard.py --model baseline --data data/health_news.csv --explain
"""

import argparse
import json
import os
import pickle
import re
import sys
import warnings

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for saving plots

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split

import nltk

warnings.filterwarnings("ignore")

# ============================================================================
# Configuration
# ============================================================================

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(PROJECT_DIR, "outputs")
MODEL_DIR = os.path.join(PROJECT_DIR, "model")

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(os.path.join(MODEL_DIR, "baseline"), exist_ok=True)
os.makedirs(os.path.join(MODEL_DIR, "bert"), exist_ok=True)

# Download NLTK data silently
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("wordnet", quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()


# ============================================================================
# Text Preprocessing
# ============================================================================

def clean_text(text):
    """Clean and normalize text for NLP processing."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)  # Remove URLs
    text = re.sub(r"<.*?>", "", text)  # Remove HTML tags
    text = re.sub(r"[^a-zA-Z\s]", " ", text)  # Keep only letters
    text = re.sub(r"\s+", " ", text).strip()  # Collapse whitespace

    words = text.split()
    words = [LEMMATIZER.lemmatize(w) for w in words if w not in STOP_WORDS and len(w) > 2]
    return " ".join(words)


def load_and_preprocess(data_path):
    """Load dataset and apply text preprocessing."""
    print(f"\n[DATA] Loading {data_path}...")
    df = pd.read_csv(data_path)

    # Ensure required columns exist
    assert "text" in df.columns, "Dataset must have a 'text' column"
    assert "label" in df.columns, "Dataset must have a 'label' column"

    print(f"  Raw samples: {len(df)}")
    print(f"  Class distribution: {df['label'].value_counts().to_dict()}")

    # Drop empty rows
    df = df.dropna(subset=["text"])
    df["text"] = df["text"].astype(str)
    df = df[df["text"].str.len() > 30]

    print(f"  After filtering: {len(df)} samples")

    # Clean text
    print("  Cleaning text...")
    df["text_clean"] = df["text"].apply(clean_text)
    df = df[df["text_clean"].str.len() > 10]

    print(f"  After cleaning: {len(df)} samples")
    return df


# ============================================================================
# EDA — Exploratory Data Analysis
# ============================================================================

def run_eda(df):
    """Generate EDA visualizations and save to outputs/."""
    print("\n[EDA] Generating visualizations...")

    # --- Class Distribution ---
    fig, ax = plt.subplots(figsize=(8, 5))
    colors = ["#ef4444", "#22c55e"]
    counts = df["label"].value_counts().sort_index()
    bars = ax.bar(
        ["Fake (0)", "Real (1)"],
        counts.values,
        color=colors,
        edgecolor="white",
        linewidth=2,
    )
    for bar, count in zip(bars, counts.values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 20,
                str(count), ha="center", fontweight="bold", fontsize=14)
    ax.set_title("Class Distribution — Health News Dataset", fontsize=16, fontweight="bold")
    ax.set_ylabel("Number of Articles", fontsize=12)
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUTS_DIR, "class_distribution.png"), dpi=150)
    plt.close()
    print("  Saved: class_distribution.png")

    # --- Text Length Distribution ---
    df["text_length"] = df["text_clean"].str.split().apply(len)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(df[df["label"] == 0]["text_length"], bins=50, alpha=0.7, color="#ef4444", label="Fake")
    ax.hist(df[df["label"] == 1]["text_length"], bins=50, alpha=0.7, color="#22c55e", label="Real")
    ax.set_title("Text Length Distribution by Class", fontsize=16, fontweight="bold")
    ax.set_xlabel("Number of Words")
    ax.set_ylabel("Frequency")
    ax.legend()
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUTS_DIR, "text_length_distribution.png"), dpi=150)
    plt.close()
    print("  Saved: text_length_distribution.png")

    # --- Word Clouds ---
    try:
        from wordcloud import WordCloud

        for label, name, color in [(0, "fake", "Reds"), (1, "real", "Greens")]:
            text = " ".join(df[df["label"] == label]["text_clean"].values)
            wc = WordCloud(
                width=1200, height=600, max_words=100,
                background_color="white", colormap=color,
                contour_width=2, contour_color="gray"
            ).generate(text)
            fig, ax = plt.subplots(figsize=(12, 6))
            ax.imshow(wc, interpolation="bilinear")
            ax.axis("off")
            ax.set_title(f"Most Common Words — {'Fake' if label == 0 else 'Real'} Health News",
                         fontsize=16, fontweight="bold")
            plt.tight_layout()
            plt.savefig(os.path.join(OUTPUTS_DIR, f"wordcloud_{name}.png"), dpi=150)
            plt.close()
            print(f"  Saved: wordcloud_{name}.png")
    except ImportError:
        print("  [SKIP] wordcloud not installed")

    # --- Source Distribution (if available) ---
    if "source" in df.columns:
        fig, ax = plt.subplots(figsize=(10, 5))
        source_counts = df.groupby(["source", "label"]).size().unstack(fill_value=0)
        source_counts.plot(kind="bar", ax=ax, color=colors, edgecolor="white")
        ax.set_title("Articles by Source and Label", fontsize=16, fontweight="bold")
        ax.set_ylabel("Count")
        ax.legend(["Fake", "Real"])
        ax.spines[["top", "right"]].set_visible(False)
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUTS_DIR, "source_distribution.png"), dpi=150)
        plt.close()
        print("  Saved: source_distribution.png")

    print("  [EDA] Done!")


# ============================================================================
# Baseline Model — TF-IDF + Logistic Regression
# ============================================================================

def train_baseline(df):
    """Train TF-IDF + Logistic Regression baseline."""
    print("\n" + "=" * 60)
    print("BASELINE MODEL — TF-IDF + Logistic Regression")
    print("=" * 60)

    X = df["text_clean"]
    y = df["label"]

    # Train/test split (80/20, stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n  Train: {len(X_train)}, Test: {len(X_test)}")

    # TF-IDF Vectorization
    print("  Vectorizing with TF-IDF (max_features=10000, ngrams=(1,2))...")
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.95,
        sublinear_tf=True,
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    # Train Logistic Regression
    print("  Training Logistic Regression (class_weight=balanced)...")
    model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        C=1.0,
        random_state=42,
    )
    model.fit(X_train_tfidf, y_train)

    # Predict
    y_pred = model.predict(X_test_tfidf)
    y_prob = model.predict_proba(X_test_tfidf)[:, 1]

    # Evaluate
    metrics = evaluate_model(y_test, y_pred, y_prob, "baseline")

    # Save model artifacts
    baseline_dir = os.path.join(MODEL_DIR, "baseline")
    pickle.dump(model, open(os.path.join(baseline_dir, "model.pkl"), "wb"))
    pickle.dump(vectorizer, open(os.path.join(baseline_dir, "vectorizer.pkl"), "wb"))

    # Also save to model/ root for backward compatibility
    pickle.dump(model, open(os.path.join(MODEL_DIR, "model.pkl"), "wb"))
    pickle.dump(vectorizer, open(os.path.join(MODEL_DIR, "vectorizer.pkl"), "wb"))

    print(f"\n  Model saved to: {baseline_dir}/")
    return model, vectorizer, X_test, y_test, metrics


# ============================================================================
# Transformer Model — DistilBERT / BioBERT
# ============================================================================

def train_transformer(df, epochs=2, use_biobert=False, max_samples=800):
    """Fine-tune a transformer model for health misinformation detection using PyTorch."""
    print("\n" + "=" * 60)
    print("TRANSFORMER MODEL — " + ("BioBERT" if use_biobert else "DistilBERT"))
    
    print("=" * 60)

    try:
        import torch
        from torch.utils.data import Dataset, DataLoader
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
    except ImportError as e:
        print(f"\n  [ERROR] PyTorch or Transformers missing: {e}")
        return None, None, None, None, None

    model_name = "dmis-lab/biobert-base-cased-v1.2" if use_biobert else "distilbert-base-uncased"
    print(f"\n  Model: {model_name}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"  Device: {device}")

    # Stratified subset for efficient CPU fine-tuning if requested
    if max_samples and len(df) > max_samples:
        n_per_class = max_samples // 2
        df_fake = df[df["label"] == 0].sample(min(n_per_class, (df["label"] == 0).sum()), random_state=42)
        df_real = df[df["label"] == 1].sample(min(n_per_class, (df["label"] == 1).sum()), random_state=42)
        df_sub = pd.concat([df_fake, df_real]).sample(frac=1.0, random_state=42).reset_index(drop=True)
        print(f"  [SUBSET] Using balanced sample of {len(df_sub)} articles ({len(df_fake)} fake, {len(df_real)} real)")
    else:
        df_sub = df

    # Split data (80% train, 20% test)
    X = df_sub["text_clean"]
    y = df_sub["label"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"  Train samples: {len(X_train)} | Test samples: {len(X_test)}")

    # Tokenize
    print("  Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    class HealthNewsTorchDataset(Dataset):
        def __init__(self, texts, labels, max_len=128):
            self.encodings = tokenizer(
                texts.tolist(),
                padding="max_length",
                truncation=True,
                max_length=max_len,
                return_tensors="pt"
            )
            self.labels = torch.tensor(labels.tolist(), dtype=torch.long)

        def __len__(self):
            return len(self.labels)

        def __getitem__(self, idx):
            item = {key: val[idx] for key, val in self.encodings.items()}
            item["labels"] = self.labels[idx]
            return item

    print("  Tokenizing datasets...")
    train_ds = HealthNewsTorchDataset(X_train, y_train)
    test_ds = HealthNewsTorchDataset(X_test, y_test)

    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False)

    # Load model
    print("  Loading classification model...")
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=2,
        id2label={0: "FAKE", 1: "REAL"},
        label2id={"FAKE": 0, "REAL": 1},
    )
    model.to(device)

    # Optimizer
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-5, weight_decay=0.01)

    # Training loop
    bert_dir = os.path.join(MODEL_DIR, "bert")
    os.makedirs(bert_dir, exist_ok=True)

    print(f"\n  Training for {epochs} epochs...")
    train_losses = []
    model.train()

    for epoch in range(epochs):
        epoch_loss = 0.0
        step_count = 0
        for step, batch in enumerate(train_loader):
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()
            step_count += 1
            train_losses.append(loss.item())

            if (step + 1) % 10 == 0 or (step + 1) == len(train_loader):
                print(f"    Epoch {epoch + 1}/{epochs} | Step {step + 1}/{len(train_loader)} | Batch Loss: {loss.item():.4f}")

        avg_loss = epoch_loss / max(1, step_count)
        print(f"  [Epoch {epoch + 1} Complete] Average Loss: {avg_loss:.4f}")

    # Save model and tokenizer
    print(f"\n  Saving trained transformer to {bert_dir}...")
    model.save_pretrained(bert_dir)
    tokenizer.save_pretrained(bert_dir)
    print(f"  Model successfully saved to: {bert_dir}/")

    # Evaluation
    print("\n  Evaluating on held-out test set...")
    model.eval()
    all_preds = []
    all_probs = []

    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)
            preds = torch.argmax(probs, dim=-1)

            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs[:, 1].cpu().numpy())

    y_pred = np.array(all_preds)
    y_prob = np.array(all_probs)

    metrics = evaluate_model(y_test.values, y_pred, y_prob, "bert")

    # Plot training loss curve
    if train_losses:
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.plot(train_losses, color="#06b6d4", linewidth=2)
        ax.set_title("DistilBERT Transformer Training Loss Curve", fontsize=15, fontweight="bold")
        ax.set_xlabel("Training Step", fontsize=12)
        ax.set_ylabel("Loss", fontsize=12)
        ax.spines[["top", "right"]].set_visible(False)
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUTS_DIR, "training_loss_curve.png"), dpi=150)
        plt.close()
        print("  Saved: training_loss_curve.png")

    return model, tokenizer, X_test, y_test, metrics


# ============================================================================
# Evaluation
# ============================================================================

def evaluate_model(y_true, y_pred, y_prob, model_name):
    """Calculate and visualize evaluation metrics."""
    print(f"\n  {'=' * 40}")
    print(f"  EVALUATION — {model_name.upper()}")
    print(f"  {'=' * 40}")

    # Metrics
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="macro")
    rec = recall_score(y_true, y_pred, average="macro")
    f1 = f1_score(y_true, y_pred, average="macro")

    try:
        auc = roc_auc_score(y_true, y_prob)
    except ValueError:
        auc = 0.0

    metrics = {
        "model": model_name,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
    }

    print(f"\n  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {auc:.4f}")

    # Classification report
    report = classification_report(y_true, y_pred, target_names=["Fake", "Real"])
    print(f"\n{report}")

    report_path = os.path.join(OUTPUTS_DIR, f"classification_report_{model_name}.txt")
    with open(report_path, "w") as f:
        f.write(f"Classification Report — {model_name.upper()}\n")
        f.write("=" * 50 + "\n\n")
        f.write(report)
        f.write(f"\nAccuracy:  {acc:.4f}\n")
        f.write(f"ROC-AUC:   {auc:.4f}\n")
    print(f"  Saved: classification_report_{model_name}.txt")

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=["Fake", "Real"],
        yticklabels=["Fake", "Real"],
        ax=ax, linewidths=2, linecolor="white",
        annot_kws={"size": 18, "fontweight": "bold"},
    )
    ax.set_title(f"Confusion Matrix  ({model_name.upper()})",
                 fontsize=16, fontweight="bold")
    ax.set_xlabel("Predicted", fontsize=13)
    ax.set_ylabel("Actual", fontsize=13)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUTS_DIR, f"confusion_matrix_{model_name}.png"), dpi=150)
    plt.close()
    print(f"  Saved: confusion_matrix_{model_name}.png")

    # ROC Curve
    if auc > 0:
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.plot(fpr, tpr, color="#06b6d4", linewidth=2.5,
                label=f"{model_name} (AUC = {auc:.4f})")
        ax.plot([0, 1], [0, 1], "k--", alpha=0.5)
        ax.set_title(f"ROC Curve  ({model_name.upper()})",
                     fontsize=16, fontweight="bold")
        ax.set_xlabel("False Positive Rate", fontsize=12)
        ax.set_ylabel("True Positive Rate", fontsize=12)
        ax.legend(fontsize=12)
        ax.spines[["top", "right"]].set_visible(False)
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUTS_DIR, f"roc_curve_{model_name}.png"), dpi=150)
        plt.close()
        print(f"  Saved: roc_curve_{model_name}.png")

    # Save metrics to JSON
    metrics_path = os.path.join(OUTPUTS_DIR, f"metrics_{model_name}.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Saved: metrics_{model_name}.json")

    return metrics


def compare_models():
    """Generate comparison charts if both models have been trained."""
    baseline_path = os.path.join(OUTPUTS_DIR, "metrics_baseline.json")
    bert_path = os.path.join(OUTPUTS_DIR, "metrics_bert.json")

    if not os.path.exists(baseline_path) or not os.path.exists(bert_path):
        print("\n  [SKIP] Need both baseline and bert metrics for comparison")
        return

    with open(baseline_path) as f:
        baseline = json.load(f)
    with open(bert_path) as f:
        bert = json.load(f)

    # Comparison bar chart
    metric_names = ["accuracy", "precision", "recall", "f1_score", "roc_auc"]
    baseline_vals = [baseline[m] for m in metric_names]
    bert_vals = [bert[m] for m in metric_names]

    fig, ax = plt.subplots(figsize=(12, 6))
    x = np.arange(len(metric_names))
    width = 0.35

    bars1 = ax.bar(x - width / 2, baseline_vals, width, label="Baseline (TF-IDF + LR)",
                   color="#8b5cf6", edgecolor="white", linewidth=2)
    bars2 = ax.bar(x + width / 2, bert_vals, width, label="Transformer (DistilBERT)",
                   color="#06b6d4", edgecolor="white", linewidth=2)

    ax.set_xlabel("Metric", fontsize=12)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_title("Baseline vs Transformer  Model Comparison",
                 fontsize=16, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("_", " ").title() for m in metric_names], fontsize=11)
    ax.set_ylim(0, 1.1)
    ax.legend(fontsize=12)
    ax.spines[["top", "right"]].set_visible(False)

    # Add value labels
    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                f"{bar.get_height():.3f}", ha="center", fontsize=9)
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                f"{bar.get_height():.3f}", ha="center", fontsize=9)

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUTS_DIR, "model_comparison.png"), dpi=150)
    plt.close()
    print("\n  Saved: model_comparison.png")

    # Combined metrics JSON
    combined = {"baseline": baseline, "transformer": bert}
    with open(os.path.join(OUTPUTS_DIR, "metrics.json"), "w") as f:
        json.dump(combined, f, indent=2)
    print("  Saved: metrics.json (combined)")


# ============================================================================
# SHAP Explainability
# ============================================================================

def run_shap_explanation(model, vectorizer, df, model_name="baseline"):
    """Generate SHAP explanations for the baseline model."""
    print("\n" + "=" * 60)
    print("SHAP EXPLAINABILITY")
    print("=" * 60)

    try:
        import shap
    except ImportError:
        print("  [ERROR] shap not installed. Run: pip install shap")
        return

    X = df["text_clean"]
    y = df["label"]

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    if model_name == "baseline":
        print("\n  Computing SHAP values for baseline model...")
        X_test_tfidf = vectorizer.transform(X_test)

        # Use a sample for speed
        sample_size = min(100, X_test_tfidf.shape[0])
        X_sample = X_test_tfidf[:sample_size]

        # Use LinearExplainer for logistic regression
        explainer = shap.LinearExplainer(model, X_sample, feature_perturbation="interventional")
        shap_values = explainer.shap_values(X_sample)

        # Feature names
        feature_names = vectorizer.get_feature_names_out()

        # Summary plot
        print("  Generating SHAP summary plot...")
        fig, ax = plt.subplots(figsize=(12, 8))
        shap.summary_plot(
            shap_values, X_sample.toarray(),
            feature_names=feature_names,
            max_display=20,
            show=False,
        )
        plt.title("SHAP Feature Importance — Top 20 Words",
                   fontsize=14, fontweight="bold")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUTS_DIR, "shap_summary.png"), dpi=150, bbox_inches="tight")
        plt.close()
        print("  Saved: shap_summary.png")

        # Bar plot — mean absolute SHAP values
        fig, ax = plt.subplots(figsize=(12, 8))
        shap.summary_plot(
            shap_values, X_sample.toarray(),
            feature_names=feature_names,
            max_display=20,
            plot_type="bar",
            show=False,
        )
        plt.title("Mean |SHAP| Feature Importance",
                   fontsize=14, fontweight="bold")
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUTS_DIR, "shap_bar.png"), dpi=150, bbox_inches="tight")
        plt.close()
        print("  Saved: shap_bar.png")

        # Save top features to JSON for the frontend
        mean_shap = np.abs(shap_values).mean(axis=0)
        top_indices = np.argsort(mean_shap)[-30:][::-1]
        top_features = {
            feature_names[i]: float(mean_shap[i]) for i in top_indices
        }
        with open(os.path.join(OUTPUTS_DIR, "shap_top_features.json"), "w") as f:
            json.dump(top_features, f, indent=2)
        print("  Saved: shap_top_features.json")

    print("\n  [SHAP] Done!")


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="HealthGuard AI — Training Pipeline")
    parser.add_argument("--data", type=str, default="data/health_news.csv",
                        help="Path to the dataset CSV (columns: text, label)")
    parser.add_argument("--model", type=str, choices=["baseline", "bert"], default=None,
                        help="Model to train: 'baseline' (TF-IDF+LR) or 'bert' (DistilBERT)")
    parser.add_argument("--epochs", type=int, default=2,
                        help="Number of training epochs for transformer (default: 2)")
    parser.add_argument("--max-samples", type=int, default=800,
                        help="Max balanced samples for training to optimize training speed (default: 800)")
    parser.add_argument("--biobert", action="store_true",
                        help="Use BioBERT instead of DistilBERT")
    parser.add_argument("--eda", action="store_true",
                        help="Run EDA visualizations only")
    parser.add_argument("--explain", action="store_true",
                        help="Run SHAP explainability after training")
    parser.add_argument("--compare", action="store_true",
                        help="Generate model comparison charts")
    args = parser.parse_args()

    # Resolve data path
    data_path = args.data
    if not os.path.isabs(data_path):
        data_path = os.path.join(PROJECT_DIR, data_path)

    print("=" * 60)
    print("  HealthGuard AI — Health Misinformation Detection")
    print("=" * 60)

    # Load data
    df = load_and_preprocess(data_path)

    # EDA
    if args.eda:
        run_eda(df)

    # Train baseline
    if args.model == "baseline":
        model, vectorizer, X_test, y_test, metrics = train_baseline(df)

        if args.explain:
            run_shap_explanation(model, vectorizer, df)

    # Train transformer
    elif args.model == "bert":
        model, tokenizer, X_test, y_test, metrics = train_transformer(
            df, epochs=args.epochs, use_biobert=args.biobert, max_samples=args.max_samples
        )

    # Compare models if requested or if both metrics exist
    if args.compare or os.path.exists(os.path.join(OUTPUTS_DIR, "metrics_baseline.json")):
        compare_models()

    print("\n" + "=" * 60)
    print("  Pipeline complete!")
    print(f"  Outputs saved to: {OUTPUTS_DIR}/")
    print("=" * 60)


if __name__ == "__main__":
    main()
