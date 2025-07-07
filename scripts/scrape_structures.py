#!/usr/bin/env python3
"""
PotBS Structure Scraper
Scrapes the Category:Structures page to get all structure URLs.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse, parse_qs

def is_valid_structure_url(url, name):
    """
    Check if a URL and name represent a valid structure page.
    
    Args:
        url (str): The URL to check
        name (str): The link text/name to check
        
    Returns:
        bool: True if this appears to be a valid structure page
    """
    # Skip empty names
    if not name or not name.strip():
        return False
    
    # Parse the URL
    parsed = urlparse(url)
    
    # Skip non-wiki pages
    if not parsed.path.startswith('/wiki/'):
        return False
    
    # Skip talk pages
    if 'talk:' in parsed.path.lower():
        return False
    
    # Skip redlinks and edit pages
    if 'redlink=1' in parsed.query or 'action=edit' in parsed.query:
        return False
    
    # Skip category pages and other namespaces
    excluded_namespaces = [
        'category:', 'template:', 'file:', 'help:', 'special:',
        'user:', 'talk:', 'main_page', 'mediawiki:'
    ]
    
    path_lower = parsed.path.lower()
    for namespace in excluded_namespaces:
        if f'/wiki/{namespace}' in path_lower:
            return False
    
    # Skip common navigation elements
    navigation_terms = [
        'talk (0)', 'edit', 'history', 'what links here',
        'related changes', 'upload file', 'special pages',
        'printable version', 'permanent link', 'page information'
    ]
    
    name_lower = name.lower()
    for term in navigation_terms:
        if term in name_lower:
            return False
    
    return True

def scrape_structure_urls(category_url):
    """
    Scrape the Category:Structures page to get all structure URLs.
    
    Args:
        category_url (str): URL of the Category:Structures page
        
    Returns:
        list: List of structure dictionaries with 'name' and 'url'
    """
    print(f"Scraping Category:Structures page: {category_url}")
    
    try:
        # Add headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(category_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        structures = []
        
        # Look for the category members section - MediaWiki uses specific classes
        # Try different selectors that MediaWiki category pages use
        category_sections = [
            soup.find('div', class_='mw-category'),
            soup.find('div', class_='mw-category-generated'),
            soup.find('div', id='mw-pages'),
            soup.find('div', class_='CategoryTreeSection')
        ]
        
        category_content = None
        for section in category_sections:
            if section:
                category_content = section
                print(f"Found category content in: {section.get('class', section.get('id', 'unknown'))}")
                break
        
        if category_content:
            # Find all links within the category content
            links = category_content.find_all('a', href=True)
            print(f"Found {len(links)} links in category content")
            
            for link in links:
                href = link.get('href')
                link_text = link.get_text().strip()
                
                if href and link_text:
                    full_url = urljoin(category_url, href)
                    
                    # Use improved validation
                    if is_valid_structure_url(full_url, link_text):
                        structures.append({
                            'name': link_text,
                            'url': full_url
                        })
        
        # If still no structures found, try looking for list items or table cells
        if not structures:
            print("No category content found, trying list items...")
            
            # Look for lists that might contain structure links
            lists = soup.find_all(['ul', 'ol'])
            for list_elem in lists:
                list_links = list_elem.find_all('a', href=True)
                for link in list_links:
                    href = link.get('href')
                    link_text = link.get_text().strip()
                    
                    if href and link_text:
                        full_url = urljoin(category_url, href)
                        
                        # Use improved validation
                        if is_valid_structure_url(full_url, link_text):
                            structures.append({
                                'name': link_text,
                                'url': full_url
                            })
        
        # Remove duplicates based on URL
        unique_structures = []
        seen_urls = set()
        
        for structure in structures:
            if structure['url'] not in seen_urls:
                seen_urls.add(structure['url'])
                unique_structures.append(structure)
        
        print(f"Found {len(unique_structures)} unique structure links")
        return unique_structures
        
    except requests.RequestException as e:
        print(f"Error fetching {category_url}: {e}")
        return []
    except Exception as e:
        print(f"Error parsing {category_url}: {e}")
        return []

def main():
    """Main function to scrape structure URLs from Category:Structures."""
    
    # URL of the Category:Structures page
    category_url = "https://potbs.fandom.com/wiki/Category:Structures"
    
    print("PotBS Structure URL Scraper")
    print("=" * 50)
    
    # Scrape structure URLs
    structures = scrape_structure_urls(category_url)
    
    if structures:
        print(f"\nFound {len(structures)} structure links:")
        print("-" * 50)
        
        # Display first 10 structures as preview
        for i, structure in enumerate(structures[:10], 1):
            print(f"{i:2d}. {structure['name']}")
            print(f"    URL: {structure['url']}")
        
        if len(structures) > 10:
            print(f"... and {len(structures) - 10} more structures")
        
        # Save results to JSON file
        output_file = "potbs_structures_clean.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structures, f, indent=2, ensure_ascii=False)
        
        print(f"\nClean structure URLs saved to {output_file}")
        
    else:
        print("No structure links found.")
        print("This might indicate an issue with the page structure or parsing.")
        
        # Save raw HTML for debugging
        try:
            response = requests.get(category_url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            with open("category_structures_debug.html", 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("Raw HTML saved to category_structures_debug.html for inspection")
        except Exception as e:
            print(f"Could not save debug HTML: {e}")

if __name__ == "__main__":
    main() 