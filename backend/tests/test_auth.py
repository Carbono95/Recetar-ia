def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "user1", "password": "supersecret"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["username"] == "user1"
    assert body["user"]["role"] == "user"
    assert body["tokens"]["access_token"]
    assert body["tokens"]["refresh_token"]


def test_register_invalid_username(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "user with spaces", "password": "supersecret"},
    )

    assert response.status_code == 422


def test_get_me(client):
    register = client.post(
        "/api/v1/auth/register", json={"username": "me_user", "password": "supersecret"}
    )
    access_token = register.json()["tokens"]["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    assert response.json()["username"] == "me_user"


def test_get_me_requires_auth(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_register_duplicate_username(client):
    payload = {"username": "duplicate_user", "password": "supersecret"}
    client.post("/api/v1/auth/register", json=payload)

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422


def test_register_weak_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "weak_user", "password": "short"},
    )

    assert response.status_code == 422


def test_login_success(client):
    payload = {"username": "login_user", "password": "supersecret"}
    client.post("/api/v1/auth/register", json=payload)

    response = client.post("/api/v1/auth/login", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["refresh_token"]


def test_login_invalid_username(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "missing_user", "password": "supersecret"},
    )

    assert response.status_code == 401


def test_login_invalid_password(client):
    payload = {"username": "wrongpass_user", "password": "supersecret"}
    client.post("/api/v1/auth/register", json=payload)

    response = client.post(
        "/api/v1/auth/login",
        json={"username": payload["username"], "password": "incorrect"},
    )

    assert response.status_code == 401


def test_refresh_token(client):
    payload = {"username": "refresh_user", "password": "supersecret"}
    register_response = client.post("/api/v1/auth/register", json=payload)
    refresh_token = register_response.json()["tokens"]["refresh_token"]

    response = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert response.json()["access_token"]
