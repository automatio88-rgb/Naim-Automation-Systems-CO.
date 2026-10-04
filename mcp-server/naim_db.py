"""Thin Supabase (PostgREST) client used by the MCP server, the Hermes runner and the Telegram cockpit.

Env:
  SUPABASE_URL               https://<project>.supabase.co   (or the local preview origin)
  SUPABASE_SERVICE_ROLE_KEY  service role key (server-side only, never ship to a browser)
"""
from __future__ import annotations

import os
from typing import Any

import httpx


class DB:
    def __init__(self, url: str | None = None, key: str | None = None):
        url = (url or os.environ["SUPABASE_URL"]).rstrip("/")
        key = key or os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self.base = f"{url}/rest/v1"
        self.h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "return=representation"}
        self.c = httpx.Client(timeout=30)

    def _ok(self, r: httpx.Response) -> Any:
        if r.status_code >= 400:
            raise RuntimeError(f"{r.request.method} {r.request.url.path} -> {r.status_code}: {r.text[:300]}")
        return r.json() if r.content else None

    def select(self, table: str, **params: Any) -> list[dict]:
        return self._ok(self.c.get(f"{self.base}/{table}", headers=self.h, params=params))

    def one(self, table: str, **params: Any) -> dict | None:
        rows = self.select(table, limit=1, **params)
        return rows[0] if rows else None

    def insert(self, table: str, rows: dict | list[dict]) -> list[dict]:
        return self._ok(self.c.post(f"{self.base}/{table}", headers=self.h, json=rows))

    def update(self, table: str, patch: dict, **match: Any) -> list[dict]:
        if not match:
            raise ValueError("update without a filter is not allowed")
        return self._ok(self.c.patch(f"{self.base}/{table}", headers=self.h, params=match, json=patch))

    def upsert(self, table: str, rows: dict | list[dict]) -> list[dict]:
        h = {**self.h, "Prefer": "return=representation,resolution=merge-duplicates"}
        return self._ok(self.c.post(f"{self.base}/{table}", headers=h, json=rows))

    def rpc(self, fn: str, args: dict | None = None) -> Any:
        return self._ok(self.c.post(f"{self.base}/rpc/{fn}", headers=self.h, json=args or {}))

    def count(self, table: str, **params: Any) -> int:
        h = {**self.h, "Prefer": "count=exact"}
        r = self.c.head(f"{self.base}/{table}", headers=h, params=params)
        if r.status_code >= 400:
            raise RuntimeError(f"count {table} -> {r.status_code}")
        return int(r.headers.get("content-range", "*/0").split("/")[-1] or 0)