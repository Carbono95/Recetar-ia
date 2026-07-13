def recipe_payload(category_id, title="Receta favorita"):
    return {
        "title": title,
        "time_min": 15,
        "difficulty": "facil",
        "category_id": category_id,
        "ingredients": [{"ingredient_name": "Limón", "quantity": "1", "unit": "unidad"}],
    }


def test_deleting_recipe_cascades_favorite_rows(client, auth_headers, category, db_session):
    """Regresión: sin PRAGMA foreign_keys=ON, SQLite dejaba filas de favorites huérfanas."""
    from app.models.favorite import Favorite

    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]
    client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)

    client.delete(f"/api/v1/recipes/{recipe_id}", headers=headers)

    remaining = db_session.query(Favorite).filter(Favorite.recipe_id == recipe_id).count()
    assert remaining == 0


def test_new_recipe_is_not_favorite_by_default(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)

    assert created.json()["is_favorite"] is False


def test_add_favorite(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]

    response = client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)

    assert response.status_code == 200
    assert response.json()["is_favorite"] is True


def test_add_favorite_is_idempotent(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]

    first = client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)
    second = client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["is_favorite"] is True


def test_remove_favorite(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]
    client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)

    delete_response = client.delete(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)
    get_response = client.get(f"/api/v1/recipes/{recipe_id}", headers=headers)

    assert delete_response.status_code == 204
    assert get_response.json()["is_favorite"] is False


def test_remove_favorite_is_idempotent(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]

    response = client.delete(f"/api/v1/recipes/{recipe_id}/favorite", headers=headers)

    assert response.status_code == 204


def test_favorites_are_per_user(client, auth_headers, category):
    owner_headers = auth_headers("owner")
    other_headers = auth_headers("other")
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=owner_headers)
    recipe_id = created.json()["id"]

    client.post(f"/api/v1/recipes/{recipe_id}/favorite", headers=owner_headers)

    owner_view = client.get(f"/api/v1/recipes/{recipe_id}", headers=owner_headers)
    other_view = client.get(f"/api/v1/recipes/{recipe_id}", headers=other_headers)

    assert owner_view.json()["is_favorite"] is True
    assert other_view.json()["is_favorite"] is False


def test_list_favorites_only(client, auth_headers, category):
    headers = auth_headers()
    favorite = client.post("/api/v1/recipes", json=recipe_payload(category.id, "Favorita"), headers=headers)
    client.post("/api/v1/recipes", json=recipe_payload(category.id, "No favorita"), headers=headers)
    client.post(f"/api/v1/recipes/{favorite.json()['id']}/favorite", headers=headers)

    response = client.get("/api/v1/recipes?favorites_only=true", headers=headers)

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == favorite.json()["id"]
