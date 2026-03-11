from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct


class NAVADANetworkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC (eu-west-2 has 3 AZs)
        vpc = ec2.Vpc(
            self, "NAVADA-VPC",
            ip_addresses=ec2.IpAddresses.cidr("172.31.0.0/16"),
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=20
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Security Group
        security_group = ec2.SecurityGroup(
            self, "NAVADA-DefaultSG",
            vpc=vpc,
            description="NAVADA default VPC security group",
            allow_all_outbound=True
        )

        # Self-referencing ingress rule
        security_group.add_ingress_rule(
            peer=security_group,
            connection=ec2.Port.all_traffic(),
            description="Allow all traffic from self"
        )

        # Outputs
        CfnOutput(self, "VPCId", value=vpc.vpc_id)
        CfnOutput(self, "SecurityGroupId", value=security_group.security_group_id)
