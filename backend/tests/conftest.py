import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.main import app
import os

TEST_DATABASE_URL = "sqlite:///./test_manufacturing.db"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    # Seed admin user and roles
    db = TestingSessionLocal()
    from app.models.user import User, Role

    admin_role = Role(name="admin", description="Administrator")
    quality_role = Role(name="quality_engineer", description="Quality Lead")
    db.add(admin_role)
    db.add(quality_role)
    db.commit()

    admin_user = User(
        email="testadmin@manufacturing.com",
        full_name="Test Administrator",
        hashed_password=get_password_hash("TestAdmin@123"),
        is_active=True,
    )
    admin_user.roles.append(admin_role)
    db.add(admin_user)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_manufacturing.db"):
        try:
            os.remove("./test_manufacturing.db")
        except Exception:
            pass


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin@manufacturing.com", "password": "TestAdmin@123"},
    )
    token = res.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}
