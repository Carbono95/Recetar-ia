from datetime import date, timedelta


def monday_of_week(base: date) -> date:
    return base - timedelta(days=base.weekday())


def iso_week_label(d: date) -> str:
    year, week, _ = d.isocalendar()
    return f"{year}-W{week:02d}"


def recipe_payload(category_id, title="Receta", ingredients=None):
    return {
        "title": title,
        "time_min": 20,
        "difficulty": "facil",
        "category_id": category_id,
        "ingredients": ingredients or [{"ingredient_name": "Arroz", "quantity": "1", "unit": "kg"}],
    }


def create_recipe(client, headers, category_id, **kwargs):
    response = client.post("/api/v1/recipes", json=recipe_payload(category_id, **kwargs), headers=headers)
    return response.json()["id"]


THIS_MONDAY = monday_of_week(date.today())
THIS_WEEK_LABEL = iso_week_label(THIS_MONDAY)


def test_add_meal_plan_entry_success(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(client, headers, category.id)

    response = client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY), "meal_type": "cena"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["recipe_id"] == recipe_id
    assert body["meal_type"] == "cena"
    assert body["recipe_title"] == "Receta"


def test_add_meal_plan_entry_nonexistent_recipe(client, auth_headers):
    response = client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": 9999, "date": str(THIS_MONDAY), "meal_type": "cena"},
        headers=auth_headers(),
    )

    assert response.status_code == 404


def test_add_meal_plan_entry_allows_shared_recipe(client, auth_headers, category):
    owner_headers = auth_headers("owner")
    other_headers = auth_headers("other")
    recipe_id = create_recipe(client, owner_headers, category.id)

    response = client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY), "meal_type": "comida"},
        headers=other_headers,
    )

    assert response.status_code == 201


def test_get_week_entries_only_returns_that_week(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(client, headers, category.id)

    client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY), "meal_type": "comida"},
        headers=headers,
    )
    previous_week_day = THIS_MONDAY - timedelta(days=7)
    client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(previous_week_day), "meal_type": "cena"},
        headers=headers,
    )

    response = client.get(f"/api/v1/meal-plan?week={THIS_WEEK_LABEL}", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1


def test_get_week_entries_invalid_week_format(client, auth_headers):
    response = client.get("/api/v1/meal-plan?week=not-a-week", headers=auth_headers())

    assert response.status_code == 422


def test_remove_meal_plan_entry(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(client, headers, category.id)
    created = client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY), "meal_type": "cena"},
        headers=headers,
    )
    entry_id = created.json()["id"]

    delete_response = client.delete(f"/api/v1/meal-plan/{entry_id}", headers=headers)
    list_response = client.get(f"/api/v1/meal-plan?week={THIS_WEEK_LABEL}", headers=headers)

    assert delete_response.status_code == 204
    assert list_response.json()["items"] == []


def test_remove_meal_plan_entry_not_found_for_other_user(client, auth_headers, category):
    owner_headers = auth_headers("owner2")
    other_headers = auth_headers("other2")
    recipe_id = create_recipe(client, owner_headers, category.id)
    created = client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY), "meal_type": "cena"},
        headers=owner_headers,
    )
    entry_id = created.json()["id"]

    response = client.delete(f"/api/v1/meal-plan/{entry_id}", headers=other_headers)

    assert response.status_code == 404


def test_generate_weekly_shopping_list_sums_repeated_recipe(client, auth_headers, category):
    headers = auth_headers()
    recipe_id = create_recipe(
        client, headers, category.id,
        ingredients=[{"ingredient_name": "Huevo", "quantity": "2", "unit": "unidades"}],
    )

    client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY), "meal_type": "comida"},
        headers=headers,
    )
    client.post(
        "/api/v1/meal-plan",
        json={"recipe_id": recipe_id, "date": str(THIS_MONDAY + timedelta(days=2)), "meal_type": "cena"},
        headers=headers,
    )

    response = client.post(f"/api/v1/meal-plan/generate-shopping?week={THIS_WEEK_LABEL}", headers=headers)

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["ingredient_name"] == "huevo"
    assert items[0]["total_quantity"] == "4"  # 2 + 2: la receta se repite dos veces esa semana


def test_generate_weekly_shopping_list_empty_week(client, auth_headers):
    response = client.post(f"/api/v1/meal-plan/generate-shopping?week={THIS_WEEK_LABEL}", headers=auth_headers())

    assert response.status_code == 422
