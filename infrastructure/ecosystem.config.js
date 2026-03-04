module.exports = {
  apps: [
    {
      name: "mlflow",
      script: "C:/Users/leeak/AppData/Local/Programs/Python/Python312/python.exe",
      args: "-m mlflow server --host 0.0.0.0 --port 5000 --artifacts-destination C:/Users/leeak/CLAUDE_NAVADA_AGENT/mlflow-artifacts --allowed-hosts localhost,127.0.0.1,192.168.0.58,192.168.0.58:5000,100.121.187.67,100.121.187.67:5000,0.0.0.0,navada.local",
      cwd: "C:/Users/leeak/CLAUDE_NAVADA_AGENT",
      autorestart: true,
      max_restarts: 10,
      log_file: "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/mlflow.log",
      error_file: "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/mlflow-error.log",
      out_file: "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/mlflow-out.log"
    },
    {
      name: "jupyter-lab",
      script: "C:/Users/leeak/AppData/Local/Programs/Python/Python312/python.exe",
      args: "-m jupyterlab --ip 0.0.0.0 --port 8888 --no-browser --ServerApp.token=navada --ServerApp.allow_origin=*",
      cwd: "C:/Users/leeak/CLAUDE_NAVADA_AGENT",
      autorestart: true,
      max_restarts: 10,
      log_file: "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/jupyter.log",
      error_file: "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/jupyter-error.log",
      out_file: "C:/Users/leeak/CLAUDE_NAVADA_AGENT/Automation/logs/jupyter-out.log"
    }
  ]
};
