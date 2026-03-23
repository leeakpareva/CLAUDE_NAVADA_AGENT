# SSH Security Hardening Report
**Date**: 2026-03-13
**Performed by**: Claude (Chief of Staff)
**Requested by**: Lee Akpareva

---

## Trigger
Amazon Q flagged port 22 open to `0.0.0.0/0` on EC2 as HIGH risk. Claude Code confirmed active brute-force attacks and remediated across all nodes.

## Threat Evidence (Pre-Fix)

| Metric | Value |
|--------|-------|
| Failed SSH attempts (24hr) | **1,018** |
| Failed SSH attempts (7 days) | **3,753** |
| Distinct attacker IPs (7 days) | **10+** |
| Top attacker | `77.101.129.166` (410 attempts, was actively connected) |
| Password auth | Disabled (key-only) - attackers could not succeed |
| fail2ban | Not installed - no rate limiting |

## Risk Assessment

Amazon Q rated this as **HIGH**. Our assessment: **MEDIUM** because password authentication was already disabled (key-only). The real risks were:
- SSH zero-day exploits (e.g. CVE-2024-6387 "regreSSHion")
- Resource consumption from 1K+ daily auth attempts
- Log noise obscuring real attacks

## Actions Taken

### 1. EC2 (navada-edge-ec2, 3.11.119.181)
- **Removed** `0.0.0.0/0` from port 22 inbound rule in security group `navada-edge-aws` (sg-04f276f8012370b03)
- **Kept** `100.64.0.0/10` (Tailscale) for SSH access
- **Verified** public SSH now times out (confirmed blocked)
- **Enabled** Tailscale SSH server (`tailscale set --ssh`)
- **Command**: `aws ec2 revoke-security-group-ingress --group-id sg-04f276f8012370b03 --protocol tcp --port 22 --cidr 0.0.0.0/0 --region eu-west-2`

### 2. Oracle VM (navada-oracle, 132.145.46.184)
- **Removed** `0.0.0.0/0` from port 22 in OCI Security List `Default Security List for vcn-20250304-1115`
- **Added** `100.64.0.0/10` (Tailscale) as only SSH source
- **Kept** ICMP rules (type 3 code 4, type 3 from 10.0.0.0/16)
- **Enabled** Tailscale SSH server (`tailscale set --ssh`)
- **Security List ID**: `ocid1.securitylist.oc1.uk-london-1.aaaaaaaavhpmkhlo7wzt37qesh7nepiqlxhnjopg4mkrmkcvmiirqrsorpqq`

### 3. HP (navada-edge-hp, 192.168.0.58)
- **No action needed** - behind home NAT router, no public exposure
- SSH accessible via Tailscale IP `100.121.187.67` and LAN `192.168.0.58`
- Tailscale SSH not supported (Windows)

### 4. ASUS (navada-asus-control, 192.168.0.18)
- **No action needed** - behind home NAT router, no public exposure
- **Fixed** `.ssh/config` permissions (removed CodexSandboxUsers inherited permissions that were blocking SSH)
- Tailscale SSH not supported (Windows)

### 5. Tailscale ACL Policy Update
- **Changed** SSH action from `"check"` to `"accept"` for `autogroup:member`
- **Before**: Browser re-authentication required every ~12 hours (broke headless cross-node SSH)
- **After**: All member nodes can SSH to each other without prompts
- **Session logging**: Active in Tailscale admin console (all SSH sessions recorded)
- **ACL location**: https://login.tailscale.com/admin/acls/file

## Final SSH Access Matrix

| From \ To | EC2 | Oracle | HP | ASUS |
|-----------|-----|--------|----|------|
| **ASUS** | Tailscale SSH | Tailscale SSH | Standard SSH | -- |
| **EC2** | -- | Tailscale SSH | Standard SSH | N/A (Win) |
| **Oracle** | Tailscale SSH | -- | Standard SSH | N/A (Win) |
| **HP** | Standard SSH | Standard SSH | -- | N/A (Win) |

All routes verified working 2026-03-13.

## Remaining Security Group Rules (EC2)

| Port | Source | Purpose | Status |
|------|--------|---------|--------|
| 22 | `100.64.0.0/10` | SSH via Tailscale | Secure |
| 80 | Cloudflare IPs only | HTTP | Secure |
| 443 | Cloudflare IPs only | HTTPS | Secure |
| 9090 | `0.0.0.0/0` + Cloudflare | NAVADA Dashboard + YOLO (app port, intentional) | Acceptable |
| All | `100.64.0.0/10` | Tailscale mesh traffic | Secure |

## Recommendations (Future)

1. **Install fail2ban on EC2 and Oracle** - extra layer even with Tailscale-only SSH
2. **Monitor Tailscale SSH logs** in admin console for anomalies
3. **Review port 9090** exposure periodically (currently needed for CF Worker access)
4. **Keep Tailscale updated** on all nodes (currently all on 1.94.2)

## Rollback (If Needed)

To re-open public SSH (not recommended):
```bash
# EC2
aws ec2 authorize-security-group-ingress --group-id sg-04f276f8012370b03 --protocol tcp --port 22 --cidr 0.0.0.0/0 --region eu-west-2

# Oracle - update security list to add back 0.0.0.0/0 source for port 22

# Tailscale ACL - change "accept" back to "check" if browser re-auth desired
```
