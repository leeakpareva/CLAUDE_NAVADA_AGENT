"""
Akpareva Family VC — Investment Projection Report
Generates a professional PDF with 3 scenarios, charts, and financial tables.
"""

import os
import io
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from datetime import datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF

# ─── CONFIG ────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'reports')
os.makedirs(OUTPUT_DIR, exist_ok=True)
PDF_PATH = os.path.join(OUTPUT_DIR, 'akpareva-vc-projection-2026.pdf')
CHART_DIR = os.path.join(os.path.dirname(__file__), 'reports', 'charts')
os.makedirs(CHART_DIR, exist_ok=True)

# ─── COLOURS ───────────────────────────────────────────────────
BLACK = '#111111'
DARK_GREY = '#333333'
MID_GREY = '#666666'
LIGHT_GREY = '#E8E8E8'
WHITE = '#FFFFFF'
ACCENT_GREEN = '#2ECC71'
ACCENT_AMBER = '#F39C12'
ACCENT_RED = '#E74C3C'
ACCENT_BLUE = '#3498DB'
NAVY = '#1A1A2E'

# ─── FINANCIAL MODEL ──────────────────────────────────────────
MONTHLY_CONTRIBUTION = 100  # £ per person
NUM_MEMBERS = 3
MONTHLY_POOL = MONTHLY_CONTRIBUTION * NUM_MEMBERS  # £300/month
MONTHS = 12  # 12-month projection
START_DATE = datetime(2026, 3, 1)

# Three Scenarios
SCENARIOS = {
    'Conservative': {
        'colour': ACCENT_GREEN,
        'monthly_return': 0.015,      # 1.5% monthly avg
        'annual_return': 0.18,
        'volatility': 0.03,
        'win_rate': 0.55,
        'max_drawdown': -0.08,
        'description': 'Low-risk diversified approach — index funds, blue-chip ETFs, bonds. '
                        'Steady compounding with minimal downside risk.',
        'allocation': {
            'Index Funds / ETFs': 50,
            'Blue-Chip Stocks': 25,
            'Bonds / Fixed Income': 15,
            'Cash Reserve': 10,
        },
    },
    'Moderate': {
        'colour': ACCENT_AMBER,
        'monthly_return': 0.035,      # 3.5% monthly avg
        'annual_return': 0.42,
        'volatility': 0.07,
        'win_rate': 0.50,
        'max_drawdown': -0.18,
        'description': 'Balanced risk — growth stocks, sector ETFs, selective crypto, '
                        'and small startup positions. Higher upside with managed risk.',
        'allocation': {
            'Growth Stocks': 35,
            'Sector ETFs (AI/Tech)': 25,
            'Crypto (BTC/ETH)': 20,
            'Early-Stage / Angel': 10,
            'Cash Reserve': 10,
        },
    },
    'Aggressive': {
        'colour': ACCENT_RED,
        'monthly_return': 0.06,       # 6% monthly avg
        'annual_return': 0.72,
        'volatility': 0.15,
        'win_rate': 0.42,
        'max_drawdown': -0.35,
        'description': 'High-risk, high-reward — concentrated crypto, micro-cap stocks, '
                        'angel investments, and speculative bets. Potential for significant '
                        'gains but with substantial drawdown risk.',
        'allocation': {
            'Crypto / Altcoins': 35,
            'Micro-Cap Stocks': 20,
            'Angel / Pre-Seed': 25,
            'Options / Leveraged': 10,
            'Cash Reserve': 10,
        },
    },
}


def simulate_portfolio(scenario, months=MONTHS, seed=42):
    """Monte Carlo simulation for portfolio growth with monthly contributions."""
    np.random.seed(seed)
    s = SCENARIOS[scenario]
    monthly_r = s['monthly_return']
    vol = s['volatility']

    # Monthly data
    balances = [0.0]
    contributions = [0.0]
    returns_pct = [0.0]
    cumulative_contrib = 0.0

    for m in range(1, months + 1):
        cumulative_contrib += MONTHLY_POOL
        contributions.append(cumulative_contrib)

        # Stochastic return with mean and volatility
        r = np.random.normal(monthly_r, vol)
        # Apply max drawdown floor
        r = max(r, s['max_drawdown'])

        prev_balance = balances[-1]
        new_balance = (prev_balance + MONTHLY_POOL) * (1 + r)
        new_balance = max(new_balance, 0)  # Can't go below zero

        balances.append(new_balance)
        returns_pct.append(r * 100)

    total_invested = cumulative_contrib
    final_value = balances[-1]
    total_return = final_value - total_invested
    roi = (total_return / total_invested) * 100 if total_invested > 0 else 0

    return {
        'balances': balances,
        'contributions': contributions,
        'returns_pct': returns_pct,
        'total_invested': total_invested,
        'final_value': final_value,
        'total_return': total_return,
        'roi': roi,
    }


