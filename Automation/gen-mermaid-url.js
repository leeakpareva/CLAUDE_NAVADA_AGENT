/**
 * Generate a mermaid.ink URL for the NAVADA WorldMonitor architecture diagram
 */

const mermaidDef = `graph TD
    subgraph CLIENTS["CLIENTS"]
        PHONE["iPhone / Mobile"]
        BROWSER["Browser"]
    end

    subgraph VERCEL["VERCEL EDGE PROXY"]
        DOMAIN["navada-world-view.xyz"]
        REWRITE["Rewrite Rules"]
    end

    subgraph TAILSCALE["TAILSCALE FUNNEL"]
        TS_URL["navada.tail394c36.ts.net"]
        TS_ROUTE["HTTPS to localhost:4173"]
    end

    subgraph HP_LAPTOP["HP LAPTOP - NAVADA HOME SERVER"]
        subgraph FRONTEND["Frontend Server :4173"]
            SERVE["serve-local.mjs"]
            DIST["dist/ build - 52+ panels"]
            PROXY_API["/api/* proxy"]
        end

        subgraph BACKEND["API Backend :46123"]
            API["local-api-server.mjs"]
            RSS["RSS Feeds"]
            CACHE["Response Cache"]
        end

        subgraph DASHBOARD["DASHBOARD PANELS"]
            MARKETS["Markets and Stocks"]
            CRYPTO["Crypto and DeFi"]
            ENERGY["Energy and Gold"]
            GEO["Geopolitical Intel"]
            ECON["Economic Data"]
            NEWS["AI News and Fires"]
            HEATMAP["Sector Heatmap"]
            STABLE["Stablecoins"]
        end
    end

    subgraph EXTERNAL["EXTERNAL DATA SOURCES"]
        FINNHUB["Finnhub"]
        FRED["FRED"]
        EIA["EIA"]
        COINGECKO["CoinGecko"]
        GDELT["GDELT"]
        NASA["NASA FIRMS"]
        OPENSKY["OpenSky"]
        POLYMARKET["Polymarket"]
    end

    subgraph AI_FALLBACK["AI FALLBACK LAYER"]
        XAI["xAI Grok"]
        OPENAI["OpenAI GPT-4o-mini"]
        GROQ["Groq LLM"]
    end

    subgraph LAN["LAN ACCESS"]
        LOCAL["192.168.0.58:4173"]
    end

    PHONE --> DOMAIN
    BROWSER --> DOMAIN
    DOMAIN --> REWRITE
    REWRITE --> TS_URL
    TS_URL --> TS_ROUTE
    TS_ROUTE --> SERVE
    PHONE -.-> LOCAL
    LOCAL -.-> SERVE

    SERVE --> DIST
    SERVE --> PROXY_API
    PROXY_API --> API
    API --> RSS
    API --> CACHE

    DIST --> MARKETS
    DIST --> CRYPTO
    DIST --> ENERGY
    DIST --> GEO
    DIST --> ECON
    DIST --> NEWS
    DIST --> HEATMAP
    DIST --> STABLE

    API --> FINNHUB
    API --> FRED
    API --> EIA
    API --> COINGECKO
    API --> GDELT
    API --> NASA
    API --> OPENSKY
    API --> POLYMARKET

    MARKETS -.->|fallback| XAI
    CRYPTO -.->|fallback| XAI
    ENERGY -.->|fallback| XAI
    STABLE -.->|fallback| XAI
    XAI -.->|if unavailable| OPENAI
    API -.->|summarize| GROQ`;

const payload = JSON.stringify({ code: mermaidDef, mermaid: { theme: 'dark' } });
const encoded = Buffer.from(payload).toString('base64url');
const url = `https://mermaid.ink/img/${encoded}`;

console.log(url);
