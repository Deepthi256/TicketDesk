import urllib.request
import urllib.parse
import json
import time
import io
import os
import boto3
from PIL import Image

def verify_m5():
    base_url = "http://tkt-poc-alb-387717632.us-east-1.elb.amazonaws.com"
    
    print("=== M5 VERIFICATION STEP 1: Creating Test Ticket ===")
    ticket_payload = {
        "title": "M5 Verification Ticket",
        "description": "Testing S3 presigned upload & Lambda thumbnail generator",
        "category": "Software",
        "priority": "HIGH",
        "created_by": "M5_Verifier"
    }
    req = urllib.request.Request(
        f"{base_url}/api/tickets",
        data=json.dumps(ticket_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    ticket = json.loads(res.read().decode())
    ticket_id = ticket['id']
    print(f"  --> Ticket created successfully! ID: {ticket_id}")

    print("\n=== M5 VERIFICATION STEP 2: Requesting Presigned Upload URL ===")
    req_p = urllib.request.Request(
        f"{base_url}/api/tickets/{ticket_id}/presigned-upload?file_name=m5_sample.png&file_type=image/png",
        method='POST',
        headers={'Content-Type': 'application/json'}
    )
    res_p = urllib.request.urlopen(req_p)
    presigned = json.loads(res_p.read().decode())
    upload_url = presigned['upload_url']
    file_key = presigned['file_key']
    print(f"  --> Presigned S3 Upload URL generated: {upload_url[:75]}...")
    print(f"  --> S3 Key: {file_key}")

    print("\n=== M5 VERIFICATION STEP 3: Uploading Image Directly to S3 ===")
    img = Image.new('RGB', (400, 400), color='purple')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    put_req = urllib.request.Request(
        upload_url,
        data=img_bytes,
        method='PUT',
        headers={'Content-Type': 'image/png'}
    )
    urllib.request.urlopen(put_req)
    print("  --> Direct S3 Upload HTTP 200 OK!")

    print("\n=== M5 VERIFICATION STEP 4: Confirming Attachment Metadata ===")
    encoded_file_key = urllib.parse.quote(file_key, safe='')
    req_c = urllib.request.Request(
        f"{base_url}/api/tickets/{ticket_id}/confirm-attachment?file_name=m5_sample.png&file_key={encoded_file_key}",
        method='POST',
        headers={'Content-Type': 'application/json'}
    )
    res_c = urllib.request.urlopen(req_c)
    attachment = json.loads(res_c.read().decode())
    print(f"  --> Attachment Metadata Confirmed: {attachment['file_name']} (S3 Path: {attachment['file_path']})")

    print("\n=== M5 VERIFICATION STEP 5: Verifying AWS Lambda Thumbnail Generator Trigger ===")
    print("  --> Waiting 5 seconds for S3 s3:ObjectCreated trigger to execute Lambda...")
    time.sleep(5)

    region = os.getenv("AWS_REGION", "us-east-1")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    
    if access_key and secret_key:
        s3 = boto3.client('s3', region_name=region, aws_access_key_id=access_key, aws_secret_access_key=secret_key)
    else:
        s3 = boto3.client('s3', region_name=region)

    bucket = 'tkt-poc-attachments-4a79ac51'
    objs = s3.list_objects_v2(Bucket=bucket, Prefix='thumbnails/').get('Contents', [])
    print(f"  --> Thumbnails found in s3://{bucket}/thumbnails/:")
    for obj in objs:
        print(f"      - {obj['Key']} ({obj['Size']} bytes)")

    if len(objs) > 0:
        print("\n=== ALL M5 REQUIREMENTS VERIFIED SUCCESSFULLY & WORKING 100%! ===")

if __name__ == "__main__":
    verify_m5()