def run_monte_carlo(scenario, n_sims=500, months=MONTHS):
    """Run multiple simulations and return percentile bands."""
    s = SCENARIOS[scenario]
    all_paths = []

    for i in range(n_sims):
        np.random.seed(i + 100)
        balances = [0.0]
        for m in range(1, months + 1):
            r = np.random.normal(s['monthly_return'], s['volatility'])
            r = max(r, s['max_drawdown'])
            prev = balances[-1]
            new_bal = (prev + MONTHLY_POOL) * (1 + r)
            new_bal = max(new_bal, 0)
            balances.append(new_bal)
        all_paths.append(balances)

    paths = np.array(all_paths)
    return {
        'p10': np.percentile(paths, 10, axis=0),
        'p25': np.percentile(paths, 25, axis=0),
        'p50': np.percentile(paths, 50, axis=0),
        'p75': np.percentile(paths, 75, axis=0),
        'p90': np.percentile(paths, 90, axis=0),
        'mean': np.mean(paths, axis=0),
    }


# ─── CHART GENERATION ─────────────────────────────────────────

plt.rcParams.update({
    'figure.facecolor': WHITE,
    'axes.facecolor': '#FAFAFA',
    'axes.edgecolor': '#CCCCCC',
    'axes.grid': True,
    'grid.color': '#E0E0E0',
    'grid.alpha': 0.7,
    'font.family': 'sans-serif',
    'font.size': 10,
})

month_labels = [(START_DATE + timedelta(days=30 * i)).strftime('%b\n%Y') for i in range(MONTHS + 1)]
month_nums = list(range(MONTHS + 1))


def chart_portfolio_growth():
    """Chart 1: Portfolio value over time — all 3 scenarios vs contributions."""
    fig, ax = plt.subplots(figsize=(10, 5.5))

    for name, s in SCENARIOS.items():
        sim = simulate_portfolio(name)
        ax.plot(month_nums, sim['balances'], linewidth=2.5, label=f"{name} (ROI: {sim['roi']:.1f}%)",
                color=s['colour'], zorder=3)

    # Contribution baseline
    contribs = [MONTHLY_POOL * i for i in range(MONTHS + 1)]
    ax.fill_between(month_nums, 0, contribs, alpha=0.12, color=ACCENT_BLUE, label='Total Contributed')
    ax.plot(month_nums, contribs, '--', color=ACCENT_BLUE, alpha=0.6, linewidth=1.5)

    ax.set_title('Portfolio Value Growth — 12 Month Projection', fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Month', fontsize=11)
    ax.set_ylabel('Portfolio Value (£)', fontsize=11)
    ax.set_xticks(month_nums)
    ax.set_xticklabels(month_labels, fontsize=8)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'£{x:,.0f}'))
    ax.legend(loc='upper left', fontsize=9, framealpha=0.9)

    fig.tight_layout()
    path = os.path.join(CHART_DIR, 'chart1_growth.png')
    fig.savefig(path, dpi=180, bbox_inches='tight')
    plt.close(fig)
    return path


def chart_monthly_returns():
    """Chart 2: Monthly returns bar chart for each scenario."""
    fig, axes = plt.subplots(1, 3, figsize=(10, 4), sharey=True)

    for idx, (name, s) in enumerate(SCENARIOS.items()):
        sim = simulate_portfolio(name)
        rets = sim['returns_pct'][1:]  # skip month 0
        bar_colors = [s['colour'] if r >= 0 else ACCENT_RED for r in rets]

        axes[idx].bar(range(1, MONTHS + 1), rets, color=bar_colors, alpha=0.85, edgecolor='white', linewidth=0.5)
        axes[idx].axhline(y=0, color=DARK_GREY, linewidth=0.8)
        axes[idx].set_title(name, fontsize=11, fontweight='bold')
        axes[idx].set_xlabel('Month', fontsize=9)
        if idx == 0:
            axes[idx].set_ylabel('Return (%)', fontsize=9)
        axes[idx].set_xticks(range(1, MONTHS + 1))
        axes[idx].yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'{x:.0f}%'))

    fig.suptitle('Monthly Returns by Scenario', fontsize=13, fontweight='bold', y=1.02)
    fig.tight_layout()
    path = os.path.join(CHART_DIR, 'chart2_monthly_returns.png')
    fig.savefig(path, dpi=180, bbox_inches='tight')
    plt.close(fig)
    return path


