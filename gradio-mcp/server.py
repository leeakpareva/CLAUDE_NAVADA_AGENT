"""
NAVADA Gradio MCP Server
========================
Exposes useful tools to Claude Code via MCP protocol:
- Quant: option pricing, portfolio analysis, technical indicators
- Dashboard: quick chart/table generation
- Data: fetch stock data, compute statistics

Launch: py server.py
MCP endpoint: http://192.168.0.58:7860/gradio_api/mcp/sse
"""

import gradio as gr
import numpy as np
import json
from datetime import datetime, timedelta


# ── Quant Tools ──────────────────────────────────────────────────────────────

def black_scholes(
    spot_price: float,
    strike_price: float,
    time_to_expiry: float,
    risk_free_rate: float,
    volatility: float,
    option_type: str = "call"
) -> str:
    """Calculate Black-Scholes option price and Greeks.

    Args:
        spot_price: Current price of the underlying asset
        strike_price: Strike price of the option
        time_to_expiry: Time to expiration in years (e.g., 0.25 for 3 months)
        risk_free_rate: Annual risk-free interest rate (e.g., 0.05 for 5%)
        volatility: Annual volatility (e.g., 0.2 for 20%)
        option_type: 'call' or 'put'

    Returns:
        JSON with option price and Greeks (delta, gamma, theta, vega, rho)
    """
    from scipy.stats import norm

    S, K, T, r, sigma = spot_price, strike_price, time_to_expiry, risk_free_rate, volatility

    if T <= 0 or sigma <= 0:
        return json.dumps({"error": "Time and volatility must be positive"})

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    if option_type.lower() == "call":
        price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        delta = norm.cdf(d1)
    else:
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = norm.cdf(d1) - 1

    gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
    theta = (-(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
             - r * K * np.exp(-r * T) * norm.cdf(d2 if option_type == "call" else -d2)) / 365
    vega = S * norm.pdf(d1) * np.sqrt(T) / 100
    rho = (K * T * np.exp(-r * T) * norm.cdf(d2 if option_type == "call" else -d2)) / 100

    return json.dumps({
        "option_type": option_type,
        "price": round(price, 4),
        "greeks": {
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "theta": round(theta, 4),
            "vega": round(vega, 4),
            "rho": round(rho, 4)
        },
        "inputs": {"S": S, "K": K, "T": T, "r": r, "sigma": sigma}
    }, indent=2)


def portfolio_stats(
    returns_json: str,
    risk_free_rate: float = 0.05
) -> str:
    """Calculate portfolio statistics from a JSON array of daily returns.

    Args:
        returns_json: JSON array of daily returns, e.g. '[0.01, -0.02, 0.015, ...]'
        risk_free_rate: Annual risk-free rate for Sharpe ratio (default 0.05)

    Returns:
        JSON with annualized return, volatility, Sharpe ratio, max drawdown, VaR
    """
    returns = np.array(json.loads(returns_json))
    n = len(returns)

    ann_return = np.mean(returns) * 252
    ann_vol = np.std(returns, ddof=1) * np.sqrt(252)
    sharpe = (ann_return - risk_free_rate) / ann_vol if ann_vol > 0 else 0

    cumulative = np.cumprod(1 + returns)
    peak = np.maximum.accumulate(cumulative)
    drawdown = (cumulative - peak) / peak
    max_drawdown = np.min(drawdown)

    var_95 = np.percentile(returns, 5)
    var_99 = np.percentile(returns, 1)
    cvar_95 = np.mean(returns[returns <= var_95])

    return json.dumps({
        "n_observations": n,
        "annualized_return": round(float(ann_return), 4),
        "annualized_volatility": round(float(ann_vol), 4),
        "sharpe_ratio": round(float(sharpe), 4),
        "max_drawdown": round(float(max_drawdown), 4),
        "value_at_risk_95": round(float(var_95), 4),
        "value_at_risk_99": round(float(var_99), 4),
        "conditional_var_95": round(float(cvar_95), 4),
        "skewness": round(float(np.mean(((returns - np.mean(returns)) / np.std(returns))**3)), 4),
        "kurtosis": round(float(np.mean(((returns - np.mean(returns)) / np.std(returns))**4) - 3), 4)
    }, indent=2)


def monte_carlo_simulation(
    initial_price: float,
    annual_return: float,
    annual_volatility: float,
    days: int = 252,
    simulations: int = 1000
) -> str:
    """Run Monte Carlo simulation for asset price paths using Geometric Brownian Motion.

    Args:
        initial_price: Starting price of the asset
        annual_return: Expected annual return (e.g., 0.08 for 8%)
        annual_volatility: Annual volatility (e.g., 0.2 for 20%)
        days: Number of trading days to simulate (default 252 = 1 year)
        simulations: Number of simulation paths (default 1000)

    Returns:
        JSON with percentile outcomes and summary statistics
    """
    dt = 1 / 252
    mu, sigma = annual_return, annual_volatility

    np.random.seed(42)
    Z = np.random.standard_normal((days, simulations))
    daily_returns = np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z)

    price_paths = initial_price * np.cumprod(daily_returns, axis=0)
    final_prices = price_paths[-1, :]

    percentiles = [5, 25, 50, 75, 95]
    pct_values = {f"p{p}": round(float(np.percentile(final_prices, p)), 2) for p in percentiles}

    return json.dumps({
        "initial_price": initial_price,
        "days_simulated": days,
        "num_simulations": simulations,
        "final_price_percentiles": pct_values,
        "mean_final_price": round(float(np.mean(final_prices)), 2),
        "probability_of_loss": round(float(np.mean(final_prices < initial_price)), 4),
        "expected_return": round(float(np.mean(final_prices / initial_price - 1)), 4),
        "max_simulated": round(float(np.max(final_prices)), 2),
        "min_simulated": round(float(np.min(final_prices)), 2)
    }, indent=2)


