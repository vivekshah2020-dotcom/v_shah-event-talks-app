import os
import re
from flask import Flask, render_template, jsonify, request
import requests
import feedparser
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_content(html_content):
    """Clean HTML content to extract structured text and tags."""
    if not html_content:
        return "", []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Identify release categories/badges (e.g., Feature, Changed, Fixed, Deprecated, Announcement)
    categories = []
    text_upper = soup.get_text().upper()
    if "FEATURE" in text_upper or "NEW" in text_upper:
        categories.append("Feature")
    if "CHANGED" in text_upper or "UPDATE" in text_upper or "IMPROVED" in text_upper:
        categories.append("Changed")
    if "FIXED" in text_upper or "RESOLVED" in text_upper:
        categories.append("Fixed")
    if "DEPRECATED" in text_upper:
        categories.append("Deprecated")
    if "GENERAL AVAILABILITY" in text_upper or "GA" in text_upper:
        categories.append("GA")
    if "PREVIEW" in text_upper:
        categories.append("Preview")
        
    if not categories:
        categories.append("Update")
        
    # Convert links to target="_blank"
    for a in soup.find_all('a'):
        a['target'] = '_blank'
        a['rel'] = 'noopener noreferrer'
        
    cleaned_html = str(soup)
    plain_text = soup.get_text(separator=' ', strip=True)
    
    return cleaned_html, list(set(categories)), plain_text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(FEED_URL, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"Failed to fetch feed. HTTP Status: {response.status_code}"
            }), 500
            
        feed = feedparser.parse(response.content)
        
        notes = []
        for index, entry in enumerate(feed.entries):
            title = entry.get('title', 'BigQuery Release Note')
            link = entry.get('link', 'https://cloud.google.com/bigquery/docs/release-notes')
            published = entry.get('published', entry.get('updated', 'Recently'))
            
            # Extract content
            content_raw = ""
            if 'content' in entry and len(entry.content) > 0:
                content_raw = entry.content[0].value
            elif 'summary' in entry:
                content_raw = entry.summary
                
            cleaned_html, categories, plain_text = clean_html_content(content_raw)
            
            # Short summary for tweets (up to 180 chars)
            short_summary = plain_text[:180] + "..." if len(plain_text) > 180 else plain_text
            
            notes.append({
                "id": f"note-{index}",
                "title": title,
                "link": link,
                "published": published,
                "content_html": cleaned_html,
                "plain_text": plain_text,
                "short_summary": short_summary,
                "categories": categories
            })
            
        return jsonify({
            "status": "success",
            "count": len(notes),
            "feed_title": feed.feed.get('title', 'BigQuery Release Notes'),
            "updated": feed.feed.get('updated', ''),
            "notes": notes
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Run server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
