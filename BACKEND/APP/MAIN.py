"""
CIVICLENS AI
MAIN BACKEND ENTRY POINT

This file initializes the FastAPI application and registers
all API routes used in the CivicLens AI backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from APP.API import HEALTH, COMPLAINTS, DASHBOARD, ANALYSIS, AUTH
from APP.CORE.DATABASE import Base, engine


def ensure_complaint_email_column():
    inspector = inspect(engine)

    if "complaints" not in inspector.get_table_names():
        return

    complaint_columns = {column["name"] for column in inspector.get_columns("complaints")}

    if "email" in complaint_columns:
        return

    with engine.begin() as connection:
        connection.exec_driver_sql("ALTER TABLE complaints ADD COLUMN email VARCHAR(255)")


# Create database tables
Base.metadata.create_all(bind=engine)
ensure_complaint_email_column()

app = FastAPI(
    title="CivicLens AI API",
    description="AI-powered grievance intelligence platform for digital governance",
    version="1.0.0"
)

# Enable CORS so frontend can access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(HEALTH.router, prefix="/api/health", tags=["Health"])
app.include_router(AUTH.router, prefix="/api/auth", tags=["Auth"])
app.include_router(COMPLAINTS.router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(DASHBOARD.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ANALYSIS.router, prefix="/api/analyze", tags=["AI Analysis"])


@app.get("/")
def root():
    """
    Root endpoint to verify backend is running
    """
    return {
        "message": "Welcome to CivicLens AI API",
        "status": "running",
        "version": "1.0.0"
    }
