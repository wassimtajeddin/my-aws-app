const express = require('express')
const router = express.Router()
const itemController = require('../controllers/itemController')

const validateCreateItem = (req, res, next) => {
  const { name, price } = req.body
  
  if (!name || !price) {
    return res.status(400).json({
      success: false,
      error: 'Name and price are required'
    })
  }
  
  next()
}

const validateUpdateItem = (req, res, next) => {
  const { price } = req.body
  
  if (price !== undefined && (isNaN(price) || price < 0)) {
    return res.status(400).json({
      success: false,
      error: 'Price must be a positive number'
    })
  }
  
  next()
}

router.get('/', itemController.getAllItems)
router.get('/stats', itemController.getItemStats)
router.get('/:id', itemController.getItemById)
router.post('/', validateCreateItem, itemController.createItem)
router.put('/:id', validateUpdateItem, itemController.updateItem)
router.patch('/:id/stock', itemController.updateStock)
router.delete('/:id', itemController.deleteItem)

module.exports = router