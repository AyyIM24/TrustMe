"""
TrustMe AI — MySQL Database Health & Status Checker
Quickly tests MySQL connectivity and reports table counts.
"""

import sys
import os
from sqlalchemy import create_engine, inspect, text
from config import settings

# Mask password in connection string for safe printing
def get_masked_url(url: str) -> str:
    if "@" in url and ":" in url:
        prefix, rest = url.split("@", 1)
        if "://" in prefix:
            proto, creds = prefix.split("://", 1)
            if ":" in creds:
                user = creds.split(":", 1)[0]
                return f"{proto}://{user}:****@{rest}"
    return url

print("=" * 60)
print("  TrustMe AI — MySQL Connection & Health Check")
print("=" * 60)
print(f"Connection URL: {get_masked_url(settings.DATABASE_URL)}")

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        version = conn.execute(text("SELECT VERSION()")).scalar()
        current_db = conn.execute(text("SELECT DATABASE()")).scalar()
        print(f"\n[SUCCESS] Connected to MySQL Server!")
        print(f"  MySQL Version: {version}")
        print(f"  Active Database: {current_db}")

        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\nTables ({len(tables)} detected):")
        for table in sorted(tables):
            count = conn.execute(text(f"SELECT COUNT(*) FROM `{table}`")).scalar()
            print(f"  - {table:<18}: {count} rows")

        print("\nAll database checks passed successfully! [OK]")
        print("=" * 60 + "\n")

except Exception as e:
    print(f"\n[ERROR] DATABASE CONNECTION FAILED:\n{e}")
    print("\nTroubleshooting steps:")
    print("  1. Open backend/.env")
    print("  2. Verify DATABASE_URL format:")
    print("     mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/trustme_db")
    print("  3. Ensure MySQL Server is running locally on port 3306")
    print("  4. To create the database and tables from scratch, run:")
    print("     python backend/init_db.py")
    print("=" * 60 + "\n")
    sys.exit(1)
