from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from APP.API import ANALYSIS, COMPLAINTS, DASHBOARD, FORWARDING, HEALTH, INSIGHTS, NOTIFICATIONS, TRACKING
from APP.CORE.DATABASE import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CivicLens AI API",
    description="AI-powered grievance intelligence platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(HEALTH.router, prefix="/api/health", tags=["Health"])
app.include_router(COMPLAINTS.router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(DASHBOARD.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ANALYSIS.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(TRACKING.router, prefix="/api/tracking", tags=["Tracking"])
app.include_router(NOTIFICATIONS.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(FORWARDING.router, prefix="/api/forwarding", tags=["Forwarding"])
app.include_router(INSIGHTS.router, prefix="/api/insights", tags=["Insights"])


@app.get("/")
def root():
    return {
        "message": "Welcome to CivicLens AI API",
        "status": "running",
    }