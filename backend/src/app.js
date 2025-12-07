require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const compression = require('compression')
const { sequelize } = require('./config/database')
const itemRoutes = require('./routes/items')
const errorHandler = require('./middleware/errorHandler')
const notFoundHandler = require('./middleware/notFoundHandler')

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"]
    }
  },
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (process.env.NODE_ENV !== 'test') {
  morgan.token('id', (req) => req.headers['x-request-id'] || '-')
  app.use(morgan(':id :method :url :status :response-time ms - :res[content-length]'))
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api', apiLimiter)

app.get('/health', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'aws-backend-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  try {
    await sequelize.authenticate()
    healthcheck.database = {
      status: 'healthy',
      type: sequelize.options.dialect,
      host: sequelize.config.host
    }
  } catch (error) {
    healthcheck.database = {
      status: 'unhealthy',
      error: error.message
    }
  }

  const used = process.memoryUsage()
  healthcheck.memory = {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`
  }

  const status = healthcheck.database.status === 'healthy' ? 200 : 503
  res.status(status).json(healthcheck)
})

app.use('/api/items', itemRoutes)

app.use(notFoundHandler)

app.use(errorHandler)

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    sequelize.close()
    process.exit(0)
  })
})

async function startServer() {
  try {
    await sequelize.authenticate()
    console.log('Database connection established successfully.')

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true })
      console.log('Database synced')
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Rate limit: ${process.env.RATE_LIMIT_MAX || 100} requests per 15min`)
    })

    return server
  } catch (error) {
    console.error('Unable to start server:', error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

module.exports = app