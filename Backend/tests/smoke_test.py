import sys
import argparse
import urllib.request
import json

def run_smoke_tests(target_url: str):
    print(f"=== Starting TicketDesk Smoke Test Suite against {target_url} ===")
    base_url = target_url.rstrip("/")
    
    # Test 1: Health check
    health_url = f"{base_url}/health"
    print(f"[Test 1/4] Checking Health Endpoint: {health_url}")
    try:
        req = urllib.request.urlopen(health_url, timeout=10)
        status_code = req.getcode()
        body = json.loads(req.read().decode("utf-8"))
        assert status_code == 200, f"Expected HTTP 200, got {status_code}"
        assert body.get("status") in ["healthy", "ok"], f"Unexpected health response: {body}"
        print("  --> PASS: Health check succeeded!")
    except Exception as e:
        print(f"  --> FAIL: Health check failed: {e}")
        sys.exit(1)

    # Test 2: List Tickets API
    tickets_url = f"{base_url}/api/tickets"
    print(f"[Test 2/4] Checking Tickets API: {tickets_url}")
    try:
        req = urllib.request.urlopen(tickets_url, timeout=10)
        assert req.getcode() == 200
        data = json.loads(req.read().decode("utf-8"))
        assert isinstance(data, list), "Expected list of tickets"
        print(f"  --> PASS: Retrieved {len(data)} tickets!")
    except Exception as e:
        print(f"  --> FAIL: Tickets API failed: {e}")
        sys.exit(1)

    # Test 3: Dashboard API
    dashboard_url = f"{base_url}/api/dashboard"
    print(f"[Test 3/4] Checking Dashboard Stats: {dashboard_url}")
    try:
        req = urllib.request.urlopen(dashboard_url, timeout=10)
        assert req.getcode() == 200
        stats = json.loads(req.read().decode("utf-8"))
        print(f"  --> PASS: Dashboard loaded successfully! Stats: {stats}")
    except Exception as e:
        print(f"  --> FAIL: Dashboard API failed: {e}")
        sys.exit(1)

    # Test 4: Create Ticket End-to-End
    print(f"[Test 4/4] Creating Test Ticket via API...")
    try:
        ticket_payload = json.dumps({
            "title": "Smoke Test Ticket",
            "description": "Automated verification ticket created during deployment pipeline",
            "category": "Software",
            "priority": "HIGH"
        }).encode("utf-8")
        
        create_req = urllib.request.Request(
            tickets_url,
            data=ticket_payload,
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(create_req, timeout=10)
        assert resp.getcode() in [200, 201]
        created = json.loads(resp.read().decode("utf-8"))
        assert created.get("id"), "Ticket ID missing in response"
        print(f"  --> PASS: Ticket created successfully! ID: {created.get('id')}")
    except Exception as e:
        print(f"  --> FAIL: Create ticket test failed: {e}")
        sys.exit(1)

    print("\n=== ALL SMOKE TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run TicketDesk deployment smoke tests")
    parser.add_argument("--url", required=True, help="Target ALB or CloudFront Base URL")
    args = parser.parse_args()
    run_smoke_tests(args.url)
