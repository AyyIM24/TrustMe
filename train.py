import pandas as pd
import re
import nltk

from nltk.corpus import stopwords

nltk.download('stopwords')

# Load dataset
fake = pd.read_csv("data/Fake.csv")
real = pd.read_csv("data/True.csv")

# Add labels
fake["label"] = 0
real["label"] = 1

# Combine data
data = pd.concat([fake, real])
data = data.sample(frac=1)

# Keep only needed column
data = data[["text", "label"]]

# Stopwords
stop_words = set(stopwords.words('english'))

# Cleaning function
def clean_text(text):
    text = text.lower()  # lowercase
    text = re.sub(r'[^a-zA-Z]', ' ', text)  # remove symbols
    words = text.split()
    words = [word for word in words if word not in stop_words]
    return " ".join(words)

# Apply cleaning
data["text"] = data["text"].apply(clean_text)

# Show result
print(data.head())

from sklearn.feature_extraction.text import TfidfVectorizer

# Convert text to numbers
vectorizer = TfidfVectorizer(max_features=5000)

X = vectorizer.fit_transform(data["text"]).toarray()
y = data["label"]

print("Shape of X:", X.shape)

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Split data into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create model
model = LogisticRegression()

# Train model
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)
print("Accuracy:", accuracy)

def predict_news(news):
    # Clean input
    news = clean_text(news)
    
    # Convert to vector
    vector = vectorizer.transform([news]).toarray()
    
    # Predict
    result = model.predict(vector)
    
    if result[0] == 0:
        print("Fake News ❌")
    else:
        print("Real News ✅")


# Test with custom input
user_input = input("Enter news: ")
predict_news(user_input)

import pickle

pickle.dump(model, open("model/model.pkl", "wb"))
pickle.dump(vectorizer, open("model/vectorizer.pkl", "wb"))

print("Model saved ✅")