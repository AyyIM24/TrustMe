import re
import nltk

try:
    from nltk.corpus import stopwords
    stopwords.words('english')
except LookupError:
    nltk.download('stopwords', quiet=True)
    from nltk.corpus import stopwords


STOP_WORDS = set(stopwords.words('english'))


def clean_text(text: str) -> str:
    """Clean and preprocess text for ML prediction.
    
    Matches the exact preprocessing used during training:
    - Lowercase
    - Remove non-alphabetic characters
    - Remove stopwords
    """
    text = text.lower()
    text = re.sub(r'[^a-zA-Z]', ' ', text)
    words = text.split()
    words = [word for word in words if word not in STOP_WORDS]
    return " ".join(words)
