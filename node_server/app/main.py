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

# app/main.py

# 유저 AI 통계 및 취약점 정보 가져오기
@app.get("/api/user-stats/{user_id}")
def get_user_stats(user_id: str):
    # 1. user_ai_stats 테이블에서 유저 점수 및 취약 태그 리스트(int[]) 조회
    stats_response = supabase.table("user_ai_stats") \
        .select("*") \
        .eq("user_id", user_id) \
        .maybe_single() \
        .execute()
    
    if not stats_response.data:
        return {"error": "User not found"}

    user_stats = stats_response.data
    weak_tags = user_stats.get("weak_category", [])

    # 2. 취약 태그 번호를 한글 이름으로 변환 (tag_metadata 테이블 Join 효과)
    tag_names = []
    if weak_tags:
        tags_response = supabase.table("tag_metadata") \
            .select("tag_name") \
            .in_("tag_id", weak_tags) \
            .execute()
        tag_names = [t['tag_name'] for t in tags_response.data]

    user_stats["weak_tag_names"] = tag_names
    return user_stats

# 유저의 취약점에 맞는 추천 문제 리스트 가져오기
@app.get("/api/recommend-problems/{user_id}")
def get_recommendations(user_id: str):
    # 유저 취약 태그 확인
    stats = supabase.table("user_ai_stats").select("weak_category").eq("user_id", user_id).single().execute()
    weak_tags = stats.data.get("weak_category", [])

    if not weak_tags:
        # 취약점 없으면 랜덤 5개
        problems = supabase.table("problems").select("*").limit(5).execute()
    else:
        # 첫 번째 취약 태그를 포함하는 문제 5개 추천
        problems = supabase.table("problems") \
            .select("*") \
            .contains("tags", [weak_tags[0]]) \
            .limit(5) \
            .execute()

    return problems.data

@app.get("/")
def health_check():
    return {"status": "online", "message": "Twin Edu API 가동 중"}

# 문제 리스트 불러오기 API
@app.get("/api/questions")
def get_questions():
    # Supabase의 problems 테이블에서 모든 데이터 조회
    response = supabase.table("problems").select("*").execute()
    return response.data

# [추가] 유저 기본 프로필 정보 가져오기
@app.get("/api/users/{user_id}")
def get_user_profile(user_id: str):
    try:
        # users 테이블에서 id(또는 user_id)가 일치하는 행 조회
        # 테이블의 실제 ID 컬럼명에 맞춰 .eq("id", user_id) 등으로 수정하세요.
        response = supabase.table("users") \
            .select("*") \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        
        if not response.data:
            return {"error": "User profile not found"}
            
        return response.data
    except Exception as e:
        return {"error": str(e)}