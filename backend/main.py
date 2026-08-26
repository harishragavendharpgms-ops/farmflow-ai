from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, SessionLocal

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FarmFlow AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# This is a helper function to open and close the database connection safely
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to FarmFlow AI Backend! The brain is working."}

@app.get("/api/test")
def test_api():
    return {"status": "success", "data": "Hello from Python! Backend and Frontend are ready to connect."}

# --- NEW REGISTRATION ENDPOINT ---
@app.post("/api/register")
def register_farmer(farmer: schemas.FarmerCreate, db: Session = Depends(get_db)):
    
    # 1. Check if the email is already registered
    existing_farmer = db.query(models.Farmer).filter(models.Farmer.email == farmer.email).first()
    if existing_farmer:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Create a new Farmer database model
    new_farmer = models.Farmer(
        name=farmer.name,
        email=farmer.email,
        phone=farmer.phone,
        password=farmer.password # In a real app, we encrypt this. We'll keep it simple for now!
    )
    
    # 3. Save to database
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    
    return {"message": "Farmer registered successfully!", "farmer_name": new_farmer.name}
# --- NEW LOGIN ENDPOINT ---
@app.post("/api/login")
def login_farmer(login_data: schemas.FarmerLogin, db: Session = Depends(get_db)):
    
    # 1. Find the farmer by their email
    farmer = db.query(models.Farmer).filter(models.Farmer.email == login_data.email).first()
    
    # 2. Check if the farmer exists AND if the password matches
    if not farmer or farmer.password != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 3. If successful, send their details back to React!
    return {
        "message": "Login successful!",
        "farmer": {
            "name": farmer.name,
            "email": farmer.email,
            "phone": farmer.phone
        }
    }
# --- NEW SCHEDULING ENDPOINT ---
@app.post("/api/schedule")
def schedule_appointment(appt: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    
    # 1. Create a new Appointment record
    new_appt = models.Appointment(
        farmer_email=appt.farmer_email,
        crop_type=appt.crop_type,
        quantity=appt.quantity,
        date=appt.date
    )
    
    # 2. Save it to the database
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    return {
        "message": "Slot booked successfully!", 
        "appointment_id": new_appt.id
    }
# --- NEW ENDPOINT TO FETCH APPOINTMENTS ---
@app.get("/api/appointments")
def get_appointments(email: str, db: Session = Depends(get_db)):
    # Find all appointments that match this farmer's email
    appts = db.query(models.Appointment).filter(models.Appointment.farmer_email == email).all()
    return appts
# --- NEW ENDPOINT FOR MARKET PRICES ---
@app.get("/api/market")
def get_market_prices():
    # In a real app, Python would fetch this from a live government API.
    # For now, we simulate the current market rates!
    return [
        {"id": 1, "crop": "Wheat", "price": 2275, "unit": "Quintal", "trend": "⬆️ Rising"},
        {"id": 2, "crop": "Rice (Paddy)", "price": 2183, "unit": "Quintal", "trend": "⬇️ Falling"},
        {"id": 3, "crop": "Maize", "price": 2090, "unit": "Quintal", "trend": "➡️ Stable"},
        {"id": 4, "crop": "Vegetables", "price": 1850, "unit": "Quintal", "trend": "⬆️ Rising"}
    ]
# --- NEW ENDPOINT FOR MARKET PRICES ---
@app.get("/api/market")
def get_market_prices():
    # In a real app, Python would fetch this from a live government API.
    # For now, we simulate the current market rates!
    return [
        {"id": 1, "crop": "Wheat", "price": 2275, "unit": "Quintal", "trend": "⬆️ Rising"},
        {"id": 2, "crop": "Rice (Paddy)", "price": 2183, "unit": "Quintal", "trend": "⬇️ Falling"},
        {"id": 3, "crop": "Maize", "price": 2090, "unit": "Quintal", "trend": "➡️ Stable"},
        {"id": 4, "crop": "Vegetables", "price": 1850, "unit": "Quintal", "trend": "⬆️ Rising"}
    ]