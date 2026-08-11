import os
import json
from dotenv import load_dotenv

load_dotenv()

def resolve_database_url() -> str:
    # 1. Direct DATABASE_URL environment variable (from Parameter Store / ECS Secrets)
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url

    # 2. Fetch from AWS Secrets Manager if DB_SECRET_NAME or DB_SECRET_ARN is provided
    secret_name = os.getenv("DB_SECRET_NAME") or os.getenv("SECRET_ARN")
    if secret_name:
        try:
            import boto3
            region = os.getenv("AWS_REGION", "us-east-1")
            client = boto3.client("secretsmanager", region_name=region)
            secret_value = client.get_secret_value(SecretId=secret_name)
            secret_json = json.loads(secret_value.get("SecretString", "{}"))
            
            user = secret_json.get("username", os.getenv("DB_USER", "postgres"))
            password = secret_json.get("password", os.getenv("DB_PASSWORD", ""))
            host = secret_json.get("host", os.getenv("DB_HOST", "localhost"))
            port = secret_json.get("port", os.getenv("DB_PORT", "5432"))
            dbname = secret_json.get("dbname", os.getenv("DB_NAME", "ticketdesk"))
            return f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
        except Exception as e:
            print(f"[Config Warning] Failed to fetch secret from Secrets Manager: {e}")

    # 3. Individual DB environment variables
    host = os.getenv("DB_HOST")
    if host:
        user = os.getenv("DB_USER", "postgres")
        password = os.getenv("DB_PASSWORD", "postgres")
        port = os.getenv("DB_PORT", "5432")
        dbname = os.getenv("DB_NAME", "ticketdesk")
        return f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

    # 4. Default SQLite fallback for local development
    return "sqlite:///./ticketdesk.db"

DATABASE_URL = resolve_database_url()

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./uploads")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_FILE_TYPES = [
    "image/png",
    "image/jpeg",
    "application/pdf"
]