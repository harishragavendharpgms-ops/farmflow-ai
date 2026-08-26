from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from database import engine, get_db

# Automatically creates your database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ==========================================
# CORS CONFIGURATION (Fixes security block)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                 # Allows local frontend testing
        "https://farmflow-ai-beryl.vercel.app",  # Allows live Vercel frontend (NO trailing slash!)
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# ==========================================
# PYDANTIC MODEL (Defines incoming registration data)
# ==========================================
class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str

# ==========================================
# ROUTES
# ==========================================
@app.get("/")
def read_root():
    return {"message": "FarmFlow AI Backend is live and running!"}

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user with this email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered!"
        )

    # Create new user instance
    new_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password=user.password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "email": new_user.email}