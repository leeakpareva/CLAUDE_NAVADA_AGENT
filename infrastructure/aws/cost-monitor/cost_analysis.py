import boto3
import json
from datetime import datetime, timedelta
from decimal import Decimal


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def get_cost_and_usage():
    client = boto3.client('ce', region_name='us-east-1')

    # Get current month dates
    today = datetime.now()
    start_of_month = today.replace(day=1).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')

    # Get last month dates
    last_month = today.replace(day=1) - timedelta(days=1)
    start_of_last_month = last_month.replace(day=1).strftime('%Y-%m-%d')
    end_of_last_month = last_month.strftime('%Y-%m-%d')

    try:
        # Current month costs by service
        current_month_response = client.get_cost_and_usage(
            TimePeriod={
                'Start': start_of_month,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost', 'UnblendedCost', 'UsageQuantity'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'SERVICE'
                }
            ]
        )

        # Last month total
        last_month_response = client.get_cost_and_usage(
            TimePeriod={
                'Start': start_of_last_month,
                'End': end_of_last_month
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost']
        )

        print("=== AWS Cost Analysis (NAVADA Edge) ===\n")

        # Last month total
        last_month_total = 0
        if last_month_response['ResultsByTime']:
            last_month_total = float(last_month_response['ResultsByTime'][0]['Total']['BlendedCost']['Amount'])
            print(f"Last Month Total: ${last_month_total:.2f}")

        # Current month by service
        print(f"\nCurrent Month Breakdown (as of {today.strftime('%Y-%m-%d')}):")
        current_month_total = 0
        sorted_groups = []

        if current_month_response['ResultsByTime']:
            groups = current_month_response['ResultsByTime'][0].get('Groups', [])
            sorted_groups = sorted(groups, key=lambda x: float(x['Metrics']['BlendedCost']['Amount']), reverse=True)

            for group in sorted_groups:
                service = group['Keys'][0]
                blended = float(group['Metrics']['BlendedCost']['Amount'])
                unblended = float(group['Metrics']['UnblendedCost']['Amount'])
                usage = float(group['Metrics']['UsageQuantity']['Amount'])
                current_month_total += blended

                if abs(blended) > 0.001 or abs(unblended) > 0.001:
                    print(f"  {service}")
                    print(f"    Blended: ${blended:.6f}  Unblended: ${unblended:.6f}  Usage: {usage:.2f}")

        print(f"\nCurrent Month Total (Blended): ${current_month_total:.4f}")

        # Daily breakdown
        print(f"\n--- Daily Costs ---")
        daily_response = client.get_cost_and_usage(
            TimePeriod={
                'Start': start_of_month,
                'End': end_date
            },
            Granularity='DAILY',
            Metrics=['BlendedCost']
        )
        for day in daily_response['ResultsByTime']:
            date = day['TimePeriod']['Start']
            cost = float(day['Total']['BlendedCost']['Amount'])
            bar = '#' * int(cost * 10) if cost > 0 else '-'
            print(f"  {date}: ${cost:.4f} {bar}")

        return {
            'current_month_total': current_month_total,
            'last_month_total': last_month_total,
            'current_month_breakdown': sorted_groups
        }

    except Exception as e:
        print(f"Error retrieving cost data: {str(e)}")
        return None


if __name__ == "__main__":
    cost_data = get_cost_and_usage()
    if cost_data:
        with open('aws_costs.json', 'w') as f:
            json.dump(cost_data, f, cls=DecimalEncoder, indent=2)
        print("\nCost data saved to aws_costs.json")
