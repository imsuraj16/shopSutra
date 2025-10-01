const { body, validationResult,param } = require("express-validator");
const sanitizehtml = require("sanitize-html");

const errorResponse = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const productValidation = [
  body("title")
    // .isString()
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .customSanitizer((value) =>
      sanitizehtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      })
    ),

  body("description")
    // .isString()
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .customSanitizer((value) =>
      sanitizehtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      })
    ),

  // Validate normalized nested price fields (set by normalizeProductBody)
  body("price.amount")
    .notEmpty()
    .withMessage("Price amount is required")
    .isNumeric()
    .withMessage("Price amount must be a number")
    .custom((value) => {
      if (value <= 0) {
        throw new Error("Price amount must be greater than zero");
      }
      return true;
    }),

  body("price.currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be one of INR, USD"),

  errorResponse,
];

const updateProductvalidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .customSanitizer((value) =>
      sanitizehtml(value, { allowedTags: [], allowedAttributes: {} })
    ),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty")
    .customSanitizer((value) =>
      sanitizehtml(value, { allowedTags: [], allowedAttributes: {} })
    ),

    body('price')
    .optional()
    .custom((value)=>{
      if(typeof value !== 'object' || Array.isArray(value) || value === null){
        throw new Error("Price must be an object with amount and currency fields");
      }
      return true;
    }),

  body("price.amount")
    .optional()
    .notEmpty()
    .withMessage("Price amount cannot be empty")
    .isNumeric()
    .withMessage("Price amount must be a number")
    .custom((value) => {
      if (value <= 0) {
        throw new Error("Price amount must be greater than zero");
      }
      return true;
    }),

  body("price.currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be one of INR, USD"),

  errorResponse,
];

const paramsValidation = [
 param("productId")
    .isMongoId()
    .withMessage("Invalid product ID"),
  errorResponse,
];

module.exports = { productValidation, updateProductvalidation, paramsValidation };
