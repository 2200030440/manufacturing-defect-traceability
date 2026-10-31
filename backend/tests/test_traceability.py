from datetime import date

def test_traceability_lifecycle_chain(client, auth_headers):
    # 1. Create Supplier
    sup_res = client.post(
        "/api/v1/suppliers",
        json={
            "name": "Tier-1 Silicon Fabrications",
            "country": "Germany",
            "category": "TIER_1",
            "quality_rating": 9.5,
            "lifecycle_status": "ACTIVE",
        },
        headers=auth_headers,
    )
    assert sup_res.status_code == 201
    sup = sup_res.json()

    # 2. Create Material & Lot
    mat_res = client.post(
        "/api/v1/materials",
        json={"name": "Automotive Sensor Die", "category": "RAW_MATERIAL", "unit_of_measurement": "KG"},
        headers=auth_headers,
    )
    assert mat_res.status_code == 201
    mat = mat_res.json()

    lot_res = client.post(
        "/api/v1/material-lots",
        json={
            "supplier_id": sup["id"],
            "material_id": mat["id"],
            "received_quantity": 500,
            "unit": "KG",
            "received_date": str(date.today()),
        },
        headers=auth_headers,
    )
    assert lot_res.status_code == 201
    lot = lot_res.json()

    # 3. Create Product & Order
    prod_res = client.post(
        "/api/v1/products",
        json={"name": "ADAS Sensor Unit", "sku": "SKU-ADAS-100", "category": "ELECTRONIC"},
        headers=auth_headers,
    )
    assert prod_res.status_code == 201
    prod = prod_res.json()

    order_res = client.post(
        "/api/v1/production-orders",
        json={"product_id": prod["id"], "bom_revision": "REV-1", "planned_quantity": 100},
        headers=auth_headers,
    )
    assert order_res.status_code == 201
    order = order_res.json()

    # 4. Record Consumption
    cons_res = client.post(
        "/api/v1/consumption",
        json={
            "production_order_id": order["id"],
            "lot_id": lot["id"],
            "material_id": mat["id"],
            "consumed_quantity": 50,
            "unit": "KG",
            "consumption_date": str(date.today()),
        },
        headers=auth_headers,
    )
    assert cons_res.status_code == 201

    # 5. Record Defect
    defect_res = client.post(
        "/api/v1/defects",
        json={
            "production_order_id": order["id"],
            "material_lot_id": lot["id"],
            "defect_category": "FUNCTIONAL_FAILURE",
            "severity": "CRITICAL",
            "defect_quantity": 2,
            "description": "Output voltage clamp failure at high frequency",
            "detection_date": str(date.today()),
            "root_cause": "Die gate oxide thickness deviation in silicon wafer",
        },
        headers=auth_headers,
    )
    assert defect_res.status_code == 201
    defect = defect_res.json()

    # 6. Test Traceability Traversal
    trace_res = client.get(f"/api/v1/traceability/defect/{defect['defect_id']}", headers=auth_headers)
    assert trace_res.status_code == 200
    trace = trace_res.json()

    assert trace["defect"]["defect_id"] == defect["defect_id"]
    assert trace["production_order"]["order_id"] == order["order_id"]
    assert trace["supplier"]["supplier_id"] == sup["supplier_id"]
    assert trace["traceability_score"] > 40
