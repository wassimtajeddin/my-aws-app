const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Product name is required'
      },
      notEmpty: {
        msg: 'Product name cannot be empty'
      },
      len: {
        args: [2, 100],
        msg: 'Product name must be between 2 and 100 characters'
      }
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 2000],
        msg: 'Description cannot exceed 2000 characters'
      }
    }
  },
  
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Price is required'
      },
      min: {
        args: [0],
        msg: 'Price cannot be negative'
      },
      max: {
        args: [1000000],
        msg: 'Price cannot exceed 1,000,000'
      },
      isDecimal: {
        msg: 'Price must be a valid decimal number'
      }
    },
    get() {
      const value = this.getDataValue('price')
      return value ? parseFloat(value) : null
    }
  },
  
  category: {
    type: DataTypes.ENUM('electronics', 'clothing', 'books', 'other'),
    defaultValue: 'other',
    allowNull: false,
    validate: {
      isIn: {
        args: [['electronics', 'clothing', 'books', 'other']],
        msg: 'Invalid category'
      }
    }
  },
  
  sku: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: {
        args: [0, 50],
        msg: 'SKU cannot exceed 50 characters'
      }
    }
  },
  
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Quantity cannot be negative'
      },
      max: {
        args: [1000000],
        msg: 'Quantity cannot exceed 1,000,000'
      },
      isInt: {
        msg: 'Quantity must be an integer'
      }
    }
  },
  
  in_stock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    field: 'in_stock'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    validate: {
      isValidJSON(value) {
        try {
          if (value && typeof value === 'object') {
            JSON.stringify(value)
          }
        } catch (error) {
          throw new Error('Metadata must be valid JSON')
        }
      }
    }
  },
  
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'created_at'
  },
  
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_items_name',
      fields: ['name']
    },
    {
      name: 'idx_items_category',
      fields: ['category']
    },
    {
      name: 'idx_items_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_items_price',
      fields: ['price']
    },
    {
      unique: true,
      fields: ['sku'],
      where: {
        sku: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    }
  ],
  hooks: {
    beforeUpdate: (item) => {
      item.updated_at = new Date()
    },
    beforeValidate: (item) => {
      if (item.name) item.name = item.name.trim()
      if (item.description) item.description = item.description.trim()
      if (item.sku) item.sku = item.sku.trim()
      
      if (item.price && item.price < 0) {
        item.price = 0
      }
      
      if (item.quantity !== undefined && item.quantity !== null) {
        item.quantity = Math.floor(item.quantity)
      }
    }
  }
})

Item.prototype.toJSON = function() {
  const values = Object.assign({}, this.get())
  
  if (values.price) {
    values.price = parseFloat(values.price)
  }
  
  const formatted = {}
  Object.keys(values).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
    formatted[camelKey] = values[key]
  })
  
  return formatted
}

Item.findBySku = async function(sku) {
  return this.findOne({ where: { sku } })
}

Item.findInStock = async function() {
  return this.findAll({ where: { in_stock: true } })
}

Item.getByCategory = async function(category, options = {}) {
  const { limit = 100, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = options
  
  return this.findAll({
    where: { category },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]]
  })
}

Item.getPriceRange = async function() {
  const result = await this.findAll({
    attributes: [
      [sequelize.fn('MIN', sequelize.col('price')), 'min'],
      [sequelize.fn('MAX', sequelize.col('price')), 'max'],
      [sequelize.fn('AVG', sequelize.col('price')), 'avg']
    ],
    raw: true
  })
  
  return {
    min: parseFloat(result[0].min) || 0,
    max: parseFloat(result[0].max) || 0,
    avg: parseFloat(result[0].avg) || 0
  }
}

module.exports = Item