def create_recipe(client, headers, category_id, title, ingredients):
    payload = {
        "title": title,
        "time_min": 20,
        "difficulty": "facil",
        "category_id": category_id,
        "ingredients": ingredients,
    }
    response = client.post("/api/v1/recipes", json=payload, headers=headers)
    return response.json()["id"]


def test_generate_sums_numeric_quantities(client, auth_headers, category):
    headers = auth_headers()
    recipe1 = create_recipe(
        client, headers, category.id, "Receta 1", [{"ingredient_name": "Huevo", "quantity": "2", "unit": "unidades"}]
    )
    recipe2 = create_recipe(
        client, headers, category.id, "Receta 2", [{"ingredient_name": "huevo", "quantity": "3", "unit": "unidades"}]
    )

    response = client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe1, recipe2]}, headers=headers)

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["ingredient_name"] == "huevo"
    assert items[0]["total_quantity"] == "5"


def test_generate_concatenates_non_numeric_quantities(client, auth_headers, category):
    headers = auth_headers()
    recipe1 = create_recipe(
        client, headers, category.id, "Receta 1", [{"ingredient_name": "Sal", "quantity": "al gusto", "unit": "pizca"}]
    )
    recipe2 = create_recipe(
        client, headers, category.id, "Receta 2", [{"ingredient_name": "sal", "quantity": "un poco", "unit": "pizca"}]
    )

    response = client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe1, recipe2]}, headers=headers)

    items = response.json()["items"]
    assert items[0]["total_quantity"] == "al gusto + un poco"


def test_generate_allows_recipes_from_other_user(client, auth_headers, category):
    """Recetario compartido: cualquier receta existente puede usarse para generar la lista."""
    owner_headers = auth_headers("owner")
    other_headers = auth_headers("other")
    recipe_id = create_recipe(
        client, owner_headers, category.id, "Receta ajena", [{"ingredient_name": "Tomate", "quantity": "2", "unit": "unidades"}]
    )

    response = client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe_id]}, headers=other_headers)

    assert response.status_code == 200
    assert response.json()["items"][0]["ingredient_name"] == "tomate"


def test_generate_rejects_nonexistent_recipe(client, auth_headers):
    response = client.post("/api/v1/shopping/generate", json={"recipe_ids": [9999]}, headers=auth_headers())

    assert response.status_code == 404


def test_generate_replaces_previous_list(client, auth_headers, category):
    headers = auth_headers()
    recipe1 = create_recipe(
        client, headers, category.id, "Receta 1", [{"ingredient_name": "Arroz", "quantity": "1", "unit": "kg"}]
    )
    recipe2 = create_recipe(
        client, headers, category.id, "Receta 2", [{"ingredient_name": "Pasta", "quantity": "1", "unit": "kg"}]
    )

    client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe1]}, headers=headers)
    response = client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe2]}, headers=headers)

    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["ingredient_name"] == "pasta"


def test_get_shopping_list(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(
        client, headers, category.id, "Receta", [{"ingredient_name": "Leche", "quantity": "1", "unit": "litro"}]
    )
    client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe_id]}, headers=headers)

    response = client.get("/api/v1/shopping", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1


def test_check_shopping_item(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(
        client, headers, category.id, "Receta", [{"ingredient_name": "Pan", "quantity": "1", "unit": "unidad"}]
    )
    generated = client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe_id]}, headers=headers)
    item_id = generated.json()["items"][0]["id"]

    response = client.patch(f"/api/v1/shopping/{item_id}/check", json={"checked": True}, headers=headers)

    assert response.status_code == 200
    assert response.json()["checked"] is True


def test_check_shopping_item_forbidden_for_other_user(client, auth_headers, category):
    owner_headers = auth_headers("owner2")
    other_headers = auth_headers("other2")
    recipe_id = create_recipe(
        client, owner_headers, category.id, "Receta", [{"ingredient_name": "Queso", "quantity": "200", "unit": "g"}]
    )
    generated = client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe_id]}, headers=owner_headers)
    item_id = generated.json()["items"][0]["id"]

    response = client.patch(f"/api/v1/shopping/{item_id}/check", json={"checked": True}, headers=other_headers)

    assert response.status_code == 404


def test_clear_shopping_list(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(
        client, headers, category.id, "Receta", [{"ingredient_name": "Café", "quantity": "1", "unit": "paquete"}]
    )
    client.post("/api/v1/shopping/generate", json={"recipe_ids": [recipe_id]}, headers=headers)

    delete_response = client.delete("/api/v1/shopping", headers=headers)
    list_response = client.get("/api/v1/shopping", headers=headers)

    assert delete_response.status_code == 204
    assert list_response.json()["items"] == []
