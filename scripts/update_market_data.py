import yfinance as yf
import json
import os
import pandas as pd

def update_market_data():
    symbols = ['SPY', 'QQQ', 'DIA']
    data_file = os.path.join(os.path.dirname(__file__), '..', 'data.json')
    
    # Load existing data to ensure we keep the structure if needed
    if os.path.exists(data_file):
        with open(data_file, 'r') as f:
            data = json.load(f)
    else:
        data = {}

    import datetime
    current_month_str = datetime.datetime.now().strftime('%Y-%m')

    for symbol in symbols:
        print(f"Fetching data for {symbol}...")
        ticker = yf.Ticker(symbol)
        
        # Fetch max history with monthly interval
        hist = ticker.history(period="max", interval="1mo")
        
        if hist.empty:
            print(f"Warning: No data found for {symbol}.")
            continue
            
        # Clear existing data for the symbol to prevent discontinuities if yfinance adjusts prices
        data[symbol] = {}
            
        for date, row in hist.iterrows():
            month_str = date.strftime('%Y-%m')
            
            # Skip the current month since it hasn't ended and the adjusted close is incomplete
            if month_str >= current_month_str:
                continue
            
            # yfinance returns 'Close' as the adjusted close price
            close_price = row['Close']
            if pd.isna(close_price):
                continue
                
            data[symbol][month_str] = float(close_price)
            
    with open(data_file, 'w') as f:
        json.dump(data, f)
        
    print("Market data updated successfully!")

if __name__ == "__main__":
    update_market_data()
