# Retirement Simulator

A lightweight, fully client-side web application designed to rigorously simulate and visualize long-term retirement investment growth using real historical market data.

## Features

- **Historical Accuracy**: Simulates investments against real historical monthly price data for major indices (S&P 500, Nasdaq 100, Dow Jones) dating back as far as 1993.
- **Dynamic IRS Limits**: Automatically calculates exact historical and projected IRS contribution limits (including age 50+ Catch-up limits) dynamically across the decades.
- **Rigorous Mathematics**: Utilizes a custom Binary Search Internal Rate of Return (IRR) algorithm to back-calculate the exact **Effective Annual Rate (EAR)** of the portfolio, treating cash flows precisely at the end of each month.
- **High-Fidelity Visualizations**: Interactive, responsive charts powered by Chart.js that overlay continuous monthly balance compounding onto categorical yearly contribution bars.
- **Serverless**: Zero build steps, zero dependencies, and no backend required. It runs purely in the browser via native HTML, CSS, and Vanilla JavaScript.

## Live Demo

🚀 **[Play with the Live Simulator Here](https://retirement-simulator-6qi.pages.dev/)**

## How to Run Locally

Because this is a pure client-side application, running it locally is incredibly simple:

1. **Option 1 (Simple):** Just double-click the `index.html` file to open it directly in any modern web browser.
2. **Option 2 (Local Server):** If you prefer to run it via a local server (recommended to avoid any local CORS warnings when fetching `data.json`), open your terminal in this directory and run:
   ```bash
   python3 -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your browser.

## Updating Market Data

The application uses a static `data.json` file to store historical monthly adjusted close prices. You can update this data with the latest market prices by running the included Python script:

```bash
pip install yfinance pandas
python3 scripts/update_market_data.py
```
This will fetch the latest monthly adjusted close prices for SPY, QQQ, and DIA from Yahoo Finance and update `data.json`.

## Documentation & Architecture

For a deep dive into the underlying systems, mathematical algorithms, CSS token systems, and Chart.js engineering, please refer to the comprehensive design document:

📖 **[ARCHITECTURE.md](./ARCHITECTURE.md)**

---
*Built with Antigravity AI*
