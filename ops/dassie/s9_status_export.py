#!/usr/bin/env python3
"""Minimal S9 telemetry collector. No wallet access, secrets, peer IDs or balances."""
import datetime
import json
import os
import re
import subprocess
import tempfile

DEST = "/var/lib/s9-dassie-telemetry/status.json"

def count(text: str, pattern: str) -> int:
    match = re.search(pattern, text, re.MULTILINE)
    return int(match.group(1)) if match else 0

def build(text: str) -> dict:
    uplinks_section = re.search(r"^  Uplinks\s+(.*?)(?=^  Relay\s)", text, re.M | re.S)
    uplinks = len(re.findall(r"\bconnected\b", uplinks_section.group(1))) if uplinks_section else 0
    validators = re.search(r"(\d+) of (\d+) validators answering", text)
    packets = re.search(r"^  Packets\s+took \d+ Prepares:.*?^\s*(\d+) fulfilled, (\d+) rejected, (\d+) expired", text, re.M | re.S)
    return {
        "schema_version": 1,
        "node_label": "S9 Dassie",
        "observed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "service": "running" if " is running," in text else "unknown",
        "network": "xrpl-testnet",
        "mode": "periphery",
        "uplinks_connected": uplinks,
        "relay_connected": bool(re.search(r"^  Relay\s+.*connected", text, re.M)),
        "fulfilled_packets": int(packets.group(1)) if packets else 0,
        "rejected_packets": int(packets.group(2)) if packets else 0,
        "expired_packets": int(packets.group(3)) if packets else 0,
        "hub_validators_responding": int(validators.group(1)) if validators else 0,
        "hub_validators_total": int(validators.group(2)) if validators else 0,
    }

def main() -> None:
    # Locally installed Dassie binary; no shell, no wallet command, no credentials.
    result = subprocess.run(["/usr/local/bin/dassie", "status"], timeout=12,
                            text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True)
    payload = build(result.stdout)
    os.makedirs(os.path.dirname(DEST), mode=0o700, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".snapshot-", dir=os.path.dirname(DEST))
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            json.dump(payload, output, separators=(",", ":"), sort_keys=True)
            output.write("\n")
        os.replace(tmp, DEST)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)

if __name__ == "__main__":
    main()
