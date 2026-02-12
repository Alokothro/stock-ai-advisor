#!/usr/bin/env python3
import requests  # type: ignore
from bs4 import BeautifulSoup  # type: ignore

def fetch_sp500_list():
    """Fetch the complete S&P 500 list from Wikipedia"""
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the main table
    table = soup.find('table', {'id': 'constituents'})
    if not table:
        table = soup.find('table', {'class': 'wikitable sortable'})
    
    stocks = []
    
    # Parse table rows
    rows = table.find_all('tr')[1:]  # Skip header row
    
    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 3:
            # Extract symbol, name, and sector
            symbol = cols[0].text.strip()
            name = cols[1].text.strip()
            sector = cols[3].text.strip() if len(cols) > 3 else 'Unknown'
            
            stocks.append({
                'symbol': symbol,
                'name': name,
                'sector': sector
            })
    
    return stocks

if __name__ == "__main__":
    stocks = fetch_sp500_list()
    
    # Print TypeScript format
    print("export const SP500 = [")
    for stock in stocks:
        print(f"  {{ symbol: '{stock['symbol']}', name: '{stock['name']}', sector: '{stock['sector']}' }},")
    print("];")
    print(f"\n// Total: {len(stocks)} stocks")