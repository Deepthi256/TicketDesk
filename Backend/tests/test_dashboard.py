from fastapi.testclient import TestClient

from app.main import app



client=TestClient(app)



def test_dashboard():


    response=client.get(

        "/api/dashboard"

    )


    assert response.status_code==200


    data=response.json()



    assert "total" in data

    assert "open" in data

    assert "closed" in data