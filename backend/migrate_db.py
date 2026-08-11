import sqlite3
import os

def run_migrations(db_name='sih.db'):
    print(f"Migrating database: {db_name}...")
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    # 1. Helper to safely add column if not exists
    def add_col(table, col, col_type):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            print(f"Added {col} to {table}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                pass
            else:
                print(f"Error adding {col} to {table}: {e}")

    # Add columns to users
    add_col("users", "status", "TEXT NOT NULL DEFAULT 'ACTIVE'")
    add_col("users", "college", "TEXT")
    
    # Add columns to coordinator_profiles
    add_col("coordinator_profiles", "designation", "TEXT")
    add_col("coordinator_profiles", "college", "TEXT NOT NULL DEFAULT 'Narasaraopeta Engineering College (Autonomous), Narasaraopeta'")
    
    # Add columns to judge_profiles
    add_col("judge_profiles", "phone", "TEXT")
    add_col("judge_profiles", "expertise", "TEXT")
    add_col("judge_profiles", "college", "TEXT NOT NULL DEFAULT 'Narasaraopeta Engineering College (Autonomous), Narasaraopeta'")
    
    # Add columns to problem_statements
    add_col("problem_statements", "external_id", "TEXT")
    add_col("problem_statements", "type", "TEXT")
    add_col("problem_statements", "technology", "TEXT")
    add_col("problem_statements", "source", "TEXT DEFAULT 'Official SIH'")
    add_col("problem_statements", "source_url", "TEXT")
    add_col("problem_statements", "source_edition", "TEXT DEFAULT '2026'")
    add_col("problem_statements", "status", "TEXT NOT NULL DEFAULT 'ACTIVE'")
    add_col("problem_statements", "version", "INTEGER NOT NULL DEFAULT 1")
    add_col("problem_statements", "first_seen_at", "DATETIME")
    add_col("problem_statements", "last_seen_at", "DATETIME")
    add_col("problem_statements", "created_at", "DATETIME")
    add_col("problem_statements", "updated_at", "DATETIME")
    
    # Add column to submissions
    add_col("submissions", "problem_statement_version_id", "INTEGER")
    
    # Add column to audit_logs
    add_col("audit_logs", "college", "TEXT")
    
    # Create new tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS spoc_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        phone TEXT,
        college TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS invitation_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_problem_statements (
        event_id INTEGER NOT NULL,
        problem_statement_id INTEGER NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        local_notes TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (event_id, problem_statement_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (problem_statement_id) REFERENCES problem_statements(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS problem_statement_sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        fetched INTEGER NOT NULL DEFAULT 0,
        created INTEGER NOT NULL DEFAULT 0,
        updated INTEGER NOT NULL DEFAULT 0,
        unavailable INTEGER NOT NULL DEFAULT 0,
        duration REAL NOT NULL DEFAULT 0.0,
        triggered_by TEXT NOT NULL,
        error_message TEXT
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS problem_statement_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_statement_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        organization TEXT NOT NULL,
        theme TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT,
        technology TEXT,
        expected_solution TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_statement_id) REFERENCES problem_statements(id) ON DELETE CASCADE
    )
    """)
    
    # Backfill external_id with problem_id
    cursor.execute("UPDATE problem_statements SET external_id = problem_id WHERE external_id IS NULL")
    
    # Backfill timestamps
    cursor.execute("UPDATE problem_statements SET first_seen_at = CURRENT_TIMESTAMP WHERE first_seen_at IS NULL")
    cursor.execute("UPDATE problem_statements SET last_seen_at = CURRENT_TIMESTAMP WHERE last_seen_at IS NULL")
    cursor.execute("UPDATE problem_statements SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
    cursor.execute("UPDATE problem_statements SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL")
    
    # Backfill college on existing coordinator and judge profiles
    cursor.execute("UPDATE users SET college = 'Narasaraopeta Engineering College (Autonomous), Narasaraopeta' WHERE role IN ('student', 'coordinator', 'judge') AND college IS NULL")
    
    conn.commit()
    conn.close()
    print(f"Database migrations applied successfully to {db_name}!")

if __name__ == "__main__":
    run_migrations('sih.db')
    if os.path.exists('test_sih.db'):
        run_migrations('test_sih.db')
