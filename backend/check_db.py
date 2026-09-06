import sys
import os
from sqlalchemy import create_engine
from config import settings

print("Testing database connection to:", settings.DATABASE_URL)
try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("[SUCCESS] Connected to MySQL database! Connection validated.")
except Exception as e:
    print("\n[ERROR] DATABASE CONNECTION FAILED:")
    print(str(e))
    print("\nTroubleshooting steps:")
    print("1. Open backend/.env")
    print("2. Update DATABASE_URL to include your password:")
    print("   Example: mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/fakeshield")
    print("3. Ensure your MySQL server is running locally on port 3306")
    print("4. Ensure the database 'fakeshield' is created or run: CREATE DATABASE fakeshield;")
    sys.exit(1)
