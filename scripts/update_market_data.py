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
    import calendar
    today = datetime.date.today()
    last_day_of_month = calendar.monthrange(today.year, today.month)[1]

    # If run on the last day of the month, the current month has closed and is included.
    # Otherwise, the current month is still incomplete, so only completed months up to the previous month are included.
    if today.day == last_day_of_month:
        cutoff_month = today.strftime('%Y-%m')
    else:
        prev_month = today.replace(day=1) - datetime.timedelta(days=1)
        cutoff_month = prev_month.strftime('%Y-%m')

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
            
            # Skip incomplete current/future months beyond the cutoff month
            if month_str > cutoff_month:
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
