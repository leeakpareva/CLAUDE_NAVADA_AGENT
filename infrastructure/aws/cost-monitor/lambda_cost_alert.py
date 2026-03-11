import json
import boto3
from datetime import datetime, timedelta


def lambda_handler(event, context):
    ce_client = boto3.client('ce')
    sns_client = boto3.client('sns')

    # Get yesterday's costs
    yesterday = datetime.now() - timedelta(days=1)
    start_date = yesterday.strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')

    try:
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='DAILY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'SERVICE'
                }
            ]
        )

        total_cost = 0
        cost_breakdown = []

        if response['ResultsByTime']:
            groups = response['ResultsByTime'][0].get('Groups', [])

            for group in groups:
                service = group['Keys'][0]
                cost = float(group['Metrics']['BlendedCost']['Amount'])
                total_cost += cost

                if cost > 0:
                    cost_breakdown.append({
                        'service': service,
                        'cost': cost
                    })

        cost_breakdown.sort(key=lambda x: x['cost'], reverse=True)

        message = f"Daily AWS Cost Report for {start_date}\n"
        message += f"Total Cost: ${total_cost:.2f}\n\n"
        message += "Top Services:\n"

        for item in cost_breakdown[:5]:
            message += f"  {item['service']}: ${item['cost']:.2f}\n"

        # Send SNS notification if cost exceeds threshold
        if total_cost > 5.00:
            sns_client.publish(
                TopicArn=f'arn:aws:sns:eu-west-2:{boto3.client("sts").get_caller_identity()["Account"]}:navada-cost-alerts',
                Message=message,
                Subject=f'NAVADA Cost Alert: ${total_cost:.2f}'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'total_cost': total_cost,
                'cost_breakdown': cost_breakdown
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
