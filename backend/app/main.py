import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Import all models to ensure tables are created
import app.models  # noqa

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Manufacturing Defect Traceability and Corrective Action Management System",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Create database tables and seed initial data on startup."""
    Base.metadata.create_all(bind=engine)
    from app.services.seed import seed_initial_data
    seed_initial_data()


app.include_router(api_router, prefix="/api/v1")


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


# Mount production frontend build if available
frontend_dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static")),
    "/app/frontend/dist",
]
frontend_dist = next(
    (p for p in frontend_dist_candidates if os.path.exists(p) and os.path.exists(os.path.join(p, "index.html"))),
    None,
)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    from starlette.exceptions import HTTPException as StarletteHTTPException
    from fastapi.responses import JSONResponse

    @app.exception_handler(StarletteHTTPException)
    async def spa_404_handler(request, exc):
        if exc.status_code == 404 and not request.url.path.startswith("/api"):
            relative_path = request.url.path.lstrip("/")
            file_path = os.path.join(frontend_dist, relative_path)
            if relative_path and os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(frontend_dist, "index.html"))
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
