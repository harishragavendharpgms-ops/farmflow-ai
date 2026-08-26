from pydantic import BaseModel

# This is our security guard for Registration
class FarmerCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    # This is our security guard for Logging in
class FarmerLogin(BaseModel):
    email: str
    password: str
    # --- NEW APPOINTMENT SCHEMA ---
class AppointmentCreate(BaseModel):
    farmer_email: str
    crop_type: str
    quantity: int
    date: str