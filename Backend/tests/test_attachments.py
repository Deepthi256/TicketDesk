from fastapi.testclient import TestClient

from app.main import app



client=TestClient(app)




def test_attachment_upload():


    ticket_response=client.post(

        "/api/tickets",

        json={

            "title":"Attachment Test",

            "description":"Testing upload",

            "category":"Other",

            "priority":"HIGH"

        }

    )


    ticket=ticket_response.json()



    files={

        "file":

        (

            "test.txt",

            b"hello",

            "text/plain"

        )

    }



    response=client.post(

        f"/api/tickets/{ticket['id']}/attachment",

        files=files

    )


    assert response.status_code==200


    assert response.json()["message"]=="Uploaded successfully"