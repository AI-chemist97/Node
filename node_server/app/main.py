from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import supabase

app = FastAPI(title="Twin Edu API")

# 프론트엔드 연결 허용 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "message": "Twin Edu API 가동 중"}

# 문제 리스트 불러오기 API
@app.get("/api/questions")
def get_questions():
    # Supabase의 problems 테이블에서 모든 데이터 조회
    response = supabase.table("problems").select("*").execute()
    return response.data