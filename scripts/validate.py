import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
results = []


def check(name, fn):
    try:
        fn()
        results.append((name, "PASS"))
        print(f"  [PASS] {name}")
    except Exception as e:
        results.append((name, "FAIL"))
        print(f"  [FAIL] {name}: {e}")


print("MRPL AI Workbench - Final Validation")
print("=" * 50)


def validate_yaml():
    import yaml
    d = yaml.safe_load((ROOT / "docker-compose.yml").read_text())
    assert set(d["services"]) == {"ollama", "backend", "frontend"}
    deps = d["services"]["backend"]["depends_on"]
    assert deps[0]["ollama"]["condition"] == "service_healthy"

check("docker-compose.yml is valid YAML with 3 services", validate_yaml)


def validate_backend():
    import os

    sys.path.insert(0, str(ROOT / "backend"))
    import main
    from fastapi.testclient import TestClient
    client = TestClient(main.app)
    r = client.get("/api/telemetry")
    assert r.status_code == 200
    body = r.json()
    for key in ("vram_used_gb", "vram_total_gb", "tokens_per_second", "model_loaded"):
        assert key in body
    expected_model = os.environ.get("OLLAMA_MODEL") or "llama3.2:1b"
    assert body["model_loaded"] == expected_model
    r2 = client.post("/api/chat", json={"prompt": "test", "role": "Safety & Health (SHE) Officer"})
    assert r2.status_code == 200
    assert r2.json()["role"] == "Safety & Health (SHE) Officer"
    assert r2.json()["model"] == expected_model

check("Backend: /api/telemetry + /api/chat return 200", validate_backend)


def validate_frontend():
    dist = ROOT / "frontend" / "dist"
    assert dist.exists()
    assert (dist / "index.html").exists()
    assert (dist / "mrpl-refinery.jpg").exists()
    js_files = list((dist / "assets").glob("*.js"))
    css_files = list((dist / "assets").glob("*.css"))
    assert js_files and css_files
    print(f"      -> JS: {js_files[0].name} CSS: {css_files[0].name}")

check("Frontend: production build with assets", validate_frontend)


def validate_image():
    from PIL import Image
    img = Image.open(ROOT / "frontend" / "public" / "mrpl-refinery.jpg")
    assert img.size == (1920, 1080)
    assert img.mode == "RGB"

check("Background: mrpl-refinery.jpg (1920x1080 RGB)", validate_image)


def validate_dockerfiles():
    assert (ROOT / "backend" / "Dockerfile").exists()
    assert (ROOT / "frontend" / "Dockerfile").exists()
    assert (ROOT / "frontend" / "nginx.conf").exists()

check("Dockerfiles + nginx.conf present", validate_dockerfiles)


def validate_design():
    app = (ROOT / "frontend" / "src" / "App.jsx").read_text(encoding="utf-8")
    assert "rgba(248, 250, 252, 0.70)" in app
    assert "mrpl-refinery.jpg" in app
    roles = (ROOT / "frontend" / "src" / "roles.js").read_text(encoding="utf-8")
    for name in ("Control Room Engineer", "Safety Officer SHE", "Field Technician", "Plant Admin"):
        assert name in roles

check("Design: 70% overlay + 4 roles defined", validate_design)


print("=" * 50)
fails = [r for r in results if r[1] == "FAIL"]
print(f"TOTAL: {len(results)} checks, {len(fails)} failed")
sys.exit(1 if fails else 0)