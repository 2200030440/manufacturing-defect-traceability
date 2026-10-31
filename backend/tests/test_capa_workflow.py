from datetime import date

def test_capa_initiation_and_verification_workflow(client, auth_headers):
    # 1. Create Defect
    defect_res = client.post(
        "/api/v1/defects",
        json={
            "defect_category": "DIMENSIONAL",
            "severity": "MAJOR",
            "defect_quantity": 4,
            "description": "Inner bore diameter +0.05mm over specification tolerance",
            "detection_date": str(date.today()),
        },
        headers=auth_headers,
    )
    assert defect_res.status_code == 201
    defect = defect_res.json()

    # 2. Initiate CAPA
    capa_payload = {
        "defect_id": defect["id"],
        "root_cause": "Tool wear sensor drift after 10,000 cycles without offset recalibration.",
        "corrective_action": "Install automated acoustic tool wear monitor and update offset compensation curve.",
        "preventive_action": "Mandate calibration check every 5,000 cycles.",
        "assigned_engineer": "Senior Quality Engineer",
        "created_date": str(date.today()),
        "target_date": "2026-12-15",
    }
    capa_res = client.post("/api/v1/capa", json=capa_payload, headers=auth_headers)
    assert capa_res.status_code == 201
    capa = capa_res.json()
    assert capa["capa_status"] == "OPEN"
    assert capa["verification_status"] == "PENDING"

    # 3. Verify and Close CAPA
    verify_payload = {
        "verified_by": "Quality Director",
        "verification_date": str(date.today()),
        "verification_status": "PASSED",
        "evidence": "Acoustic tool monitor verified over 5 consecutive shifts; 0 bore deviations.",
        "notes": "Action proven effective.",
    }
    verify_res = client.post(
        f"/api/v1/capa/{capa['id']}/verify",
        json=verify_payload,
        headers=auth_headers,
    )
    assert verify_res.status_code == 201
    verified_capa = verify_res.json()
    assert verified_capa["verification_status"] == "PASSED"
