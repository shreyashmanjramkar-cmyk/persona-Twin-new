import io
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
from PIL import Image
import google.generativeai as genai
from app.config import settings

class DocumentService:
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_content))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            # If it's an image-based PDF, pypdf returns an empty string. Let's use Gemini to read it!
            if not text.strip() and settings.LLM_API_KEY:
                print("PDF appears to be image-based. Falling back to Gemini Vision OCR...")
                genai.configure(api_key=settings.LLM_API_KEY)
                model = genai.GenerativeModel('gemini-3.6-flash')
                response = model.generate_content([
                    "Extract all text from this document accurately.", 
                    {"mime_type": "application/pdf", "data": file_content}
                ])
                text = response.text

            return text
        except Exception as e:
            print(f"PDF Extraction Error: {e}")
            return ""

    def extract_text_from_url(self, url: str) -> str:
        try:
            # Handle Twitter/X URLs specially with twifork (installed as twikit)
            if "twitter.com" in url or "x.com" in url:
                try:
                    import asyncio
                    from twikit import Client
                    
                    # Extract username from URL (e.g. x.com/elonmusk -> elonmusk)
                    username = url.split('/')[-1].split('?')[0]
                    
                    if not settings.TWITTER_USERNAME or not settings.TWITTER_PASSWORD:
                        return f"URL: {url}\nScraped Text: Twitter scraping requires credentials in .env (TWITTER_USERNAME, TWITTER_PASSWORD). Please add them to enable Twifork extraction."
                        
                    async def fetch_twitter():
                        client = Client('en-US')
                        # Log in
                        await client.login(
                            auth_info_1=settings.TWITTER_USERNAME,
                            auth_info_2=settings.TWITTER_EMAIL,
                            password=settings.TWITTER_PASSWORD
                        )
                        
                        user = await client.get_user_by_screen_name(username)
                        text_parts = [
                            f"Twitter Username: {user.screen_name}",
                            f"Name: {user.name}",
                            f"Biography/Description: {user.description}",
                            f"Followers: {user.followers_count}",
                            f"Location: {user.location}",
                            "\nRecent Tweets:"
                        ]
                        
                        tweets = await client.get_user_tweets(user.id, 'Tweet')
                        if tweets:
                            for tweet in tweets[:5]:
                                text_parts.append(f"- {tweet.text}")
                                
                        return "\n".join(text_parts)
                        
                    # We are likely running in a sync context (FastAPI endpoint def is sync), so run asyncio event loop
                    # If this raises a RuntimeError about event loop, we can use a new one
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            # If loop is already running, we might need a workaround, but usually FastAPI worker threads don't have running loops for def functions
                            import nest_asyncio
                            nest_asyncio.apply()
                        return loop.run_until_complete(fetch_twitter())
                    except RuntimeError:
                        return asyncio.run(fetch_twitter())
                except Exception as e:
                    print(f"Twifork Extraction Error: {e}")
                    # Fallback to standard scraping if twifork fails
                    pass

            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract meta tags (crucial for social media sites like Instagram/LinkedIn that block main text scraping)
            meta_desc = ""
            desc_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
            if desc_tag and desc_tag.get('content'):
                meta_desc = desc_tag['content']
                
            title = ""
            if soup.title and soup.title.string:
                title = soup.title.string
            
            # Extract JSON-LD structured data (often contains full post text/author for social media)
            import json
            json_ld_data = []
            for script in soup.find_all('script', type='application/ld+json'):
                if script.string:
                    try:
                        data = json.loads(script.string)
                        # Only keep relevant text to save tokens
                        json_ld_data.append(json.dumps(data, indent=2))
                    except:
                        pass
            
            json_ld_text = "\n".join(json_ld_data)
            
            # Extract main text
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.extract()
            text = soup.get_text(separator=' ')
            
            # Clean up extra whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            main_text = '\n'.join(chunk for chunk in chunks if chunk)
            
            # Combine meta info (which works on social media) with main text
            return f"Page Title: {title}\nPage Summary/Bio: {meta_desc}\n\nStructured Data (JSON-LD):\n{json_ld_text}\n\nPage Content:\n{main_text}"
        except Exception as e:
            print(f"URL Extraction Error: {e}")
            return ""

    def extract_text_from_image(self, file_content: bytes) -> str:
        # Use Gemini Vision for image understanding
        if not settings.LLM_API_KEY:
            return "Image analysis unavailable (No LLM API key)."
            
        try:
            genai.configure(api_key=settings.LLM_API_KEY)
            model = genai.GenerativeModel('gemini-3.6-flash')
            image = Image.open(io.BytesIO(file_content))
            response = model.generate_content(["Describe this image in detail. Extract any relevant facts, text, or context.", image])
            return response.text
        except Exception as e:
            print(f"Image Extraction Error: {e}")
            return ""

document_service = DocumentService()
