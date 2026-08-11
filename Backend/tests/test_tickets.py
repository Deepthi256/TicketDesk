from fastapi.testclient import TestClient

from app.main import app



client = TestClient(app)



def create_ticket():

    response = client.post(

        "/api/tickets",

        json={

            "title":"Test Ticket",

            "description":"Testing ticket creation",

            "category":"Hardware",

            "priority":"HIGH"

        }

    )


    return response.json()





def test_create_ticket():

    ticket=create_ticket()


    assert ticket["title"]=="Test Ticket"


    assert ticket["status"]=="OPEN"





def test_get_tickets():

    response=client.get(
        "/api/tickets"
    )


    assert response.status_code==200


    assert isinstance(
        response.json(),
        list
    )





def test_update_ticket():

    ticket=create_ticket()


    response=client.put(

        f"/api/tickets/{ticket['id']}",

        json={

            "title":"Updated Ticket"

        }

    )


    assert response.status_code==200


    assert response.json()["title"]=="Updated Ticket"





def test_status_update():

    ticket=create_ticket()


    response=client.patch(

        f"/api/tickets/{ticket['id']}/status",

        json={

            "status":"IN_PROGRESS"

        }

    )


    assert response.status_code==200


    assert response.json()["status"]=="IN_PROGRESS"