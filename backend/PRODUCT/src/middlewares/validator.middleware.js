const { body, validationResult } = require("express-validator");
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

    body("price['amount']")
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

  body("price['currency']")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be one of INR, USD"),

  errorResponse,
];


module.exports = { productValidation };
