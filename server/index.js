import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import Anthropic from '@anthropic-ai/sdk'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildSystemPrompt } from '../src/categories.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

const app = express()
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

  const { prompt, genreMode } = req.body || {}

  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 500) {
    return res.status(400).json({ error: 'Invalid prompt.' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: buildSystemPrompt(genreMode),
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()

    const jsonText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '')

    let parsed
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return res.status(502).json({ error: 'Could not parse recommendations. Please try again.' })
    }

    if (!parsed.books || !Array.isArray(parsed.books)) {
      return res.status(502).json({ error: 'Unexpected response shape from API.' })
    }

    res.json({ books: parsed.books })
  } catch (err) {
    console.error(err)
    res.status(502).json({ error: 'Failed to fetch recommendations. Please try again.' })
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
