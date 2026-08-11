import sqlite3

def add_column():
    conn = sqlite3.connect('sih.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE announcements ADD COLUMN college TEXT")
        conn.commit()
        print("Successfully added 'college' column to 'announcements' table!")
    except Exception as e:
        print("Column may already exist or error encountered:", e)
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
