# Webapp testing fallback (internal)

INTERNAL ONLY. This is not a standalone skill. Load this file only when `refine-motion` selected the Python Playwright fallback (MCP Playwright unavailable, or user override). Do not use this path when Playwright MCP tools are the active product for the run.

Base directory (from repo root):

`.agents/skills/refine-motion/references/webapp-testing-fallback/`

To test local web applications, write native Python Playwright scripts.

**Helper Scripts Available**:
- `scripts/with_server.py` - Manages server lifecycle (supports multiple servers)

**Always run scripts with `--help` first** to see usage. DO NOT read the source until you try running the script first and find that a customized solution is absolutely necessary. These scripts can be very large and thus pollute your context window. They exist to be called directly as black-box scripts rather than ingested into your context window.

Invoke helpers with paths relative to this fallback directory, or with the absolute/repo-relative path above.

## Decision Tree: Choosing Your Approach

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
    │         ├─ Success → Write Playwright script using selectors
    │         └─ Fails/Incomplete → Treat as dynamic (below)
    │
    └─ No (dynamic webapp) → Is the server already running?
        ├─ No → Run: python scripts/with_server.py --help
        │        Then use the helper + write simplified Playwright script
        │
        └─ Yes → Reconnaissance-then-action:
            1. Navigate and wait for networkidle
            2. Take screenshot or inspect DOM
            3. Identify selectors from rendered state
            4. Execute actions with discovered selectors
```

## Example: Using with_server.py

From repo root (Raparigator default port 3000):

```bash
python .agents/skills/refine-motion/references/webapp-testing-fallback/scripts/with_server.py --help
```

**Single server:**
```bash
python .agents/skills/refine-motion/references/webapp-testing-fallback/scripts/with_server.py \
  --server "npm run dev" --port 3000 -- python your_automation.py
```

**Multiple servers (e.g., backend + frontend):**
```bash
python .agents/skills/refine-motion/references/webapp-testing-fallback/scripts/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python your_automation.py
```

To create an automation script, include only Playwright logic (servers are managed automatically):
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    browser.close()
```

## Reconnaissance-Then-Action Pattern

1. **Inspect rendered DOM**:
   ```python
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   content = page.content()
   page.locator('button').all()
   ```

2. **Identify selectors** from inspection results

3. **Execute actions** using discovered selectors

## Common Pitfall

Do not inspect the DOM before waiting for `networkidle` on dynamic apps.
Do wait for `page.wait_for_load_state('networkidle')` before inspection.

## Best Practices

- Use bundled scripts as black boxes. Use `--help` to see usage, then invoke directly.
- Use `sync_playwright()` for synchronous scripts
- Always close the browser when done
- Use descriptive selectors: `text=`, `role=`, CSS selectors, or IDs
- Add appropriate waits: `page.wait_for_selector()` or `page.wait_for_timeout()`

## Reference Files

- **examples/** - Examples showing common patterns:
  - `element_discovery.py` - Discovering buttons, links, and inputs on a page
  - `static_html_automation.py` - Using file:// URLs for local HTML
  - `console_logging.py` - Capturing console logs during automation
