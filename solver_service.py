#!/usr/bin/env python3
"""
CIT Campus Scheduling Platform - Standalone Solver & Validator Microservice.
Provides an HTTP interface for running the Python scheduling solver and official
validator when deploying the main Node.js frontend/API to serverless environments (such as Vercel).

Runs using the Python standard library with zero external dependencies.
Usage:
    python solver_service.py [--port 8000]
"""

import os
import sys
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from solver import generate_baseline_schedule, generate_disruption_schedule
from starter_pack.CrunchWeek_StarterPack.validator import run as run_validator, apply_disruption

PORT = int(os.environ.get("PORT", 8000))
API_SECRET = os.environ.get("SOLVER_API_SECRET", "").strip()


class SolverRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        response_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def _check_auth(self) -> bool:
        if not API_SECRET:
            return True
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            return token == API_SECRET
        return False

    def do_GET(self):
        if self.path == "/" or self.path == "/health":
            self._send_json(200, {
                "success": True,
                "status": "healthy",
                "service": "CIT Python Solver Microservice",
                "version": sys.version.split()[0],
                "auth_required": bool(API_SECRET)
            })
            return
        self._send_json(404, {"success": False, "error": {"message": "Endpoint not found"}})

    def do_POST(self):
        if not self._check_auth():
            self._send_json(401, {"success": False, "error": {"code": "UNAUTHORIZED", "message": "Invalid or missing solver API secret"}})
            return

        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            self._send_json(400, {"success": False, "error": {"message": "Empty request body"}})
            return

        try:
            body = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except Exception as e:
            self._send_json(400, {"success": False, "error": {"message": f"Malformed JSON: {str(e)}"}})
            return

        if self.path == "/solve":
            t0 = time.time()
            data = body.get("data")
            options = body.get("options", {})
            if not data or "sessions" not in data:
                self._send_json(400, {"success": False, "error": {"message": "Dataset must include 'sessions'"}})
                return

            team_name = options.get("teamName", "CIT Arch Team")
            seed = int(options.get("seed", 42))
            disruption = options.get("disruption")

            try:
                baseline_schedule = generate_baseline_schedule(data, team_name=team_name, seed=seed)
                baseline_report = run_validator(data, baseline_schedule, None)

                disrupted_schedule = None
                disrupted_report = None
                if disruption:
                    disrupted_data = apply_disruption(data, disruption)
                    disrupted_schedule, _ = generate_disruption_schedule(data, baseline_schedule, disruption)
                    disrupted_report = run_validator(disrupted_data, disrupted_schedule, baseline_schedule)

                exec_time_ms = int((time.time() - t0) * 1000)
                self._send_json(200, {
                    "success": True,
                    "baselineSchedule": baseline_schedule,
                    "disruptedSchedule": disrupted_schedule,
                    "baselineReport": baseline_report,
                    "disruptedReport": disrupted_report,
                    "executionTimeMs": exec_time_ms
                })
            except Exception as e:
                self._send_json(500, {"success": False, "error": {"message": f"Solver execution failed: {str(e)}"}})

        elif self.path == "/validate":
            data = body.get("data")
            schedule = body.get("schedule")
            options = body.get("options", {})
            if not data or not schedule:
                self._send_json(400, {"success": False, "error": {"message": "Both 'data' and 'schedule' are required"}})
                return

            try:
                val_data = data
                if options.get("disruption"):
                    val_data = apply_disruption(data, options["disruption"])
                baseline = options.get("baseline")
                report = run_validator(val_data, schedule, baseline)
                self._send_json(200, {"success": True, "report": report})
            except Exception as e:
                self._send_json(500, {"success": False, "error": {"message": f"Validation failed: {str(e)}"}})
        else:
            self._send_json(404, {"success": False, "error": {"message": "Endpoint not found"}})


def run(port=PORT):
    server = HTTPServer(("0.0.0.0", port), SolverRequestHandler)
    print(f"CIT Python Solver Microservice running at http://0.0.0.0:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
