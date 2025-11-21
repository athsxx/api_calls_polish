"""Simple script to search USPTO Data Set API (DSAPI) for enriched cited reference metadata."""

import aiohttp
import asyncio
import ssl
import json
from typing import List, Dict, Any


BASE_URL = "https://developer.uspto.gov/ds-api"
DATASET = "enriched_cited_reference_metadata"
VERSION = "v3"


async def search_uspto_dsapi(keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search USPTO DSAPI using a keyword.
    
    Args:
        keyword: Search keyword
        limit: Maximum number of results to return
        
    Returns:
        List of records from the API
    """
    # Build Lucene query - search for keyword in all fields
    # Using wildcard search: *:keyword*
    criteria = f"*:{keyword}*"
    
    url = f"{BASE_URL}/{DATASET}/{VERSION}/records"
    
    # Prepare form data as per Swagger spec
    form_data = aiohttp.FormData()
    form_data.add_field("criteria", criteria)
    form_data.add_field("start", "0")
    form_data.add_field("rows", str(limit))
    
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
                    
                    # Extract records from response
                    # Solr response format: { "response": { "docs": [...] } }
                    if "response" in data:
                        docs = data["response"].get("docs", [])
                        num_found = data["response"].get("numFound", 0)
                        print(f"\n✅ Found {num_found} total records (showing {len(docs)})\n")
                        return docs
                    elif "docs" in data:
                        return data["docs"]
                    else:
                        # If structure is different, return the data
                        return [data] if isinstance(data, dict) else []
                else:
                    error_text = await resp.text()
                    print(f"❌ Error {resp.status}: {error_text}")
                    return []
    except Exception as e:
        print(f"❌ Error making request: {e}")
        return []


def display_results(results: List[Dict[str, Any]]):
    """Display search results in a readable format."""
    if not results:
        print("No results found.")
        return
    
    for i, record in enumerate(results, 1):
        print(f"\n{'='*70}")
        print(f"Record {i}:")
        print(f"{'='*70}")
        
        # Display common fields
        if "patent_number" in record:
            print(f"Patent Number: {record['patent_number']}")
        if "patent_id" in record:
            print(f"Patent ID: {record['patent_id']}")
        if "publication_date" in record:
            print(f"Publication Date: {record['publication_date']}")
        if "application_date" in record:
            print(f"Application Date: {record['application_date']}")
        
        # Display all other fields
        for key, value in record.items():
            if key not in ["patent_number", "patent_id", "publication_date", "application_date"]:
                # Truncate long values
                if isinstance(value, str) and len(value) > 100:
                    print(f"{key}: {value[:100]}...")
                else:
                    print(f"{key}: {value}")


async def main():
    """Main function to get user input and search."""
    print("="*70)
    print("USPTO Data Set API - Enriched Cited Reference Metadata Search")
    print("="*70)
    
    # Get keyword from user
    keyword = input("\nEnter search keyword: ").strip()
    
    if not keyword:
        print("❌ No keyword provided. Exiting.")
        return
    
    # Get limit (optional)
    limit_input = input("Enter number of results (default 10): ").strip()
    try:
        limit = int(limit_input) if limit_input else 10
    except ValueError:
        limit = 10
    
    print(f"\n🔍 Searching for '{keyword}'...")
    
    # Search API
    results = await search_uspto_dsapi(keyword, limit=limit)
    
    # Display results
    display_results(results)
    
    # Option to save results
    if results:
        save = input("\n💾 Save results to JSON file? (y/n): ").strip().lower()
        if save == 'y':
            filename = f"uspto_search_{keyword.replace(' ', '_')}.json"
            with open(filename, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"✅ Results saved to {filename}")


if __name__ == "__main__":
    asyncio.run(main())

