from fastapi.testclient import TestClient

from app.main import app



client=TestClient(app)



def test_create_comment():


    ticket_response=client.post(

        "/api/tickets",

        json={

            "title":"Comment Ticket",

            "description":"Testing comments",

            "category":"Software",

            "priority":"MEDIUM"

        }

    )


    ticket=ticket_response.json()



    response=client.post(

        f"/api/tickets/{ticket['id']}/comments",

        json={

            "comment":"Test comment",

            "createdBy":"Admin"

        }

    )



    assert response.status_code==200


    assert response.json()["comment"]=="Test comment"





def test_get_comments():


    ticket_response=client.post(

        "/api/tickets",

        json={

            "title":"Comment Test",

            "description":"Testing",

            "category":"Network",

            "priority":"LOW"

        }

    )


    ticket=ticket_response.json()



    response=client.get(

        f"/api/tickets/{ticket['id']}/comments"

    )


    assert response.status_code==200


    assert isinstance(
        response.json(),
        list
    )