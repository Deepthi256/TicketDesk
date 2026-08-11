import os
import io
import urllib.parse
import boto3
from PIL import Image

s3_client = boto3.client("s3")

def handler(event, context):
    """
    AWS Lambda function triggered by S3 ObjectCreated event on uploads/ prefix.
    Generates a 128x128 thumbnail and saves it to thumbnails/ prefix.
    """
    print(f"[ThumbnailGenerator] Event received: {event}")
    
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"], encoding="utf-8")
        
        # Avoid infinite loop: skip if object is already a thumbnail
        if key.startswith("thumbnails/"):
            print(f"[ThumbnailGenerator] Skipping thumbnail object: {key}")
            continue

        if not key.startswith("uploads/"):
            print(f"[ThumbnailGenerator] Skipping object outside uploads/: {key}")
            continue

        file_name = os.path.basename(key)
        ext = os.path.splitext(file_name)[1].lower()

        # Only process images
        if ext not in [".jpg", ".jpeg", ".png"]:
            print(f"[ThumbnailGenerator] Skipping non-image file type {ext} for key {key}")
            continue

        thumbnail_key = key.replace("uploads/", "thumbnails/")

        try:
            # Download image from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            image_content = response["Body"].read()

            # Generate thumbnail with Pillow
            with Image.open(io.BytesIO(image_content)) as img:
                img.thumbnail((128, 128))
                
                # Determine image format
                img_format = "JPEG" if ext in [".jpg", ".jpeg"] else "PNG"
                buffer = io.BytesIO()
                img.save(buffer, format=img_format)
                buffer.seek(0)

                # Upload thumbnail back to S3
                s3_client.put_object(
                    Bucket=bucket,
                    Key=thumbnail_key,
                    Body=buffer,
                    ContentType=f"image/{img_format.lower()}"
                )
                print(f"[ThumbnailGenerator] Successfully created thumbnail s3://{bucket}/{thumbnail_key}")

        except Exception as e:
            print(f"[ThumbnailGenerator Error] Failed to process {key}: {e}")
            raise e

    return {"statusCode": 200, "body": "Thumbnail generation completed"}