def chart_monte_carlo():
    """Chart 3: Monte Carlo confidence bands for each scenario."""
    fig, axes = plt.subplots(1, 3, figsize=(10, 4.5), sharey=False)

    for idx, (name, s) in enumerate(SCENARIOS.items()):
        mc = run_monte_carlo(name)
        ax = axes[idx]

        ax.fill_between(month_nums, mc['p10'], mc['p90'], alpha=0.15, color=s['colour'], label='10th–90th pct')
        ax.fill_between(month_nums, mc['p25'], mc['p75'], alpha=0.3, color=s['colour'], label='25th–75th pct')
        ax.plot(month_nums, mc['p50'], linewidth=2, color=s['colour'], label='Median')

        contribs = [MONTHLY_POOL * i for i in range(MONTHS + 1)]
        ax.plot(month_nums, contribs, '--', color=ACCENT_BLUE, alpha=0.5, linewidth=1)

        ax.set_title(name, fontsize=11, fontweight='bold')
        ax.set_xlabel('Month', fontsize=9)
        if idx == 0:
            ax.set_ylabel('Portfolio Value (£)', fontsize=9)
        ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'£{x:,.0f}'))
        ax.set_xticks(range(0, MONTHS + 1, 2))
        if idx == 2:
            ax.legend(fontsize=7, loc='upper left')

    fig.suptitle('Monte Carlo Simulation (500 runs) — Confidence Bands', fontsize=13, fontweight='bold', y=1.02)
    fig.tight_layout()
    path = os.path.join(CHART_DIR, 'chart3_monte_carlo.png')
    fig.savefig(path, dpi=180, bbox_inches='tight')
    plt.close(fig)
    return path


def chart_allocation_pies():
    """Chart 4: Asset allocation pie charts."""
    fig, axes = plt.subplots(1, 3, figsize=(10, 4))

    for idx, (name, s) in enumerate(SCENARIOS.items()):
        alloc = s['allocation']
        labels = list(alloc.keys())
        sizes = list(alloc.values())
        palette = plt.cm.Set3(np.linspace(0.1, 0.9, len(labels)))

        wedges, texts, autotexts = axes[idx].pie(
            sizes, labels=None, autopct='%1.0f%%',
            colors=palette, startangle=90, pctdistance=0.75,
            wedgeprops={'edgecolor': 'white', 'linewidth': 1.5}
        )
        for at in autotexts:
            at.set_fontsize(8)
            at.set_fontweight('bold')

        axes[idx].set_title(name, fontsize=11, fontweight='bold', pad=10)
        axes[idx].legend(labels, loc='lower center', fontsize=6.5,
                         bbox_to_anchor=(0.5, -0.15), ncol=2, frameon=False)

    fig.suptitle('Proposed Asset Allocation by Scenario', fontsize=13, fontweight='bold', y=1.0)
    fig.tight_layout()
    path = os.path.join(CHART_DIR, 'chart4_allocation.png')
    fig.savefig(path, dpi=180, bbox_inches='tight')
    plt.close(fig)
    return path


