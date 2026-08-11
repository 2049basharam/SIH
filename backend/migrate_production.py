import sqlite3
import os

def migrate():
    db_path = "./sih.db"
    if not os.path.exists(db_path):
        print(f"No sih.db found at {db_path}, skipping migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add columns to 'events' table
    cursor.execute("PRAGMA table_info(events)")
    event_cols = [row[1] for row in cursor.fetchall()]
    
    if "nominations_submitted" not in event_cols:
        print("Adding nominations_submitted column to events table...")
        cursor.execute("ALTER TABLE events ADD COLUMN nominations_submitted BOOLEAN DEFAULT 0 NOT NULL")
        
    if "nominations_approved" not in event_cols:
        print("Adding nominations_approved column to events table...")
        cursor.execute("ALTER TABLE events ADD COLUMN nominations_approved BOOLEAN DEFAULT 0 NOT NULL")
        
    if "nominations_return_reason" not in event_cols:
        print("Adding nominations_return_reason column to events table...")
        cursor.execute("ALTER TABLE events ADD COLUMN nominations_return_reason TEXT")

    # 2. Add columns to 'event_settings' table
    cursor.execute("PRAGMA table_info(event_settings)")
    settings_cols = [row[1] for row in cursor.fetchall()]
    
    if "spoc_approval_required" not in settings_cols:
        print("Adding spoc_approval_required column to event_settings table...")
        cursor.execute("ALTER TABLE event_settings ADD COLUMN spoc_approval_required BOOLEAN DEFAULT 1 NOT NULL")

    # 3. Add columns to 'evaluations' table
    cursor.execute("PRAGMA table_info(evaluations)")
    eval_cols = [row[1] for row in cursor.fetchall()]
    
    if "submission_version" not in eval_cols:
        print("Adding submission_version column to evaluations table...")
        cursor.execute("ALTER TABLE evaluations ADD COLUMN submission_version INTEGER")

    conn.commit()
    conn.close()
    print("Database migration completed successfully.")

if __name__ == "__main__":
    migrate()
