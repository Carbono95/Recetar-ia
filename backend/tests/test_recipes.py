def recipe_payload(category_id, **overrides):
    payload = {
        "title": "Tortilla de patatas",
        "description": "Clásica",
        "time_min": 30,
        "difficulty": "media",
        "category_id": category_id,
        "ingredients": [
            {"ingredient_name": "Patata", "quantity": "4", "unit": "unidades"},
            {"ingredient_name": "Huevo", "quantity": "6", "unit": "unidades"},
        ],
    }
    payload.update(overrides)
    return payload


def test_create_recipe_success(client, auth_headers, category):
    response = client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id),
        headers=auth_headers(),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Tortilla de patatas"
    assert body["category_id"] == category.id
    ingredient_names = {item["ingredient_name"] for item in body["ingredients"]}
    assert ingredient_names == {"patata", "huevo"}  # normalizados a minúsculas


def test_create_recipe_requires_auth(client, category):
    response = client.post("/api/v1/recipes", json=recipe_payload(category.id))

    assert response.status_code == 401


def test_create_recipe_invalid_category(client, auth_headers):
    response = client.post(
        "/api/v1/recipes",
        json=recipe_payload(category_id=9999),
        headers=auth_headers(),
    )

    assert response.status_code == 422


def test_create_recipe_deduplicates_ingredients(client, auth_headers, category):
    headers = auth_headers()
    client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id, title="Receta 1", ingredients=[{"ingredient_name": "Tomate", "quantity": "2", "unit": "unidades"}]),
        headers=headers,
    )
    client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id, title="Receta 2", ingredients=[{"ingredient_name": "  tomate ", "quantity": "3", "unit": "unidades"}]),
        headers=headers,
    )

    response = client.get("/api/v1/ingredients?q=tomate", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_recipes_is_shared_across_users(client, auth_headers, category):
    owner_headers = auth_headers("owner")
    other_headers = auth_headers("other")
    client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=owner_headers)

    owner_list = client.get("/api/v1/recipes", headers=owner_headers)
    other_list = client.get("/api/v1/recipes", headers=other_headers)

    assert owner_list.json()["total"] == 1
    assert other_list.json()["total"] == 1  # recetario compartido: cualquiera ve todas las recetas


def test_get_recipe_not_found(client, auth_headers):
    response = client.get("/api/v1/recipes/999", headers=auth_headers())

    assert response.status_code == 404


def test_get_recipe_allowed_for_other_user(client, auth_headers, category):
    owner_headers = auth_headers("owner2")
    other_headers = auth_headers("other2")
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=owner_headers)
    recipe_id = created.json()["id"]

    response = client.get(f"/api/v1/recipes/{recipe_id}", headers=other_headers)

    assert response.status_code == 200  # recetario compartido: lectura no requiere ser el dueño


def test_update_recipe_success(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]

    updated_payload = recipe_payload(category.id, title="Tortilla con cebolla")
    response = client.put(f"/api/v1/recipes/{recipe_id}", json=updated_payload, headers=headers)

    assert response.status_code == 200
    assert response.json()["title"] == "Tortilla con cebolla"


def test_update_recipe_forbidden_for_other_user(client, auth_headers, category):
    owner_headers = auth_headers("owner3")
    other_headers = auth_headers("other3")
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=owner_headers)
    recipe_id = created.json()["id"]

    response = client.put(f"/api/v1/recipes/{recipe_id}", json=recipe_payload(category.id), headers=other_headers)

    assert response.status_code == 403


def test_delete_recipe_success(client, auth_headers, category):
    headers = auth_headers()
    created = client.post("/api/v1/recipes", json=recipe_payload(category.id), headers=headers)
    recipe_id = created.json()["id"]

    delete_response = client.delete(f"/api/v1/recipes/{recipe_id}", headers=headers)
    get_response = client.get(f"/api/v1/recipes/{recipe_id}", headers=headers)

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_search_recipes_by_title(client, auth_headers, category):
    headers = auth_headers()
    client.post("/api/v1/recipes", json=recipe_payload(category.id, title="Tarta de manzana"), headers=headers)
    client.post("/api/v1/recipes", json=recipe_payload(category.id, title="Sopa de pollo"), headers=headers)

    response = client.get("/api/v1/recipes?q=tarta", headers=headers)

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Tarta de manzana"


def test_search_recipes_by_difficulty_and_time_max(client, auth_headers, category):
    headers = auth_headers()
    client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id, title="Rapida", difficulty="facil", time_min=10),
        headers=headers,
    )
    client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id, title="Lenta", difficulty="dificil", time_min=120),
        headers=headers,
    )

    response = client.get("/api/v1/recipes?difficulty=facil&time_max=15", headers=headers)

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Rapida"


def test_search_recipes_by_category(client, auth_headers, category, db_session):
    from app.models.category import Category

    other_category = Category(name="Postre test", slug="postre-test")
    db_session.add(other_category)
    db_session.commit()
    db_session.refresh(other_category)

    headers = auth_headers()
    client.post("/api/v1/recipes", json=recipe_payload(category.id, title="Principal"), headers=headers)
    client.post("/api/v1/recipes", json=recipe_payload(other_category.id, title="Dulce"), headers=headers)

    response = client.get(f"/api/v1/recipes?category_id={other_category.id}", headers=headers)

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Dulce"


def test_search_recipes_combines_filters(client, auth_headers, category):
    headers = auth_headers()
    client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id, title="Tarta rapida", difficulty="facil", time_min=10),
        headers=headers,
    )
    client.post(
        "/api/v1/recipes",
        json=recipe_payload(category.id, title="Tarta lenta", difficulty="dificil", time_min=90),
        headers=headers,
    )

    response = client.get("/api/v1/recipes?q=tarta&difficulty=facil", headers=headers)

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Tarta rapida"
