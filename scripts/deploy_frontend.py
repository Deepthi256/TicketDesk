import os
import mimetypes
import boto3

def deploy_frontend():
    bucket_name = os.getenv("S3_FRONTEND_BUCKET", "tkt-poc-frontend-4a79ac51")
    region = os.getenv("AWS_REGION", "us-east-1")
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Frontend", "dist"))

    if not os.path.exists(dist_dir):
        print(f"[Error] Frontend dist folder not found at {dist_dir}")
        return

    print(f"=== Uploading React Static Assets to S3 Bucket: {bucket_name} ===")
    
    # Initialize boto3 client reading from environment or AWS config
    if access_key and secret_key:
        s3_client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )
    else:
        s3_client = boto3.client("s3", region_name=region)

    for root, _, files in os.walk(dist_dir):
        for file in files:
            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, dist_dir).replace("\\", "/")
            content_type, _ = mimetypes.guess_type(full_path)
            if not content_type:
                content_type = "application/octet-stream"

            print(f"Uploading {relative_path} ({content_type})...")
            s3_client.upload_file(
                full_path,
                bucket_name,
                relative_path,
                ExtraArgs={"ContentType": content_type}
            )

    print("=== S3 Frontend Deployment Finished Successfully ===")

if __name__ == "__main__":
    deploy_frontend()
