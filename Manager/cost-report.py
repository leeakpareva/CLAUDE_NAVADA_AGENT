"""
NAVADA AI Cost vs Human Cost Visual Report
Generates charts showing ROI of AI automation vs human labour costs.
Outputs: Manager/reports/cost-report-YYYY-MM-DD.png + HTML email body
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
COST_LOG = os.path.join(SCRIPT_DIR, 'cost-log.json')
REPORTS_DIR = os.path.join(SCRIPT_DIR, 'reports')
os.makedirs(REPORTS_DIR, exist_ok=True)

TODAY = datetime.now().strftime('%Y-%m-%d')
OUTPUT_PNG = os.path.join(REPORTS_DIR, f'cost-report-{TODAY}.png')

# Load data
with open(COST_LOG, 'r') as f:
    entries = json.load(f)

print(f"Loaded {len(entries)} cost entries")

# --- Aggregate by model ---
by_model = defaultdict(lambda: {'calls': 0, 'cost_gbp': 0, 'human_cost_gbp': 0, 'human_mins': 0})
for e in entries:
    m = e['model']
    by_model[m]['calls'] += 1
    by_model[m]['cost_gbp'] += e.get('cost_gbp', 0)
    by_model[m]['human_cost_gbp'] += e.get('human_cost_gbp', 0)
    by_model[m]['human_mins'] += e.get('human_mins', 0)

# --- Aggregate by script ---
by_script = defaultdict(lambda: {'calls': 0, 'cost_gbp': 0, 'human_cost_gbp': 0})
for e in entries:
    s = e.get('script', 'other')
    by_script[s]['calls'] += 1
    by_script[s]['cost_gbp'] += e.get('cost_gbp', 0)
    by_script[s]['human_cost_gbp'] += e.get('human_cost_gbp', 0)

# --- Aggregate by hour ---
by_hour = defaultdict(lambda: {'calls': 0, 'cost_gbp': 0, 'human_cost_gbp': 0})
for e in entries:
    h = datetime.fromisoformat(e['timestamp'].replace('Z', '+00:00')).hour
    by_hour[h]['calls'] += 1
    by_hour[h]['cost_gbp'] += e.get('cost_gbp', 0)
    by_hour[h]['human_cost_gbp'] += e.get('human_cost_gbp', 0)

# --- Totals ---
total_ai = sum(e.get('cost_gbp', 0) for e in entries)
total_human = sum(e.get('human_cost_gbp', 0) for e in entries)
total_calls = len(entries)
total_human_hours = sum(e.get('human_mins', 0) for e in entries) / 60
roi = total_human / total_ai if total_ai > 0 else 0
savings = total_human - total_ai

# ================================================================
# CHARTS
# ================================================================
fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle(f'NAVADA AI Cost vs Human Labour Report — {TODAY}', fontsize=18, fontweight='bold', y=0.98)
fig.patch.set_facecolor('#0f1117')

NAVY = '#1a1f36'
CYAN = '#00d4ff'
ORANGE = '#ff6b35'
GREEN = '#00e676'
WHITE = '#ffffff'
GREY = '#8892b0'

for ax in axes.flat:
    ax.set_facecolor(NAVY)
    ax.tick_params(colors=GREY)
    ax.spines['bottom'].set_color(GREY)
    ax.spines['left'].set_color(GREY)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.xaxis.label.set_color(WHITE)
    ax.yaxis.label.set_color(WHITE)
    ax.title.set_color(WHITE)

# --- Chart 1: AI Cost vs Human Cost by Model (bar chart) ---
ax1 = axes[0, 0]
models = sorted(by_model.keys(), key=lambda m: by_model[m]['human_cost_gbp'], reverse=True)
x = np.arange(len(models))
width = 0.35
ai_costs = [by_model[m]['cost_gbp'] for m in models]
human_costs = [by_model[m]['human_cost_gbp'] for m in models]

bars1 = ax1.bar(x - width/2, human_costs, width, label='Human Cost (£)', color=ORANGE, alpha=0.9)
bars2 = ax1.bar(x + width/2, ai_costs, width, label='AI Cost (£)', color=CYAN, alpha=0.9)
ax1.set_xlabel('Model / Service')
ax1.set_ylabel('Cost (£)')
ax1.set_title('AI Cost vs Human Cost by Model')
ax1.set_xticks(x)
ax1.set_xticklabels([m.replace('gpt-4o-mini', 'GPT-4o-mini').replace('tts-1-hd', 'TTS-1-HD') for m in models],
                     rotation=30, ha='right', fontsize=9, color=GREY)
ax1.legend(facecolor=NAVY, edgecolor=GREY, labelcolor=WHITE)
ax1.yaxis.set_major_formatter(ticker.FormatStrFormatter('£%.2f'))

# --- Chart 2: Big number summary (text panel) ---
ax2 = axes[0, 1]
ax2.axis('off')
summary_text = (
    f"Total API Calls:  {total_calls:,}\n\n"
    f"AI Cost:          £{total_ai:.2f}\n"
    f"Human Equivalent: £{total_human:,.0f}\n\n"
    f"Savings:          £{savings:,.0f}\n"
    f"ROI Multiplier:   {roi:,.0f}x\n\n"
    f"Human Hours Saved: {total_human_hours:,.0f}h\n"
    f"(at £75/hr consultant rate)"
)
ax2.text(0.5, 0.5, summary_text, transform=ax2.transAxes, fontsize=16,
         verticalalignment='center', horizontalalignment='center',
         fontfamily='monospace', color=GREEN,
         bbox=dict(boxstyle='round,pad=0.8', facecolor=NAVY, edgecolor=CYAN, linewidth=2))
ax2.set_title('Cost Summary', color=WHITE, fontsize=14, fontweight='bold')

# --- Chart 3: Calls by Script (horizontal bar) ---
ax3 = axes[1, 0]
scripts = sorted(by_script.keys(), key=lambda s: by_script[s]['calls'])
script_calls = [by_script[s]['calls'] for s in scripts]
script_savings = [by_script[s]['human_cost_gbp'] - by_script[s]['cost_gbp'] for s in scripts]
colors = [CYAN if sv > 0 else ORANGE for sv in script_savings]
ax3.barh(scripts, script_calls, color=colors, alpha=0.85)
ax3.set_xlabel('Number of API Calls')
ax3.set_title('API Calls by Automation Script')
ax3.tick_params(axis='y', labelsize=9, colors=GREY)
for i, (v, sv) in enumerate(zip(script_calls, script_savings)):
    ax3.text(v + 2, i, f'{v} (saved £{sv:.0f})', va='center', fontsize=8, color=GREEN)

# --- Chart 4: Activity by Hour ---
ax4 = axes[1, 1]
hours = list(range(24))
hour_calls = [by_hour[h]['calls'] for h in hours]
hour_savings = [by_hour[h]['human_cost_gbp'] - by_hour[h]['cost_gbp'] for h in hours]
ax4.bar(hours, hour_calls, color=CYAN, alpha=0.7, label='API Calls')
ax4_twin = ax4.twinx()
ax4_twin.plot(hours, hour_savings, color=GREEN, linewidth=2, marker='o', markersize=4, label='Savings (£)')
ax4_twin.spines['right'].set_color(GREEN)
ax4_twin.tick_params(axis='y', colors=GREEN)
ax4_twin.yaxis.label.set_color(GREEN)
ax4_twin.set_ylabel('Savings (£)')
ax4.set_xlabel('Hour of Day')
ax4.set_ylabel('API Calls')
ax4.set_title('Activity & Savings by Hour')
ax4.set_xticks(range(0, 24, 2))
ax4.set_xticklabels([f'{h:02d}:00' for h in range(0, 24, 2)], fontsize=8, color=GREY)

# Combine legends
lines1, labels1 = ax4.get_legend_handles_labels()
lines2, labels2 = ax4_twin.get_legend_handles_labels()
ax4.legend(lines1 + lines2, labels1 + labels2, loc='upper left', facecolor=NAVY, edgecolor=GREY, labelcolor=WHITE)

plt.tight_layout(rect=[0, 0, 1, 0.95])
plt.savefig(OUTPUT_PNG, dpi=150, facecolor=fig.get_facecolor(), bbox_inches='tight')
plt.close()

print(f"Report saved: {OUTPUT_PNG}")
print(f"AI Cost: £{total_ai:.2f} | Human: £{total_human:,.0f} | ROI: {roi:,.0f}x | Saved: £{savings:,.0f}")

# --- Generate HTML snippet for email ---
html_summary = f"""
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
  <h2 style="color: #1a1f36;">NAVADA AI Cost vs Human Labour Report</h2>
  <p style="color: #555;">Date: {TODAY} | Generated by the NAVADA automated cost tracking system</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background: #1a1f36; color: #00d4ff;">
      <td style="padding: 12px; font-size: 14px;"><strong>Metric</strong></td>
      <td style="padding: 12px; font-size: 14px; text-align: right;"><strong>Value</strong></td>
    </tr>
    <tr style="background: #f8f9fa;">
      <td style="padding: 10px;">Total API Calls</td>
      <td style="padding: 10px; text-align: right; font-weight: bold;">{total_calls:,}</td>
    </tr>
    <tr>
      <td style="padding: 10px;">AI Cost (actual spend)</td>
      <td style="padding: 10px; text-align: right; font-weight: bold; color: #00d4ff;">£{total_ai:.2f}</td>
    </tr>
    <tr style="background: #f8f9fa;">
      <td style="padding: 10px;">Human Equivalent Cost</td>
      <td style="padding: 10px; text-align: right; font-weight: bold; color: #ff6b35;">£{total_human:,.0f}</td>
    </tr>
    <tr>
      <td style="padding: 10px;">Net Savings</td>
      <td style="padding: 10px; text-align: right; font-weight: bold; color: #00e676;">£{savings:,.0f}</td>
    </tr>
    <tr style="background: #f8f9fa;">
      <td style="padding: 10px;">ROI Multiplier</td>
      <td style="padding: 10px; text-align: right; font-weight: bold; color: #00e676;">{roi:,.0f}x cheaper with AI</td>
    </tr>
    <tr>
      <td style="padding: 10px;">Human Hours Saved</td>
      <td style="padding: 10px; text-align: right; font-weight: bold;">{total_human_hours:,.0f} hours</td>
    </tr>
  </table>

  <p style="color: #555; font-size: 13px; margin-top: 10px;">
    <em>Based on £75/hr senior AI consultant rate. Each API call is benchmarked against the
    time a skilled human would take to perform the equivalent task manually.</em>
  </p>
</div>
"""

html_path = os.path.join(REPORTS_DIR, f'cost-report-{TODAY}.html')
with open(html_path, 'w') as f:
    f.write(html_summary)
print(f"HTML snippet saved: {html_path}")
