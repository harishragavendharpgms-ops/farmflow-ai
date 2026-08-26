from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Update this URL if you use a hosted PostgreSQL database, or keep SQLite for local/testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./farmflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency used in main.py routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()