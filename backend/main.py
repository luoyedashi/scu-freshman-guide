"""Analytics & profile collection API for scu-freshman-guide."""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from database import fetch_stats, init_db, insert_events, upsert_profile

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "change-me-in-production")
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "https://luoyedashi.github.io,http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if o.strip()
]

app = FastAPI(title="俊贤学长 · 川大新生指南 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class ProfileIn(BaseModel):
    session_id: str = Field(min_length=8, max_length=64)
    province: str = Field(min_length=2, max_length=16)
    category: str = Field(min_length=2, max_length=16)
    rank: int | None = Field(default=None, ge=1, le=500000)


class EventIn(BaseModel):
    session_id: str = Field(min_length=8, max_length=64)
    event_type: str = Field(min_length=2, max_length=32)
    payload: dict[str, Any] | None = None
    page_path: str | None = None
    referrer: str | None = None


class EventsBatchIn(BaseModel):
    events: list[EventIn] = Field(min_length=1, max_length=20)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/profile")
def save_profile(body: ProfileIn) -> dict[str, bool]:
    upsert_profile(body.session_id, body.province, body.category, body.rank)
    return {"ok": True}


@app.post("/api/v1/events")
def save_events(body: EventsBatchIn, request: Request) -> dict[str, int]:
    referrer = request.headers.get("referer")
    rows = []
    for ev in body.events:
        rows.append(
            {
                "session_id": ev.session_id,
                "event_type": ev.event_type,
                "payload": ev.payload,
                "page_path": ev.page_path,
                "referrer": ev.referrer or referrer,
            }
        )
    count = insert_events(rows)
    return {"accepted": count}


@app.get("/api/v1/stats")
def stats(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not token or token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return fetch_stats()


ADMIN_HTML = """<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>访问统计 · 俊贤学长</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#faf8f6;color:#333}
h1{font-size:20px;color:#b01f24} .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:16px 0}
.card{background:#fff;border:1px solid #e8e0d8;border-radius:10px;padding:14px;text-align:center}
.card strong{display:block;font-size:22px;color:#b01f24} table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
th,td{padding:8px;border-bottom:1px solid #eee;text-align:left} input{width:100%;padding:8px;margin:8px 0}
button{padding:10px 16px;background:#b01f24;color:#fff;border:none;border-radius:8px;cursor:pointer}
</style></head><body>
<h1>川大新生指南 · 数据汇总</h1>
<p>输入管理 Token 后查看（与服务器环境变量 ADMIN_TOKEN 一致）</p>
<input id="token" type="password" placeholder="ADMIN_TOKEN">
<button id="load">加载统计</button>
<div id="out"></div>
<script>
document.getElementById('load').onclick=async()=>{
  const t=document.getElementById('token').value;
  const r=await fetch('/api/v1/stats',{headers:{Authorization:'Bearer '+t}});
  if(!r.ok){document.getElementById('out').innerHTML='<p>鉴权失败</p>';return}
  const d=await r.json();
  const s=d.summary;
  document.getElementById('out').innerHTML=`
    <div class="grid">
      <div class="card">访问量<strong>${s.pageviews}</strong></div>
      <div class="card">独立会话<strong>${s.unique_sessions}</strong></div>
      <div class="card">档案提交<strong>${s.profiles_saved}</strong></div>
      <div class="card">模拟次数<strong>${s.sim_runs}</strong></div>
    </div>
    <h2>省份分布</h2><table><tr><th>省份</th><th>人数</th></tr>
      ${d.profiles_by_province.map(x=>`<tr><td>${x.province}</td><td>${x.c}</td></tr>`).join('')}</table>
    <h2>位次区间</h2><table><tr><th>区间</th><th>人数</th></tr>
      ${d.rank_buckets.map(x=>`<tr><td>${x.bucket}</td><td>${x.c}</td></tr>`).join('')}</table>
    <h2>近14日访问</h2><table><tr><th>日期</th><th>PV</th></tr>
      ${d.daily_pageviews.map(x=>`<tr><td>${x.day}</td><td>${x.c}</td></tr>`).join('')}</table>
    <h2>最近档案（30条）</h2><table><tr><th>省份</th><th>科类</th><th>位次</th><th>时间</th></tr>
      ${d.recent_profiles.map(x=>`<tr><td>${x.province}</td><td>${x.category}</td><td>${x.rank??'—'}</td><td>${x.updated_at}</td></tr>`).join('')}</table>`;
};
</script></body></html>"""


@app.get("/admin", response_class=HTMLResponse)
def admin_page() -> HTMLResponse:
    return HTMLResponse(ADMIN_HTML)
