import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import Anthropic from '@anthropic-ai/sdk'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  CATEGORIES,
  KIDS_CATEGORY_ID,
  KIDS_AGE_BANDS,
  KIDS_DEFAULT_AGE_BAND,
  KIDS_SUB_CATEGORIES,
} from '../src/categories.js'
import { orchestrate } from './orchestrator.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

const app = express()
// Render terminates TLS at a proxy, so client IPs arrive via X-Forwarded-For.
// Without this, express-rate-limit would key every request on the proxy's IP.
app.set('trust proxy', 1)
app.use(express.json())

const recommendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' },
})

app.post('/api/recommend', recommendLimiter, async (req, res) => {
  if (!client) {
    return res.status(500).json({
      error: 'Server is missing ANTHROPIC_API_KEY. Set it in your .env file.',
    })
  }

  const { prompt, genreMode, categoryId, kidsFilters, excludeTitles, count } =
    req.body || {}

  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 500) {
    return res.status(400).json({ error: 'Invalid prompt.' })
  }

  const validCategoryId =
    typeof categoryId === 'string' && CATEGORIES.some((c) => c.id === categoryId)
      ? categoryId
      : null

  let validKidsFilters = {}
  if (validCategoryId === KIDS_CATEGORY_ID) {
    const ageBandId =
      kidsFilters && KIDS_AGE_BANDS.some((b) => b.id === kidsFilters.ageBandId)
        ? kidsFilters.ageBandId
        : KIDS_DEFAULT_AGE_BAND
    const subCategoryId =
      kidsFilters && KIDS_SUB_CATEGORIES.includes(kidsFilters.subCategoryId)
        ? kidsFilters.subCategoryId
        : null
    validKidsFilters = { ageBandId, subCategoryId }
  }

  // Accept raw feedback records from the client and pass them to the orchestrator.
  // The Taste Agent (server-side) processes these into a taste profile — we no
  // longer trust the client to send a pre-built profile string.
  const VALID_STATUSES = ['loved', 'want_to_read', 'not_for_me']
  const validFeedbackRecords = Array.isArray(req.body?.feedbackRecords)
    ? req.body.feedbackRecords
        .filter(
          (r) =>
            r &&
            typeof r.title === 'string' && r.title.trim() &&
            typeof r.author === 'string' && r.author.trim() &&
            VALID_STATUSES.includes(r.status)
        )
        .slice(0, 100)
        .map((r) => ({
          title: r.title.slice(0, 200),
          author: r.author.slice(0, 200),
          status: r.status,
        }))
    : []

  const validExcludeTitles = Array.isArray(excludeTitles)
    ? excludeTitles
        .filter((t) => typeof t === 'string' && t.trim())
        .slice(0, 30)
        .map((t) => t.slice(0, 200))
    : []

  const validCount = count === 1 ? 1 : null

  try {
    const result = await orchestrate(client, {
      userQuery: prompt,
      genreMode,
      categoryId: validCategoryId,
      kidsFilters: validCategoryId === KIDS_CATEGORY_ID ? validKidsFilters : null,
      feedbackRecords: validFeedbackRecords,
      excludeTitles: validExcludeTitles,
      count: validCount,
    })

    // Log the agent trace in dev so you can see what each agent did
    if (process.env.NODE_ENV !== 'production') {
      console.log('[orchestrator trace]', JSON.stringify(result.agentTrace, null, 2))
    }

    res.json({ books: result.books })
  } catch (err) {
    console.error('[orchestrator error]', err)
    res.status(502).json({ error: err.message || 'Failed to fetch recommendations. Please try again.' })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log(`PageMind server listening on http://localhost:${port}`)
})