def chart_profit_loss_waterfall():
    """Chart 5: Profit/Loss waterfall — invested vs final value vs P&L."""
    fig, ax = plt.subplots(figsize=(10, 5))

    scenarios = list(SCENARIOS.keys())
    x = np.arange(len(scenarios))
    width = 0.25

    invested_vals = []
    final_vals = []
    pnl_vals = []

    for name in scenarios:
        sim = simulate_portfolio(name)
        invested_vals.append(sim['total_invested'])
        final_vals.append(sim['final_value'])
        pnl_vals.append(sim['total_return'])

    bars1 = ax.bar(x - width, invested_vals, width, label='Total Invested', color=ACCENT_BLUE, alpha=0.85)
    bars2 = ax.bar(x, final_vals, width, label='Final Value', color=[SCENARIOS[s]['colour'] for s in scenarios], alpha=0.85)
    pnl_colors = [ACCENT_GREEN if v >= 0 else ACCENT_RED for v in pnl_vals]
    bars3 = ax.bar(x + width, pnl_vals, width, label='Profit / Loss', color=pnl_colors, alpha=0.85,
                   edgecolor='white', linewidth=1)

    # Value labels
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width() / 2., h + 30,
                    f'£{h:,.0f}', ha='center', va='bottom', fontsize=8, fontweight='bold')

    ax.set_title('Investment Outcome Summary — 12 Months', fontsize=14, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(scenarios, fontsize=11)
    ax.set_ylabel('Amount (£)', fontsize=11)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'£{x:,.0f}'))
    ax.legend(fontsize=9)
    ax.axhline(y=0, color=DARK_GREY, linewidth=0.8)

    fig.tight_layout()
    path = os.path.join(CHART_DIR, 'chart5_waterfall.png')
    fig.savefig(path, dpi=180, bbox_inches='tight')
    plt.close(fig)
    return path


