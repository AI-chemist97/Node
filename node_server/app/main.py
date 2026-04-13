from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import supabase
from pydantic import BaseModel
app = FastAPI(title="Twin Edu API")

# 프론트엔드 연결 허용 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# app/main.py
class ScoreUpdate(BaseModel):
    field: str      # grammar_score, reading_score 등
    is_correct: bool
    inc_value: float = 0.05  # 기본 가중치


class ProfileUpdate(BaseModel):
    name: str = None
    school_name: str = None
    grade: str = None
    region: str = None
    target_university: str = None
    target_major: str = None

# app/main.py에 추가
class SignupRequest(BaseModel):
    user_id: str
    name: str
    school_name: str = "미지정 학교"

@app.post("/api/signup")
def signup_user(data: SignupRequest):
    try:
        # 1. users 테이블에 유저 생성
        user_res = supabase.table("users").insert({
            "user_id": data.user_id,
            "name": data.name,
            "school_name": data.school_name,
            "grade": "고등학교 1학년", # 기본값
            "region": "서울"
        }).execute()

        # 2. user_ai_stats 테이블에 초기 점수(0.5) 세팅
        stats_res = supabase.table("user_ai_stats").insert({
            "user_id": data.user_id,
            "grammar_score": 0.5,
            "reading_score": 0.5,
            "vocabulary_score": 0.5,
            "structure_score": 0.5,
            "logic_score": 0.5,
            "predicted_score": 0.5,
            "total_solved": 0
        }).execute()

        return {"status": "success", "user": user_res.data}
    except Exception as e:
        return {"error": str(e)}
    
    
@app.patch("/api/user-stats/{user_id}")
def update_user_scores(user_id: str, data: ScoreUpdate):
    try:
        # 1. 현재 유저의 최신 점수 정보를 먼저 가져옵니다.
        current_stats = supabase.table("user_ai_stats") \
            .select("*") \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()

        if not current_stats.data:
            return {"error": "User stats not found"}

        # 2. 기존 점수 계산 및 갱신
        # 정답이면 증가, 오답이면 감소 (0.0 ~ 1.0 사이 유지)
        current_val = current_stats.data.get(data.field, 0.0)
        
        if data.is_correct:
            new_val = min(1.0, current_val + data.inc_value)
        else:
            # 오답 시 감점 (예: 0.02 차감)
            new_val = max(0.0, current_val - 0.02)

        # 3. DB 업데이트 실행
        response = supabase.table("user_ai_stats") \
            .update({data.field: new_val}) \
            .eq("user_id", user_id) \
            .execute()

        return response.data
    except Exception as e:
        return {"error": str(e)}
    
@app.patch("/api/users/{user_id}")
def update_user_profile(user_id: str, profile: ProfileUpdate):
    try:
        # 데이터베이스 업데이트 실행
        # profile.dict(exclude_unset=True)를 사용하여 값이 있는 필드만 업데이트
        update_data = profile.dict(exclude_unset=True)
        
        response = supabase.table("users") \
            .update(update_data) \
            .eq("user_id", user_id) \
            .execute()
            
        return response.data
    except Exception as e:
        return {"error": str(e)}
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