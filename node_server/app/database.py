import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .env 파일 로드
load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_KEY")

# Supabase 클라이언트 생성
supabase: Client = create_client(url, key)
if not url or not key:
    print(f"❌ 환경 변수 로드 실패! URL: {url}, KEY: {key}")
    raise ValueError("SUPABASE_URL 및 SUPABASE_KEY가 .env 파일에 설정되지 않았습니다.")

print(f"성공! URL: {url}, KEY: {key}")

supabase: Client = create_client(url, key)