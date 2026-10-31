def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_login_success(client):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin@manufacturing.com", "password": "TestAdmin@123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin@manufacturing.com", "password": "WrongPassword"},
    )
    assert res.status_code == 401


def test_get_current_user(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "testadmin@manufacturing.com"
    assert any(r["name"] == "admin" for r in data["roles"])
