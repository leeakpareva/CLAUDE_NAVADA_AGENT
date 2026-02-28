"""
NAVADA AI Trading Lab — Alpaca OAuth Flow
Authenticates via OAuth to get API access token for Lee's Alpaca account.
"""

import http.server
import urllib.parse
import webbrowser
import json
import requests
from pathlib import Path

CLIENT_ID = '5cb38642a05a98e730512669ce0c4ab6'
CLIENT_SECRET = '5e32346488f3272015ce321c942ae4c49053503d'
REDIRECT_URI = 'http://localhost:9876/callback'
AUTH_URL = 'https://app.alpaca.markets/oauth/authorize'
TOKEN_URL = 'https://api.alpaca.markets/oauth/token'

PROJECT_ROOT = Path(__file__).parent.parent
TOKEN_FILE = PROJECT_ROOT / 'data' / 'alpaca_token.json'

auth_code = None


class OAuthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if 'code' in params:
            auth_code = params['code'][0]
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'''
            <html><body style="background:#0a0a0a; color:#fff; font-family:sans-serif; text-align:center; padding:60px;">
            <h1 style="color:#FFD43B;">NAVADA AI Trading Lab</h1>
            <p style="color:#4caf50; font-size:20px;">OAuth authorized successfully!</p>
            <p style="color:#888;">You can close this window.</p>
            </body></html>
            ''')
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Authorization failed')

    def log_message(self, format, *args):
        pass  # Suppress default logging


def start_oauth():
    """Open browser for Alpaca OAuth authorization."""
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': 'account:write trading data',
    }
    url = f'{AUTH_URL}?{urllib.parse.urlencode(params)}'

    print(f'\nOpening Alpaca OAuth in browser...')
    print(f'If browser does not open, visit:\n{url}\n')
    webbrowser.open(url)

    # Start local server to catch callback
    server = http.server.HTTPServer(('localhost', 9876), OAuthHandler)
    print('Waiting for authorization callback on localhost:9876...')
    server.handle_request()
    server.server_close()

    if not auth_code:
        print('ERROR: No authorization code received')
        return None

    print(f'Authorization code received. Exchanging for token...')

    # Exchange code for token
    resp = requests.post(TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'code': auth_code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
    })

    if resp.status_code != 200:
        print(f'ERROR: Token exchange failed ({resp.status_code}): {resp.text}')
        return None

    token_data = resp.json()
    TOKEN_FILE.write_text(json.dumps(token_data, indent=2), encoding='utf-8')

    print(f'\nOAuth token saved to {TOKEN_FILE}')
    print(f'Access token: {token_data.get("access_token", "N/A")[:20]}...')
    print(f'Token type: {token_data.get("token_type", "N/A")}')
    print(f'\nNAVADA Trading Lab now has full access to your Alpaca account.')

    return token_data


if __name__ == '__main__':
    start_oauth()
