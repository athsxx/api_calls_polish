"""Web interface for USPTO Patent Search."""

from flask import Flask, render_template, request, jsonify
import aiohttp
import asyncio
import ssl
from typing import List, Dict, Any
import json

app = Flask(__name__)

# USPTO DSAPI Configuration
BASE_URL = "https://developer.uspto.gov/ds-api"
DATASET = "enriched_cited_reference_metadata"
VERSION = "v3"


async def search_uspto_dsapi(keywords: List[str], operator: str = "AND", limit: int = 100) -> Dict[str, Any]:
    """
    Search USPTO DSAPI using keywords.
    
    Args:
        keywords: List of keywords
        operator: Boolean operator ("AND" or "OR")
        limit: Maximum number of results
        
    Returns:
        Dictionary with results and metadata
    """
    if not keywords:
        return {"error": "No keywords provided", "results": [], "total": 0}
    
    # Build Lucene query
    if operator.upper() == "AND":
        # Search for all keywords
        query_parts = [f"*:{kw}*" for kw in keywords]
        criteria = " AND ".join(query_parts)
    else:  # OR
        query_parts = [f"*:{kw}*" for kw in keywords]
        criteria = " OR ".join(query_parts)
    
    url = f"{BASE_URL}/{DATASET}/{VERSION}/records"
    
    # Prepare form data
    form_data = aiohttp.FormData()
    form_data.add_field("criteria", criteria)
    form_data.add_field("start", "0")
    form_data.add_field("rows", str(min(limit, 10000)))
    
    headers = {
        "Accept": "application/json"
    }
    
    # Create SSL context that doesn't verify certificates
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    connector = aiohttp.TCPConnector(ssl=ssl_context)
    
    try:
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(url, data=form_data, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    
                    # Extract records
                    if "response" in data:
                        docs = data["response"].get("docs", [])
                        num_found = data["response"].get("numFound", 0)
                        return {
                            "results": docs,
                            "total": num_found,
                            "shown": len(docs),
                            "query": criteria
                        }
                    elif "docs" in data:
                        return {
                            "results": data["docs"],
                            "total": len(data["docs"]),
                            "shown": len(data["docs"]),
                            "query": criteria
                        }
                    else:
                        return {
                            "results": [data] if isinstance(data, dict) else [],
                            "total": 1 if isinstance(data, dict) else 0,
                            "shown": 1 if isinstance(data, dict) else 0,
                            "query": criteria
                        }
                else:
                    error_text = await resp.text()
                    return {
                        "error": f"API Error {resp.status}: {error_text}",
                        "results": [],
                        "total": 0
                    }
    except Exception as e:
        return {
            "error": f"Error making request: {str(e)}",
            "results": [],
            "total": 0
        }


@app.route('/')
def index():
    """Render the main search page."""
    return render_template('index.html')


@app.route('/search', methods=['POST'])
def search():
    """Handle search requests."""
    data = request.get_json()
    
    keywords = data.get('keywords', [])
    operator = data.get('operator', 'AND')
    limit = int(data.get('limit', 500))  # Default to 500 results
    
    # Filter out empty keywords
    keywords = [kw.strip() for kw in keywords if kw.strip()]
    
    if not keywords:
        return jsonify({
            "error": "Please provide at least one keyword",
            "results": [],
            "total": 0
        })
    
    # Run async search
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(search_uspto_dsapi(keywords, operator, limit))
    loop.close()
    
    return jsonify(result)


@app.route('/api/fields', methods=['GET'])
def get_fields():
    """Get available searchable fields."""
    url = f"{BASE_URL}/{DATASET}/{VERSION}/fields"
    
    async def fetch_fields():
        headers = {"Accept": "application/json"}
        # Create SSL context that doesn't verify certificates
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        
        try:
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, headers=headers) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return {"error": f"Status {resp.status}"}
        except Exception as e:
            return {"error": str(e)}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(fetch_fields())
    loop.close()
    
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