def chart_risk_reward():
    """Chart 6: Risk vs Reward scatter with scenario labels."""
    fig, ax = plt.subplots(figsize=(8, 5))

    for name, s in SCENARIOS.items():
        sim = simulate_portfolio(name)
        vol = s['volatility'] * 100
        roi = sim['roi']
        ax.scatter(vol, roi, s=300, color=s['colour'], edgecolors=DARK_GREY, linewidth=1.5, zorder=5)
        ax.annotate(f'{name}\nROI: {roi:.1f}%\nVol: {vol:.0f}%',
                    (vol, roi), textcoords="offset points", xytext=(15, -5),
                    fontsize=9, fontweight='bold',
                    arrowprops=dict(arrowstyle='->', color=MID_GREY, lw=1.2))

    ax.set_title('Risk vs Reward Profile', fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel('Monthly Volatility (%)', fontsize=11)
    ax.set_ylabel('12-Month ROI (%)', fontsize=11)
    ax.axhline(y=0, color=ACCENT_RED, linewidth=0.8, linestyle='--', alpha=0.5)

    fig.tight_layout()
    path = os.path.join(CHART_DIR, 'chart6_risk_reward.png')
    fig.savefig(path, dpi=180, bbox_inches='tight')
    plt.close(fig)
    return path


# ─── PDF GENERATION ────────────────────────────────────────────

def build_pdf():
    """Build the full projection report PDF."""
    # Generate all charts first
    print('Generating charts...')
    c1 = chart_portfolio_growth()
    c2 = chart_monthly_returns()
    c3 = chart_monte_carlo()
    c4 = chart_allocation_pies()
    c5 = chart_profit_loss_waterfall()
    c6 = chart_risk_reward()
    print('Charts generated.')

    doc = SimpleDocTemplate(
        PDF_PATH, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'],
                                  fontSize=24, leading=30, textColor=colors.HexColor(BLACK),
                                  spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold')

    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                     fontSize=12, leading=16, textColor=colors.HexColor(MID_GREY),
                                     alignment=TA_CENTER, spaceAfter=20)

    heading_style = ParagraphStyle('CustomH1', parent=styles['Heading1'],
                                    fontSize=16, leading=22, textColor=colors.HexColor(NAVY),
                                    spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold')

    h2_style = ParagraphStyle('CustomH2', parent=styles['Heading2'],
                               fontSize=13, leading=18, textColor=colors.HexColor(DARK_GREY),
                               spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold')

    body_style = ParagraphStyle('CustomBody', parent=styles['Normal'],
                                 fontSize=10, leading=15, textColor=colors.HexColor(DARK_GREY),
                                 spaceAfter=8, alignment=TA_JUSTIFY)

    small_style = ParagraphStyle('Small', parent=styles['Normal'],
                                  fontSize=8, leading=11, textColor=colors.HexColor(MID_GREY),
                                  alignment=TA_CENTER)

    callout_style = ParagraphStyle('Callout', parent=styles['Normal'],
                                    fontSize=10, leading=14, textColor=colors.HexColor(DARK_GREY),
                                    spaceBefore=6, spaceAfter=6, leftIndent=15,
                                    borderPadding=10, backColor=colors.HexColor('#F7F9FC'))

    elements = []

    # ── COVER PAGE ──
    elements.append(Spacer(1, 40 * mm))
    elements.append(Paragraph('NAVADA', ParagraphStyle('NavadaLogo', parent=title_style,
                              fontSize=36, textColor=colors.HexColor(BLACK), spaceAfter=4)))
    elements.append(HRFlowable(width='40%', thickness=2, color=colors.HexColor(BLACK),
                               spaceBefore=2, spaceAfter=10, hAlign='CENTER'))
    elements.append(Paragraph('AI Engineering & Consulting', ParagraphStyle('TagLine',
                              parent=subtitle_style, fontSize=10, textColor=colors.HexColor(MID_GREY))))
    elements.append(Spacer(1, 20 * mm))
    elements.append(Paragraph('Akpareva Family VC', title_style))
    elements.append(Paragraph('Investment Projection Report — 2026', subtitle_style))
    elements.append(Spacer(1, 15 * mm))

    cover_info = [
        ['Prepared for', 'Lee Akpareva, Tim Akpareva, Patrick Akpareva'],
        ['Prepared by', 'Claude — AI Chief of Staff, NAVADA'],
        ['Date', datetime.now().strftime('%d %B %Y')],
        ['Classification', 'Confidential — Family Use Only'],
        ['Model Version', 'v1.0 — Monte Carlo Projection'],
    ]
    cover_table = Table(cover_info, colWidths=[45 * mm, 100 * mm])
    cover_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor(MID_GREY)),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor(DARK_GREY)),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (0, -1), 12),
    ]))
    elements.append(cover_table)
    elements.append(Spacer(1, 30 * mm))
    elements.append(Paragraph(
        '<i>Disclaimer: This document contains projected financial outcomes based on Monte Carlo '
        'simulation models. Past performance does not guarantee future results. All investments '
        'carry risk including the potential loss of capital. This is for educational and planning '
        'purposes only and does not constitute financial advice.</i>', small_style))

    elements.append(PageBreak())

    # ── TABLE OF CONTENTS ──
    elements.append(Paragraph('Contents', heading_style))
    elements.append(Spacer(1, 5 * mm))
    toc_items = [
        '1. Executive Summary',
        '2. Investment Structure',
        '3. Scenario Definitions & Asset Allocation',
        '4. 12-Month Portfolio Growth Projections',
        '5. Monthly Returns Analysis',
        '6. Monte Carlo Simulation & Confidence Bands',
        '7. Profit & Loss Summary',
        '8. Risk vs Reward Analysis',
        '9. Operational Framework',
        '10. Next Steps & Recommendations',
    ]
    for item in toc_items:
        elements.append(Paragraph(item, ParagraphStyle('TOC', parent=body_style,
                                  fontSize=11, leading=20, leftIndent=10)))
    elements.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ──
    elements.append(Paragraph('1. Executive Summary', heading_style))
    elements.append(Paragraph(
        'This report presents a detailed financial projection for the proposed Akpareva Family '
        'Venture Capital initiative. The model analyses three distinct investment strategies over '
        'a 12-month test period, with each of the three members contributing £100 per month '
        '(£300/month pooled capital).', body_style))
    elements.append(Paragraph(
        'The purpose of this test phase is to validate the family\'s collective ability to make '
        'sound investment decisions, establish governance frameworks, and build a documented '
        'track record — all at a manageable level of financial commitment.', body_style))
    elements.append(Paragraph(
        'Using Monte Carlo simulation (500 runs per scenario), we project portfolio outcomes '
        'across Conservative, Moderate, and Aggressive strategies, providing realistic expectations '
        'for returns, risk exposure, and potential drawdowns.', body_style))

    # Quick summary table
    elements.append(Spacer(1, 5 * mm))
    summary_data = [['Metric', 'Conservative', 'Moderate', 'Aggressive']]
    sims = {name: simulate_portfolio(name) for name in SCENARIOS}
    summary_data.append(['Total Invested', '£3,600', '£3,600', '£3,600'])
    for name in SCENARIOS:
        pass
    summary_data.append(['Projected Final Value',
                         f'£{sims["Conservative"]["final_value"]:,.0f}',
                         f'£{sims["Moderate"]["final_value"]:,.0f}',
                         f'£{sims["Aggressive"]["final_value"]:,.0f}'])
    summary_data.append(['Projected P&L',
                         f'£{sims["Conservative"]["total_return"]:,.0f}',
                         f'£{sims["Moderate"]["total_return"]:,.0f}',
                         f'£{sims["Aggressive"]["total_return"]:,.0f}'])
    summary_data.append(['ROI',
                         f'{sims["Conservative"]["roi"]:.1f}%',
                         f'{sims["Moderate"]["roi"]:.1f}%',
                         f'{sims["Aggressive"]["roi"]:.1f}%'])
    summary_data.append(['Monthly Volatility', '3%', '7%', '15%'])
    summary_data.append(['Max Drawdown Risk', '-8%', '-18%', '-35%'])

    sum_table = Table(summary_data, colWidths=[40 * mm, 38 * mm, 38 * mm, 38 * mm])
    sum_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor(DARK_GREY)),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(sum_table)
    elements.append(PageBreak())

    # ── 2. INVESTMENT STRUCTURE ──
    elements.append(Paragraph('2. Investment Structure', heading_style))
    elements.append(Paragraph(
        'The Akpareva Family VC operates as a simple pooled investment vehicle with equal '
        'contributions and equal decision-making authority among all three members.', body_style))

    struct_data = [
        ['Parameter', 'Detail'],
        ['Members', 'Lee Akpareva, Tim Akpareva, Patrick Akpareva'],
        ['Monthly Contribution', '£100 per member'],
        ['Monthly Pool', '£300 (combined)'],
        ['Annual Deployment', '£3,600 total capital'],
        ['Decision Model', 'Consensus — all members vote on each investment'],
        ['Review Cycle', 'Monthly performance review, quarterly strategy review'],
        ['Test Duration', '6–12 months (initial phase)'],
        ['Exit Clause', 'Any member may exit with 30 days notice; capital returned pro-rata'],
        ['Reporting', 'Monthly P&L statement + portfolio dashboard (AI-generated)'],
        ['Research Support', 'NAVADA AI — market analysis, due diligence, trend monitoring'],
    ]
    struct_table = Table(struct_data, colWidths=[42 * mm, 118 * mm])
    struct_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor(DARK_GREY)),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(struct_table)
    elements.append(PageBreak())

    # ── 3. SCENARIO DEFINITIONS ──
    elements.append(Paragraph('3. Scenario Definitions & Asset Allocation', heading_style))
    for name, s in SCENARIOS.items():
        elements.append(Paragraph(f'Scenario: {name}', h2_style))
        elements.append(Paragraph(s['description'], body_style))

        alloc_data = [['Asset Class', 'Allocation']]
        for asset, pct in s['allocation'].items():
            alloc_data.append([asset, f'{pct}%'])
        alloc_table = Table(alloc_data, colWidths=[80 * mm, 30 * mm])
        alloc_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(s['colour'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(alloc_table)
        elements.append(Spacer(1, 3 * mm))

    elements.append(Spacer(1, 5 * mm))
    elements.append(Image(c4, width=170 * mm, height=68 * mm))
    elements.append(PageBreak())

    # ── 4. PORTFOLIO GROWTH ──
    elements.append(Paragraph('4. 12-Month Portfolio Growth Projections', heading_style))
    elements.append(Paragraph(
        'The chart below shows projected portfolio value over 12 months under each scenario, '
        'compared against the cumulative capital contributed (blue dashed line). Any value above '
        'the contribution line represents profit; below represents loss of capital.', body_style))
    elements.append(Spacer(1, 3 * mm))
    elements.append(Image(c1, width=170 * mm, height=93 * mm))
    elements.append(Spacer(1, 5 * mm))

    # Monthly breakdown table
    elements.append(Paragraph('Monthly Portfolio Breakdown', h2_style))
    monthly_data = [['Month', 'Contributed', 'Conservative', 'Moderate', 'Aggressive']]
    for m in range(1, MONTHS + 1):
        month_label = (START_DATE + timedelta(days=30 * m)).strftime('%b %Y')
        monthly_data.append([
            month_label,
            f'£{MONTHLY_POOL * m:,.0f}',
            f'£{sims["Conservative"]["balances"][m]:,.0f}',
            f'£{sims["Moderate"]["balances"][m]:,.0f}',
            f'£{sims["Aggressive"]["balances"][m]:,.0f}',
        ])

    m_table = Table(monthly_data, colWidths=[28 * mm, 28 * mm, 32 * mm, 32 * mm, 32 * mm])
    m_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(m_table)
    elements.append(PageBreak())

    # ── 5. MONTHLY RETURNS ──
    elements.append(Paragraph('5. Monthly Returns Analysis', heading_style))
    elements.append(Paragraph(
        'Individual monthly returns vary based on market conditions and volatility. Green bars '
        'indicate positive months; red bars indicate drawdowns. The Aggressive scenario shows '
        'wider swings — both larger gains and steeper losses.', body_style))
    elements.append(Spacer(1, 3 * mm))
    elements.append(Image(c2, width=170 * mm, height=68 * mm))
    elements.append(PageBreak())

    # ── 6. MONTE CARLO ──
    elements.append(Paragraph('6. Monte Carlo Simulation & Confidence Bands', heading_style))
    elements.append(Paragraph(
        'To account for uncertainty, we ran 500 independent simulations for each scenario using '
        'stochastic monthly returns. The shaded bands show the range of likely outcomes:', body_style))
    elements.append(Paragraph(
        '<b>Dark band</b>: 25th to 75th percentile (50% of outcomes fall here)<br/>'
        '<b>Light band</b>: 10th to 90th percentile (80% of outcomes fall here)<br/>'
        '<b>Solid line</b>: Median (50th percentile) outcome', body_style))
    elements.append(Spacer(1, 3 * mm))
    elements.append(Image(c3, width=170 * mm, height=76 * mm))

    # Percentile summary
    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph('Final Value Percentiles (Month 12)', h2_style))
    pct_data = [['Percentile', 'Conservative', 'Moderate', 'Aggressive']]
    for name_label, pct_key in [('Worst Case (10th)', 'p10'), ('Lower Quartile (25th)', 'p25'),
                                 ('Median (50th)', 'p50'), ('Upper Quartile (75th)', 'p75'),
                                 ('Best Case (90th)', 'p90')]:
        row = [name_label]
        for sname in SCENARIOS:
            mc = run_monte_carlo(sname)
            row.append(f'£{mc[pct_key][-1]:,.0f}')
        pct_data.append(row)

    pct_table = Table(pct_data, colWidths=[42 * mm, 35 * mm, 35 * mm, 35 * mm])
    pct_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(pct_table)
    elements.append(PageBreak())

    # ── 7. PROFIT & LOSS ──
    elements.append(Paragraph('7. Profit & Loss Summary', heading_style))
    elements.append(Paragraph(
        'The waterfall chart below compares total capital invested against projected final '
        'portfolio value and net profit/loss for each scenario.', body_style))
    elements.append(Spacer(1, 3 * mm))
    elements.append(Image(c5, width=170 * mm, height=85 * mm))

    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph('Per-Member Breakdown (12 months)', h2_style))
    member_data = [['Metric', 'Conservative', 'Moderate', 'Aggressive']]
    for label, key in [('Individual Invested', 'total_invested'),
                       ('Individual Share (Final)', 'final_value'),
                       ('Individual P&L', 'total_return')]:
        row = [label]
        for sname in SCENARIOS:
            val = sims[sname][key] / NUM_MEMBERS
            row.append(f'£{val:,.0f}')
        member_data.append(row)
    row = ['Individual ROI']
    for sname in SCENARIOS:
        row.append(f'{sims[sname]["roi"]:.1f}%')
    member_data.append(row)

    mem_table = Table(member_data, colWidths=[42 * mm, 35 * mm, 35 * mm, 35 * mm])
    mem_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(mem_table)
    elements.append(PageBreak())

    # ── 8. RISK VS REWARD ──
    elements.append(Paragraph('8. Risk vs Reward Analysis', heading_style))
    elements.append(Paragraph(
        'The risk-reward scatter plot positions each scenario by its monthly volatility '
        '(horizontal axis) against projected 12-month ROI (vertical axis). Higher volatility '
        'correlates with wider outcome ranges — the Aggressive scenario offers the highest '
        'potential returns but also the greatest risk of capital loss.', body_style))
    elements.append(Spacer(1, 3 * mm))
    elements.append(Image(c6, width=140 * mm, height=87 * mm))

    elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph('Key Risk Considerations', h2_style))
    risks = [
        '<b>Market Risk</b> — All investments are subject to market fluctuations. The test phase intentionally uses small amounts (£100/month) to limit downside.',
        '<b>Liquidity Risk</b> — Some assets (angel investments, pre-seed) may be illiquid for extended periods. The Conservative scenario avoids this entirely.',
        '<b>Concentration Risk</b> — The Aggressive scenario is heavily weighted toward crypto and startups. Diversification within each asset class is essential.',
        '<b>Behavioural Risk</b> — Emotional decision-making during drawdowns is the biggest risk in any investment operation. The governance framework and group consensus model helps mitigate this.',
        '<b>Currency Risk</b> — Some investments (US stocks, crypto) are denominated in USD. GBP/USD fluctuations affect returns.',
    ]
    for risk in risks:
        elements.append(Paragraph(f'&#8226; {risk}', ParagraphStyle('RiskItem', parent=body_style,
                                  leftIndent=10, spaceAfter=6)))
    elements.append(PageBreak())

    # ── 9. OPERATIONAL FRAMEWORK ──
    elements.append(Paragraph('9. Operational Framework', heading_style))
    elements.append(Paragraph(
        'To run the VC as a disciplined operation, the following framework is proposed:', body_style))

    ops_data = [
        ['Component', 'Detail'],
        ['Investment Committee', 'All 3 members — unanimous or 2/3 majority for each investment'],
        ['Monthly Meeting', 'First Sunday of each month — review portfolio, approve new investments'],
        ['Contribution Deadline', '1st of each month — £100 per member into shared account'],
        ['Research Pipeline', 'NAVADA AI generates weekly opportunity briefs; members flag interests'],
        ['Due Diligence', 'Minimum 48-hour research period before any investment decision'],
        ['Position Sizing', 'No single investment exceeds 25% of total portfolio'],
        ['Stop Loss', 'Automatic exit if any position drops 20% (adjustable by committee)'],
        ['Reporting', 'AI-generated monthly P&L report emailed to all members'],
        ['Record Keeping', 'All decisions documented — builds institutional knowledge and track record'],
        ['Review Gate', 'Full strategy review at month 3, 6, and 12'],
    ]
    ops_table = Table(ops_data, colWidths=[38 * mm, 122 * mm])
    ops_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(NAVY)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(LIGHT_GREY)),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(ops_table)
    elements.append(PageBreak())

    # ── 10. NEXT STEPS ──
    elements.append(Paragraph('10. Next Steps & Recommendations', heading_style))
    elements.append(Paragraph('<b>Recommended Approach: Start Conservative, Graduate Up</b>', body_style))
    elements.append(Paragraph(
        'Based on the projections, we recommend beginning with the <b>Conservative scenario</b> '
        'for months 1–3 to establish processes and build confidence. At the month-3 review, the '
        'committee can choose to shift toward the Moderate allocation based on performance and '
        'comfort level.', body_style))

    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph('Immediate Action Items', h2_style))
    actions = [
        '<b>Week 1</b> — All members confirm participation and preferred scenario',
        '<b>Week 2</b> — Open a shared investment account (e.g., Freetrade, Trading 212, or Wise)',
        '<b>Week 2</b> — First £100 contribution from each member',
        '<b>Week 3</b> — NAVADA AI delivers first research brief with 5–10 shortlisted opportunities',
        '<b>Week 4</b> — First investment committee meeting; deploy first capital allocation',
        '<b>Month 3</b> — First major review: assess returns, process efficiency, member satisfaction',
        '<b>Month 6</b> — Mid-point review: decide whether to scale up, adjust strategy, or wind down',
        '<b>Month 12</b> — Full evaluation: ROI, lessons learned, decision on permanent VC structure',
    ]
    for i, action in enumerate(actions):
        elements.append(Paragraph(f'{i + 1}. {action}', ParagraphStyle('ActionItem', parent=body_style,
                                  leftIndent=10, spaceAfter=5)))

    elements.append(Spacer(1, 15 * mm))
    elements.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor(LIGHT_GREY)))
    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph(
        'Prepared by <b>Claude — AI Chief of Staff</b> | NAVADA AI Engineering & Consulting<br/>'
        f'On behalf of <b>Lee Akpareva</b> | {datetime.now().strftime("%d %B %Y")}<br/>'
        'Contact: leeakpareva@gmail.com | www.navada-lab.space',
        ParagraphStyle('Footer', parent=body_style, fontSize=9, alignment=TA_CENTER,
                       textColor=colors.HexColor(MID_GREY))))

    # Build PDF
    print('Building PDF...')
    doc.build(elements)
    print(f'PDF saved to: {PDF_PATH}')
    return PDF_PATH


if __name__ == '__main__':
    pdf_path = build_pdf()
    print(f'\nDone: {pdf_path}')
