import os
import re
import json
import urllib.request
import urllib.error
from bs4 import BeautifulSoup
from googlesearch import search
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, TypedDict
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CINTEL API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class ClaudeRequest(BaseModel):
    systemPrompt: str
    userMessage: str
    model: str = "gemini-2.5-flash"
    max_tokens: int = 1000

class AnalyzeRequest(BaseModel):
    title: str

# Helper to aggressively scrape the web for live context
def gather_osint_context(film_title: str) -> str:
    print(f"Gathering OSINT context for: {film_title}")
    queries = [
        f"{film_title} movie box office collection budget",
        f"{film_title} movie reviews audience reception"
    ]
    
    found_urls = []
    for q in queries:
        try:
            # googlesearch-python returns an iterator
            for result_url in search(q, num_results=2):
                found_urls.append(str(result_url))
        except Exception as e:
            print(f"Search error for query '{q}': {e}")
            # If search is blocked (429), we just continue and rely on internal knowledge
            continue

    unique_urls = list(dict.fromkeys(found_urls))
    # Standardize slicing for linter compatibility
    unique_urls = unique_urls[0:3]
    
    scraped_text_bits = []
    for url in unique_urls:
        print(f"Scraping {url}")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                html_raw = resp.read()
            soup = BeautifulSoup(html_raw, 'html.parser')
            # Extract paragraphs
            paragraphs = soup.find_all('p')
            para_text = " ".join([p.get_text() for p in paragraphs])
            # Keep it concise to avoid token explosion
            scraped_text_bits.append(str(para_text)[0:1500])
        except Exception as e:
            print(f"Failed to scrape {url}: {e}")
            pass

    return "\n".join(scraped_text_bits)

@app.post("/api/analyze")
async def analyze_film(request: AnalyzeRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    film_title = request.title
    
    # 1. Gather live OSINT
    osint_context = gather_osint_context(film_title)

    # 2. Ask Gemini to format it into strict JSON
    prompt = f"""
    You are an expert film intelligence AI evaluating real-time movie data.
    Based on your internal knowledge and the following LIVE scraped web data for the movie "{film_title}", generate a comprehensive JSON analysis.
    
    LIVE SCRAPED WEB DATA:
    {osint_context}
    
    You MUST return ONLY valid JSON matching this exact structure (no markdown fences, no extra text):
    {{
      "film": {{
        "title": "{film_title}",
        "genre": "...",
        "budget": "...",
        "lang": "...",
        "themes": "...",
        "region": "..."
    You MUST return ONLY valid JSON matching this exact structure:
    {{
      "film": {{
        "title": "{film_title}",
        "genre": "...",
        "budget": "...",
        "lang": "...",
        "themes": "...",
        "region": "..."
      }},
      "audience": {{
        "segments": [
          {{ "name": "...", "age": "...", "size": 40, "interest": ["..."], "platforms": ["..."] }}
        ],
        "traits": ["...", "...", "...", "..."],
        "dna": [85, 45, 60, 90, 30, 75] 
      }},
      "platforms": [
        {{ "name": "...", "score": 85, "deal": "₹4.0Cr", "window": "..." }}
      ],
      "festivals": [
         {{ "name": "...", "deadline": "...", "match": 90, "category": "...", "fee": "...", "status": "Open" }}
      ],
      "comps": [
         {{ "title": "...", "genre": "...", "year": 2023, "budget": "...", "collection": "...", "roi": "...", "strategy": "...", "keywords": ["..."] }}
      ]
    }}
    
    CRITICAL INSTRUCTIONS:
    - `audience.segments`: Exactly 3 objects.
    - `dna`: Exactly 6 integers [Emotion, Action, Visual, Story, Comedy, Drama].
    - All other arrays: 3-5 relevant items.
    """

    class SegmentDict(TypedDict):
        name: str
        age: str
        size: int
        interest: list[str]
        platforms: list[str]

    class AudienceDict(TypedDict):
        segments: list[SegmentDict]
        traits: list[str]
        dna: list[int]

    class FilmDict(TypedDict):
        title: str
        genre: str
        budget: str
        lang: str
        themes: str
        region: str

    class PlatformDict(TypedDict):
        name: str
        score: int
        deal: str
        window: str

    class FestivalDict(TypedDict):
        name: str
        deadline: str
        match: int
        category: str
        fee: str
        status: str

    class CompDict(TypedDict):
        title: str
        genre: str
        year: int
        budget: str
        collection: str
        roi: str
        strategy: str
        keywords: list[str]

    class AnalysisSchema(TypedDict):
        film: FilmDict
        audience: AudienceDict
        platforms: list[PlatformDict]
        festivals: list[FestivalDict]
        comps: list[CompDict]

    try:
        model = genai.GenerativeModel(model_name="gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=2500,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=AnalysisSchema,
            ),
        )
    except Exception as e:
        print(f"Gemini API call or response error: {str(e)}")
        # FALLBACK: Provide a valid basic structure so the frontend doesn't crash
        return {
            "film": {"title": film_title, "genre": "Drama", "budget": "TBD", "lang": "English", "themes": "General", "region": "Global"},
            "audience": {"segments": [], "traits": [], "dna": [50, 50, 50, 50, 50, 50]},
            "platforms": [], "festivals": [], "comps": []
        }

    # Extract text safely
    try:
        raw = response.text.strip()
    except Exception as e:
        # This happens if there's no candidate or safety block
        print(f"Could not get text from Gemini response (safety block?): {e}")
        return {
            "film": {"title": film_title, "genre": "Drama", "budget": "TBD", "lang": "English", "themes": "General", "region": "Global"},
            "audience": {"segments": [], "traits": [], "dna": [50, 50, 50, 50, 50, 50]},
            "platforms": [], "festivals": [], "comps": []
        }

    # Parse output to ensure it's valid JSON before sending
    try:
        # First try direct parse
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Extract JSON cleanly using regex in case of floating markdown or text
            match = re.search(r'(\{.*\})', raw, re.DOTALL)
            if match:
                raw_json = match.group(1)
                data = json.loads(raw_json)
            else:
                raise
        
        # Ensure all keys exist for frontend safety
        for key in ["film", "audience", "platforms", "festivals", "comps"]:
            if key not in data:
                data[key] = {} if key in ["film", "audience"] else []
        if "genre" not in data["film"]: data["film"]["genre"] = "Drama"
        if "title" not in data["film"]: data["film"]["title"] = film_title
        
        return data
    except json.JSONDecodeError as jde:
        print(f"Failed to decode JSON from Gemini for {film_title}. Raw length: {len(raw)}")
        # Return a graceful basic fallback instead of crashing
        return {
            "film": {"title": film_title, "genre": "Drama", "budget": "TBD", "lang": "English", "themes": "General", "region": "Global"},
            "audience": {"segments": [], "traits": [], "dna": [50, 50, 50, 50, 50, 50]},
            "platforms": [], "festivals": [], "comps": []
        }


@app.post("/api/claude")
async def call_gemini(request: ClaudeRequest):
    if not GEMINI_API_KEY:
         raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
    try:
        model = genai.GenerativeModel(
            model_name=request.model,
            system_instruction=request.systemPrompt,
        )
        response = model.generate_content(
            request.userMessage,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=request.max_tokens,
            ),
        )
        text = response.text or "No response from Gemini."
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.get("/")
async def root():
    return {"status": "CINTEL API is running (OSINT enabled)", "version": "3.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "gemini_key_configured": bool(GEMINI_API_KEY)}
