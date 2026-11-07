# Finessers answer-accuracy benchmark

The file `benchmarks/synthetic-general-30.json` contains 30 original, verified-answer multiple-choice questions covering math, science, civics, and geography. These are synthetic smoke-test questions, **not** a substitute for a held-out benchmark from an actual course.

Run the local backend (`npm run api`) and configure its provider first. To use Ollama:

```bash
curl -s -X POST http://127.0.0.1:8787/api/agent/provider -H 'Content-Type: application/json' -d '{"provider":"ollama"}'
npm run benchmark -- benchmarks/synthetic-general-30.json
```

The command prints per-question predictions and an overall score, and exits nonzero below 90%. It requires a running configured model. GitHub Actions only validates the benchmark dataset and scoring code; it does not have access to your local Ollama or OpenAI credentials. Re-run with an unseen set after changing prompts or models to avoid measuring memorization.
