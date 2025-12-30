import sys
import os
import win32print

# Add project root to path
sys.path.append(os.getcwd())

from app.services import printer_service

def test_jobs():
    target = "HPRT HM-T260LR"
    print(f"Testing service wrapper for: {target}")
    
    jobs = printer_service.fetch_printer_jobs(target)
    print(f"Service returned {len(jobs)} jobs")
    for j in jobs:
        print(f"  ID={j['id']} Status={j['status_string']} ({j['status']}) Doc={j['document']}")

if __name__ == "__main__":
    test_jobs()
