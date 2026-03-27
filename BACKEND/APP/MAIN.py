"""
CIVICLENS AI MAIN BACKEND ENTRY POINT
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from APP.API import HEALTH, COMPLAINTS, DASHBOARD, ANALYSIS, AUTH, NOTIFICATIONS, ADMIN
from APP.CORE.CONFIG import settings
from APP.CORE.DATABASE import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered grievance intelligence platform for digital governance",
    version=settings.APP_VERSION,
)

allowed_origins = ["*"] if settings.FRONTEND_URL == "*" else [settings.FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(HEALTH.router, prefix="/api/health", tags=["Health"])
app.include_router(COMPLAINTS.router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(DASHBOARD.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ANALYSIS.router, prefix="/api/analyze", tags=["AI Analysis"])
app.include_router(AUTH.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(NOTIFICATIONS.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(ADMIN.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "status": "running",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }