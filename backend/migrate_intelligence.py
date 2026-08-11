import os
from sqlalchemy import create_engine
from app.database import Base

def run_migration(db_url: str):
    print(f"Migrating database: {db_url}")
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    print("Migration complete!")

if __name__ == "__main__":
    # Migrate production DB
    run_migration("sqlite:///./sih.db")
    
    # Migrate test DB
    run_migration("sqlite:///./test_sih.db")