def technical_indicators(
    prices_json: str,
    short_window: int = 20,
    long_window: int = 50
) -> str:
    """Calculate technical indicators from a JSON array of closing prices.

    Args:
        prices_json: JSON array of closing prices (oldest first), e.g. '[100, 101.5, 99.8, ...]'
        short_window: Short moving average period (default 20)
        long_window: Long moving average period (default 50)

    Returns:
        JSON with SMA, EMA, RSI, Bollinger Bands, MACD for the latest data point
    """
    prices = np.array(json.loads(prices_json), dtype=float)
    n = len(prices)

    if n < long_window:
        return json.dumps({"error": f"Need at least {long_window} prices, got {n}"})

    # SMAs
    sma_short = np.mean(prices[-short_window:])
    sma_long = np.mean(prices[-long_window:])

    # EMA helper
    def ema(data, span):
        alpha = 2 / (span + 1)
        result = np.zeros_like(data)
        result[0] = data[0]
        for i in range(1, len(data)):
            result[i] = alpha * data[i] + (1 - alpha) * result[i - 1]
        return result

    ema_short = ema(prices, short_window)[-1]
    ema_long = ema(prices, long_window)[-1]

    # RSI (14-period)
    deltas = np.diff(prices[-15:])
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains)
    avg_loss = np.mean(losses)
    rs = avg_gain / avg_loss if avg_loss > 0 else 100
    rsi = 100 - (100 / (1 + rs))

    # Bollinger Bands
    bb_sma = np.mean(prices[-short_window:])
    bb_std = np.std(prices[-short_window:], ddof=1)

    # MACD
    ema_12 = ema(prices, 12)
    ema_26 = ema(prices, 26)
    macd_line = ema_12 - ema_26
    signal_line = ema(macd_line, 9)

    current_price = prices[-1]

    return json.dumps({
        "current_price": round(float(current_price), 2),
        "sma": {
            f"sma_{short_window}": round(float(sma_short), 2),
            f"sma_{long_window}": round(float(sma_long), 2),
            "signal": "bullish" if sma_short > sma_long else "bearish"
        },
        "ema": {
            f"ema_{short_window}": round(float(ema_short), 2),
            f"ema_{long_window}": round(float(ema_long), 2)
        },
        "rsi_14": round(float(rsi), 2),
        "rsi_signal": "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral",
        "bollinger_bands": {
            "upper": round(float(bb_sma + 2 * bb_std), 2),
            "middle": round(float(bb_sma), 2),
            "lower": round(float(bb_sma - 2 * bb_std), 2),
            "position": "above_upper" if current_price > bb_sma + 2 * bb_std
                       else "below_lower" if current_price < bb_sma - 2 * bb_std
                       else "within_bands"
        },
        "macd": {
            "macd_line": round(float(macd_line[-1]), 4),
            "signal_line": round(float(signal_line[-1]), 4),
            "histogram": round(float(macd_line[-1] - signal_line[-1]), 4),
            "signal": "bullish" if macd_line[-1] > signal_line[-1] else "bearish"
        }
    }, indent=2)


