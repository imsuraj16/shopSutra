const { body, validationResult } = require("express-validator");


const respondErrors = (req,res,next)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}




const cartValidationRules = [


    body("items")
    .exists()
    .withMessage("Items are required")
    .isArray()
    .withMessage("Items must be an array"),

    body("items.*.productId")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId")
    .notEmpty()
    .withMessage("Product ID is required"),

    body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than 0")
    .notEmpty()
    .withMessage("Quantity is required"),

   

    respondErrors
]

module.exports = {
    cartValidationRules,
}