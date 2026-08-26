from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ VERY IMPORTANT: Look at the line below! 
# You need to replace YOUR_PASSWORD with the password you created when installing PostgreSQL.

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin123@localhost:5432/farmflow_db"

# This creates the "engine" that actually talks to PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# This creates a "session" (a temporary connection to send/receive data)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is a base class that we will use later to create our database tables
Base = declarative_base()