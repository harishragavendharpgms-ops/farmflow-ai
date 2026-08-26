from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# Automatically creates your database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ==========================================
# CORS CONFIGURATION (Fixes the "undefined" error)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",             # Allows your local frontend testing
        "https://farmflow-ai-beryl.vercel.app",  # Allows your live Vercel frontend (NO trailing slash!)
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers (tokens, content-type, etc.)
)


# Your existing routes/endpoints go here (e.g., registration, login, etc.)
@app.get("/")
def read_root():
    return {"message": "FarmFlow AI Backend is live and running!"}