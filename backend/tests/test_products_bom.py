from datetime import date

def test_create_and_list_product(client, auth_headers):
    payload = {
        "name": "Industrial Test Control Module",
        "sku": "SKU-TEST-001",
        "category": "ELECTRONIC",
        "description": "High-reliability test ECU module",
        "lifecycle_status": "ACTIVE",
    }
    create_res = client.post("/api/v1/products", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    prod = create_res.json()
    assert prod["sku"] == "SKU-TEST-001"
    assert "id" in prod

    list_res = client.get("/api/v1/products", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert any(p["sku"] == "SKU-TEST-001" for p in items)


def test_create_material_and_bom_link(client, auth_headers):
    # Create Material
    mat_payload = {
        "name": "High-Density Silicon Substrate",
        "category": "RAW_MATERIAL",
        "unit_of_measurement": "KG",
        "lifecycle_status": "ACTIVE",
    }
    mat_res = client.post("/api/v1/materials", json=mat_payload, headers=auth_headers)
    assert mat_res.status_code == 201
    mat = mat_res.json()

    # Create Product
    prod_payload = {
        "name": "Smart Gateway Board",
        "sku": "SKU-GW-900",
        "category": "ELECTRONIC",
        "lifecycle_status": "ACTIVE",
    }
    prod_res = client.post("/api/v1/products", json=prod_payload, headers=auth_headers)
    assert prod_res.status_code == 201
    prod = prod_res.json()

    # Link in BOM
    bom_payload = {
        "product_id": prod["id"],
        "material_id": mat["id"],
        "required_quantity": 2.5,
        "unit": "KG",
        "revision": "REV-1",
        "effective_from": str(date.today()),
        "bom_status": "ACTIVE",
    }
    bom_res = client.post("/api/v1/bom", json=bom_payload, headers=auth_headers)
    assert bom_res.status_code == 201
    bom = bom_res.json()
    assert bom["required_quantity"] == 2.5
