const { Sequelize } = require('sequelize')
const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
})

const sequelize = new Sequelize(
  process.env.DB_NAME || 'aws_app_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    
    pool: {
      max: process.env.DB_POOL_MAX || 10,
      min: process.env.DB_POOL_MIN || 0,
      acquire: process.env.DB_POOL_ACQUIRE || 30000,
      idle: process.env.DB_POOL_IDLE || 10000
    },
    
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    
    retry: {
      max: process.env.DB_RETRY_MAX || 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      backoffBase: 100,
      backoffExponent: 1.1
    }
  }
)

async function testConnection() {
  try {
    await sequelize.authenticate()
    logger.info('Database connection has been established successfully.')
    return true
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
    return false
  }
}

async function closeConnection() {
  try {
    await sequelize.close()
    logger.info('Database connection closed.')
  } catch (error) {
    logger.error('Error closing database connection:', error)
  }
}

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
  logger
}