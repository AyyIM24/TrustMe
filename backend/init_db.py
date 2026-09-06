"""
TrustMe AI — MySQL Database Initialization & Management Script
Creates the MySQL database, tables, indexes, and seeds initial data.
"""

import sys
import os
from urllib.parse import urlparse, unquote

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from database import engine, Base
import models
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker
import pymysql


def parse_database_url(url: str):
    """Parse SQLAlchemy MySQL database URL into connection parameters."""
    # Standard format: mysql+pymysql://user:password@host:port/dbname
    cleaned_url = url.replace("mysql+pymysql://", "http://").replace("mysql://", "http://")
    parsed = urlparse(cleaned_url)

    user = unquote(parsed.username or "root")
    password = unquote(parsed.password or "")
    host = parsed.hostname or "localhost"
    port = parsed.port or 3306
    dbname = (parsed.path or "/trustme_db").lstrip("/")

    return {
        "user": user,
        "password": password,
        "host": host,
        "port": port,
        "dbname": dbname
    }


def init_database():
    """Create database, all tables, and seed initial demo data."""
    print("=" * 60)
    print("  TrustMe AI — MySQL Database Initialization Utility")
    print("=" * 60)

    params = parse_database_url(settings.DATABASE_URL)
    print(f"\n[1/4] Connecting to MySQL server at {params['host']}:{params['port']} as '{params['user']}'...")

    try:
        # Step 1: Connect to server without specific database to create DB if missing
        conn = pymysql.connect(
            host=params["host"],
            port=params["port"],
            user=params["user"],
            password=params["password"],
            charset="utf8mb4"
        )
        with conn.cursor() as cursor:
            print(f"      Ensuring database '{params['dbname']}' exists...")
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{params['dbname']}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
            conn.commit()
        conn.close()
        print(f"      [OK] Database '{params['dbname']}' ready.")
    except Exception as e:
        print(f"\n[ERROR] Could not connect to MySQL server:\n{e}")
        print("\nTroubleshooting Tips:")
        print("  1. Verify your MySQL service is running (e.g. via Windows Services or XAMPP).")
        print("  2. Check backend/.env to confirm username, password, host, and port.")
        sys.exit(1)

    # Step 2: Create all tables via SQLAlchemy
    print(f"\n[2/4] Synchronizing SQLAlchemy models and creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"      [OK] Detected {len(tables)} tables: {', '.join(tables)}")
    except Exception as e:
        print(f"\n[ERROR] Failed to synchronize tables: {e}")
        sys.exit(1)

    # Step 3: Seed demo user and initial data
    print(f"\n[3/4] Checking and seeding baseline records...")
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        from models.user import User
        from models.trending import TrendingTopic
        from services.auth_service import hash_password

        # Demo user
        demo_user = session.query(User).filter_by(username="demo_user").first()
        if not demo_user:
            demo_user = User(
                username="demo_user",
                email="demo@trustme.ai",
                password_hash=hash_password("Password123!"),
                role="user",
                is_active=True
            )
            session.add(demo_user)
            print("      [SEED] Created default demo user ('demo_user' / 'Password123!')")
        else:
            print("      [INFO] Demo user 'demo_user' already exists.")

        # Seed trending healthcare topics if empty
        topic_count = session.query(TrendingTopic).count()
        if topic_count == 0:
            sample_topics = [
                {"keyword": "mRNA Vaccine Immunity", "fake_count": 12, "real_count": 89},
                {"keyword": "Miracle Fruit Cancer Cure", "fake_count": 64, "real_count": 3},
                {"keyword": "Colloidal Silver Detox", "fake_count": 41, "real_count": 2},
                {"keyword": "Intermittent Fasting & Longevity", "fake_count": 8, "real_count": 52},
                {"keyword": "Alkaline Water Health Benefits", "fake_count": 35, "real_count": 9},
                {"keyword": "Vitamin D & Respiratory Health", "fake_count": 14, "real_count": 78},
            ]
            for t in sample_topics:
                session.add(TrendingTopic(**t))
            print(f"      [SEED] Seeded {len(sample_topics)} clinical trending topics.")
        else:
            print(f"      [INFO] Trending topics already populated ({topic_count} topics).")

        session.commit()
    except Exception as e:
        session.rollback()
        print(f"      [WARN] Seeding encountered notice: {e}")
    finally:
        session.close()

    # Step 4: Summary audit
    print(f"\n[4/4] Verifying database metrics...")
    inspector = inspect(engine)
    session = Session()
    try:
        for tbl in inspector.get_table_names():
            row_count = session.execute(text(f"SELECT COUNT(*) FROM `{tbl}`")).scalar()
            print(f"      - Table '{tbl}': {row_count} records")
    finally:
        session.close()

    print("\n" + "=" * 60)
    print("  [SUCCESS] TrustMe AI MySQL Database Initialized!")
    print(f"  Target Database: {params['dbname']}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    init_database()
