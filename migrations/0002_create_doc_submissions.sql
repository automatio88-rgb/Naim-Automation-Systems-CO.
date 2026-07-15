-- Interactive document suite submissions
CREATE TABLE IF NOT EXISTS doc_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_type TEXT NOT NULL,            -- quotation | agreement | founding-partner | onboarding
  client_name TEXT,
  agency_name TEXT,
  email TEXT,
  phone TEXT,
  fields_json TEXT,                  -- all filled fields as JSON
  signature_data TEXT,               -- base64 PNG of drawn signature
  agreed INTEGER DEFAULT 0,          -- 1 = client ticked "I have read and agree"
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_submissions_type ON doc_submissions(doc_type);
CREATE INDEX IF NOT EXISTS idx_doc_submissions_created ON doc_submissions(created_at);
