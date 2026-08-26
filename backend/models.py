from sqlalchemy import Column, Integer, String
from database import Base

# Our existing Farmer table
class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    password = Column(String) 

# --- NEW APPOINTMENT TABLE ---
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    farmer_email = Column(String, index=True) # To know WHO booked it
    crop_type = Column(String)
    quantity = Column(Integer) # In Quintals
    date = Column(String)