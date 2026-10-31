def test_validation_endpoint(client, auth_headers):
    res = client.get("/api/v1/validation/run", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "checks" in data
    assert any(c["check_name"] == "PK_UNIQUENESS" for c in data["checks"])


def test_anomaly_detection_endpoint(client, auth_headers):
    res = client.get("/api/v1/validation/anomaly-detection", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_anomalies" in data
    assert "anomalies" in data
    assert isinstance(data["anomalies"], list)
