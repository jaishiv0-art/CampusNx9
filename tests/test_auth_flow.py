import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_registration_and_login_flow():
    # 1. Block ADMIN self-registration
    res_admin = client.post("/auth/register", json={
        "username": "self_admin",
        "password": "password123",
        "email": "admin@cit.ac.in",
        "role": "ADMIN"
    })
    assert res_admin.status_code == 403

    # 2. Register valid FACULTY user
    username = "dr_kavita"
    email = "kavita.sen@cit.ac.in"
    password = "securepass123"
    res_reg = client.post("/auth/register", json={
        "username": username,
        "password": password,
        "email": email,
        "full_name": "Dr. Kavita Sen",
        "role": "FACULTY",
        "department": "ECE"
    })
    assert res_reg.status_code in (200, 409)  # 200 on first run, 409 if already exists

    # 3. Login with username
    res_login_user = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    assert res_login_user.status_code == 200
    data_user = res_login_user.json()
    assert "token" in data_user
    assert data_user["user"]["role"] == "FACULTY"

    # 4. Login with email
    res_login_email = client.post("/auth/login", json={
        "username": email,
        "password": password
    })
    assert res_login_email.status_code == 200
    data_email = res_login_email.json()
    assert data_email["user"]["username"] == username

    # 5. Access /me with token
    token = data_user["token"]
    res_me = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["username"] == username
    assert me_data["role"] == "FACULTY"
    assert me_data["department"] == "ECE"
    assert "timetable.view_own" in me_data["permissions"]

    # 6. Verify demo account login still works
    res_demo = client.post("/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert res_demo.status_code == 200
    assert res_demo.json()["user"]["role"] == "ADMIN"
