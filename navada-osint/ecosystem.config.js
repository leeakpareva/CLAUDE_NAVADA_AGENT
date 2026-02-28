module.exports = {
  apps: [
    {
      name: "navada-osint",
      script: "node",
      args: "node_modules/next/dist/bin/next start -p 4000 -H 0.0.0.0",
      cwd: "C:/Users/leeak/Alex/navada-osint",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "worldmonitor",
      script: "node",
      args: "node_modules/vite/bin/vite.js --port 4001 --host 0.0.0.0",
      cwd: "C:/Users/leeak/Alex/navada-osint/worldmonitor-repo",
      env: {
        VITE_VARIANT: "full",
      },
    },
  ],
};
