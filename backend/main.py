from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- ROUTES ---
@app.get("/")
def read_root():
    return {"message": "FarmFlow AI Backend is live and running!"}

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(name=user.name, email=user.email, phone=user.phone, password=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "email": new_user.email}

@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # 1. Find the user by email
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    # 2. Check if user exists and password matches
    if not existing_user or existing_user.password != user.password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    return {"message": "Login successful", "name": existing_user.name, "email": existing_user.email}