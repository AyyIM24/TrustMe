import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add current path to sys.path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import settings

def run_migration():
    print("[MIGRATION] Connecting to database...")
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # 1. Create user_faces table if not exists
        print("[MIGRATION] Checking user_faces table...")
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS user_faces (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            face_data LONGTEXT NOT NULL,
            CONSTRAINT fk_user_faces_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        session.execute(text(create_table_sql))
        session.commit()
        print("[MIGRATION] user_faces table is ready.")

        # 2. Check if face_data column exists in users table
        print("[MIGRATION] Checking users table columns...")
        columns_result = session.execute(text("SHOW COLUMNS FROM users"))
        columns = [row[0] for row in columns_result.fetchall()]

        if "face_data" in columns:
            print("[MIGRATION] Found face_data column in users. Migrating records...")
            # Query users with face_data
            users_with_face = session.execute(text("SELECT id, face_data FROM users WHERE face_data IS NOT NULL AND face_data != ''")).fetchall()
            print(f"[MIGRATION] Found {len(users_with_face)} records to migrate.")

            migrated_count = 0
            for user_id, face_data in users_with_face:
                # Check if already migrated
                exists = session.execute(
                    text("SELECT 1 FROM user_faces WHERE user_id = :user_id"),
                    {"user_id": user_id}
                ).fetchone()

                if not exists:
                    session.execute(
                        text("INSERT INTO user_faces (user_id, face_data) VALUES (:user_id, :face_data)"),
                        {"user_id": user_id, "face_data": face_data}
                    )
                    migrated_count += 1

            session.commit()
            print(f"[MIGRATION] Successfully migrated {migrated_count} face data entries.")

            # 3. Drop face_data column from users table
            print("[MIGRATION] Dropping face_data column from users table...")
            session.execute(text("ALTER TABLE users DROP COLUMN face_data"))
            session.commit()
            print("[MIGRATION] Successfully dropped face_data column from users table.")
        else:
            print("[MIGRATION] face_data column does not exist in users table (already migrated).")

        print("[MIGRATION] Database migration completed successfully! [OK]")

    except Exception as e:
        session.rollback()
        print(f"[MIGRATION] [ERROR] Migration failed: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    run_migration()
