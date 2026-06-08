const { asyncWrapper } = require("../utils/asyncWrapper.js");
const { AppError } = require("../utils/errors/AppError.js");
const { AddressModel } = require("../models/pg/address.model.js");

// Add a new address
const addAddress = asyncWrapper(async (req, res, next) => {
  const {
    streetLine1,
    streetLine2,
    city,
    state,
    postalCode,
    country,
    isDefault,
  } = req.body;

  const newAddress = await AddressModel.create({
    userId: req.user.id,
    streetLine1,
    streetLine2,
    city,
    state,
    postalCode,
    country,
    isDefault,
  });

  res.status(201).json({
    status: "success",
    address: newAddress,
  });
});

// Get all saved addresses for the logged-in user
const getMyAddresses = asyncWrapper(async (req, res, next) => {
  const addresses = await AddressModel.findByUserId(req.user.id);

  res.status(200).json({
    status: "success",
    addresses,
  });
});

module.exports = {
  addAddress,
  getMyAddresses,
};
