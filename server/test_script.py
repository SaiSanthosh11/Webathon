import os
import re
import json
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv("c:/Users/vijay/.gemini/antigravity/scratch/cintel/server/.env")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Copied from main.py gather_osint_context
def gather_osint_context(film_title: str) -> str:
    from googlesearch import search
    import urllib.request
    from bs4 import BeautifulSoup
    queries = [f"{film_title} movie box office collection budget", f"{film_title} movie reviews audience reception"]
    urls = []
    for q in queries:
        try:
            for url in search(q, num_results=1, advanced=False):
                urls.append(url)
        except Exception:
            pass
    urls = list(set(urls))[:2]
    scraped_text = ""
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            html = urllib.request.urlopen(req, timeout=5).read()
            soup = BeautifulSoup(html, 'html.parser')
            text = " ".join([p.get_text() for p in soup.find_all('p')])
            scraped_text += text[:1000] + "\n"
        except Exception:
            pass
    return scraped_text

async def main():
    film_title = "Kantara"
    osint_context = gather_osint_context(film_title)
    
    prompt = f"""
    You are an expert film intelligence AI evaluating real-time movie data.
    Based on your internal knowledge and the following LIVE scraped web data for the movie "{film_title}", generate a comprehensive JSON analysis.
    
    LIVE SCRAPED WEB DATA:
    {osint_context}
    
    You MUST return ONLY valid JSON matching this exact structure (no markdown fences, no extra text):
    {{
      "film": {{ "title": "{film_title}", "genre": "...", "budget": "...", "lang": "...", "themes": "...", "region": "..." }},
      "audience": {{ "segments": [], "traits": [], "dna": [85, 45, 60, 90, 30, 75] }},
      "platforms": [],
      "festivals": [],
      "comps": []
    }}
    """
    model = genai.GenerativeModel(model_name="gemini-2.5-flash")
    response = model.generate_content(prompt)
    
    raw = response.text.strip()
    print("--- RAW RESPONSE ---")
    print(raw)
    print("--------------------")
    
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        raw = match.group(0)
    
    try:
        data = json.loads(raw)
        print("JSON PARSE SUCCESS!")
    except json.JSONDecodeError as e:
        print("JSON PARSE ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