def compound_interest(
    principal: float,
    annual_rate: float,
    years: int,
    monthly_contribution: float = 0,
    compounding: str = "monthly"
) -> str:
    """Calculate compound interest with optional regular contributions.

    Args:
        principal: Initial investment amount
        annual_rate: Annual interest rate (e.g., 0.07 for 7%)
        years: Investment horizon in years
        monthly_contribution: Monthly contribution amount (default 0)
        compounding: Compounding frequency - 'daily', 'monthly', 'quarterly', 'annually'

    Returns:
        JSON with final value, total contributions, total interest, and yearly breakdown
    """
    freq_map = {"daily": 365, "monthly": 12, "quarterly": 4, "annually": 1}
    n = freq_map.get(compounding, 12)
    r = annual_rate

    yearly = []
    balance = principal
    total_contributions = principal

    for year in range(1, years + 1):
        for period in range(n):
            balance *= (1 + r / n)
            if compounding == "monthly" or (compounding != "monthly" and period % (n // 12 or 1) == 0):
                balance += monthly_contribution
                total_contributions += monthly_contribution

        yearly.append({
            "year": year,
            "balance": round(balance, 2),
            "total_contributions": round(total_contributions, 2),
            "interest_earned": round(balance - total_contributions, 2)
        })

    return json.dumps({
        "final_balance": round(balance, 2),
        "total_contributions": round(total_contributions, 2),
        "total_interest": round(balance - total_contributions, 2),
        "return_on_investment": round((balance - total_contributions) / total_contributions * 100, 2),
        "yearly_breakdown": yearly
    }, indent=2)


def discounted_cash_flow(
    cash_flows_json: str,
    discount_rate: float,
    terminal_growth_rate: float = 0.02
) -> str:
    """Perform DCF valuation from projected free cash flows.

    Args:
        cash_flows_json: JSON array of projected annual free cash flows, e.g. '[100, 110, 121, ...]'
        discount_rate: WACC or required rate of return (e.g., 0.10 for 10%)
        terminal_growth_rate: Perpetual growth rate for terminal value (default 0.02)

    Returns:
        JSON with NPV, terminal value, enterprise value, and per-year PV breakdown
    """
    cash_flows = json.loads(cash_flows_json)
    r = discount_rate
    g = terminal_growth_rate

    pv_flows = []
    total_pv = 0
    for i, cf in enumerate(cash_flows, 1):
        pv = cf / (1 + r) ** i
        total_pv += pv
        pv_flows.append({"year": i, "cash_flow": cf, "present_value": round(pv, 2)})

    terminal_value = cash_flows[-1] * (1 + g) / (r - g) if r > g else 0
    pv_terminal = terminal_value / (1 + r) ** len(cash_flows)

    enterprise_value = total_pv + pv_terminal

    return json.dumps({
        "enterprise_value": round(enterprise_value, 2),
        "pv_of_cash_flows": round(total_pv, 2),
        "terminal_value": round(terminal_value, 2),
        "pv_of_terminal_value": round(pv_terminal, 2),
        "terminal_as_pct_of_ev": round(pv_terminal / enterprise_value * 100, 2) if enterprise_value > 0 else 0,
        "discount_rate": r,
        "terminal_growth_rate": g,
        "yearly_breakdown": pv_flows
    }, indent=2)


# ── Dashboard / Utility Tools ───────────────────────────────────────────────

def generate_chart_html(
    chart_type: str,
    data_json: str,
    title: str = "Chart",
    x_label: str = "X",
    y_label: str = "Y"
) -> str:
    """Generate an interactive Plotly chart and return it as embeddable HTML.

    Args:
        chart_type: Type of chart - 'line', 'bar', 'scatter', 'candlestick', 'histogram', 'pie'
        data_json: JSON data. For line/bar/scatter: {"x": [...], "y": [...]} or {"x": [...], "series": {"name1": [...], "name2": [...]}}. For candlestick: {"dates": [...], "open": [...], "high": [...], "low": [...], "close": [...]}. For pie: {"labels": [...], "values": [...]}
        title: Chart title
        x_label: X-axis label
        y_label: Y-axis label

    Returns:
        HTML string containing the interactive Plotly chart
    """
    import plotly.graph_objects as go

    data = json.loads(data_json)
    fig = go.Figure()

    if chart_type == "candlestick":
        fig.add_trace(go.Candlestick(
            x=data["dates"], open=data["open"],
            high=data["high"], low=data["low"], close=data["close"]
        ))
    elif chart_type == "pie":
        fig.add_trace(go.Pie(labels=data["labels"], values=data["values"]))
    elif "series" in data:
        for name, values in data["series"].items():
            trace_fn = {"line": go.Scatter, "bar": go.Bar, "scatter": go.Scatter}
            mode = "lines" if chart_type == "line" else "markers" if chart_type == "scatter" else None
            kwargs = {"x": data["x"], "y": values, "name": name}
            if mode:
                kwargs["mode"] = mode
            fig.add_trace(trace_fn.get(chart_type, go.Scatter)(**kwargs))
    else:
        if chart_type == "histogram":
            fig.add_trace(go.Histogram(x=data.get("x", data.get("y", []))))
        else:
            trace_fn = {"line": go.Scatter, "bar": go.Bar, "scatter": go.Scatter}
            mode = "lines" if chart_type == "line" else "markers" if chart_type == "scatter" else None
            kwargs = {"x": data["x"], "y": data["y"]}
            if mode:
                kwargs["mode"] = mode
            fig.add_trace(trace_fn.get(chart_type, go.Scatter)(**kwargs))

    fig.update_layout(title=title, xaxis_title=x_label, yaxis_title=y_label, template="plotly_dark")
    return fig.to_html(include_plotlyjs="cdn", full_html=True)


def data_table(
    headers_json: str,
    rows_json: str,
    title: str = "Data Table"
) -> str:
    """Create a formatted data table and return as markdown.

    Args:
        headers_json: JSON array of column headers, e.g. '["Date", "Open", "Close", "Volume"]'
        rows_json: JSON array of row arrays, e.g. '[["2024-01-01", 100, 105, 50000], ...]'
        title: Table title

    Returns:
        Markdown formatted table
    """
    headers = json.loads(headers_json)
    rows = json.loads(rows_json)

    md = f"## {title}\n\n"
    md += "| " + " | ".join(str(h) for h in headers) + " |\n"
    md += "| " + " | ".join("---" for _ in headers) + " |\n"
    for row in rows:
        md += "| " + " | ".join(str(v) for v in row) + " |\n"

    return md


# ── Build the Gradio App ─────────────────────────────────────────────────────

with gr.Blocks(title="NAVADA Quant Tools") as demo:
    gr.Markdown("# NAVADA Quant & Dashboard MCP Server")
    gr.Markdown("Tools exposed to Claude Code via MCP protocol. Use these from the terminal.")

    with gr.Tab("Black-Scholes"):
        gr.Interface(
            fn=black_scholes,
            inputs=[
                gr.Number(label="Spot Price", value=100),
                gr.Number(label="Strike Price", value=100),
                gr.Number(label="Time to Expiry (years)", value=0.25),
                gr.Number(label="Risk-Free Rate", value=0.05),
                gr.Number(label="Volatility", value=0.2),
                gr.Radio(["call", "put"], label="Option Type", value="call")
            ],
            outputs=gr.JSON(label="Result"),
            api_name="black_scholes"
        )

    with gr.Tab("Portfolio Stats"):
        gr.Interface(
            fn=portfolio_stats,
            inputs=[
                gr.Textbox(label="Daily Returns (JSON array)", placeholder='[0.01, -0.02, 0.015, ...]'),
                gr.Number(label="Risk-Free Rate", value=0.05)
            ],
            outputs=gr.JSON(label="Result"),
            api_name="portfolio_stats"
        )

    with gr.Tab("Monte Carlo"):
        gr.Interface(
            fn=monte_carlo_simulation,
            inputs=[
                gr.Number(label="Initial Price", value=100),
                gr.Number(label="Annual Return", value=0.08),
                gr.Number(label="Annual Volatility", value=0.2),
                gr.Number(label="Days", value=252),
                gr.Number(label="Simulations", value=1000)
            ],
            outputs=gr.JSON(label="Result"),
            api_name="monte_carlo"
        )

    with gr.Tab("Technical Indicators"):
        gr.Interface(
            fn=technical_indicators,
            inputs=[
                gr.Textbox(label="Closing Prices (JSON array)", placeholder='[100, 101.5, 99.8, ...]'),
                gr.Number(label="Short Window", value=20),
                gr.Number(label="Long Window", value=50)
            ],
            outputs=gr.JSON(label="Result"),
            api_name="technical_indicators"
        )

    with gr.Tab("Compound Interest"):
        gr.Interface(
            fn=compound_interest,
            inputs=[
                gr.Number(label="Principal", value=10000),
                gr.Number(label="Annual Rate", value=0.07),
                gr.Number(label="Years", value=10),
                gr.Number(label="Monthly Contribution", value=500),
                gr.Radio(["daily", "monthly", "quarterly", "annually"], label="Compounding", value="monthly")
            ],
            outputs=gr.JSON(label="Result"),
            api_name="compound_interest"
        )

    with gr.Tab("DCF Valuation"):
        gr.Interface(
            fn=discounted_cash_flow,
            inputs=[
                gr.Textbox(label="Cash Flows (JSON array)", placeholder='[100, 110, 121, 133]'),
                gr.Number(label="Discount Rate (WACC)", value=0.10),
                gr.Number(label="Terminal Growth Rate", value=0.02)
            ],
            outputs=gr.JSON(label="Result"),
            api_name="dcf_valuation"
        )

    with gr.Tab("Charts"):
        gr.Interface(
            fn=generate_chart_html,
            inputs=[
                gr.Radio(["line", "bar", "scatter", "candlestick", "histogram", "pie"], label="Chart Type", value="line"),
                gr.Textbox(label="Data (JSON)", placeholder='{"x": [1,2,3], "y": [10,20,30]}'),
                gr.Textbox(label="Title", value="Chart"),
                gr.Textbox(label="X Label", value="X"),
                gr.Textbox(label="Y Label", value="Y")
            ],
            outputs=gr.HTML(label="Chart"),
            api_name="generate_chart"
        )

    with gr.Tab("Data Table"):
        gr.Interface(
            fn=data_table,
            inputs=[
                gr.Textbox(label="Headers (JSON)", placeholder='["Col1", "Col2"]'),
                gr.Textbox(label="Rows (JSON)", placeholder='[["a", 1], ["b", 2]]'),
                gr.Textbox(label="Title", value="Data Table")
            ],
            outputs=gr.Markdown(label="Table"),
            api_name="data_table"
        )

    # MCP-only tools (no UI tab needed)
    gr.api(portfolio_stats)
    gr.api(monte_carlo_simulation)
    gr.api(technical_indicators)
    gr.api(compound_interest)
    gr.api(discounted_cash_flow)


if __name__ == "__main__":
    import sys, io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    print("Starting NAVADA Gradio MCP Server...")
    print("UI: http://192.168.0.58:7860")
    print("MCP: http://192.168.0.58:7860/gradio_api/mcp/sse")
    demo.launch(
        mcp_server=True,
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        theme=gr.themes.Soft()
    )
