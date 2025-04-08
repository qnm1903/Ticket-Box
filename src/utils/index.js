// utils/index.js

import _ from 'lodash';
import crypto from 'node:crypto';
import { flatten } from 'flat';
import { Types } from 'mongoose';

// Define the functions
export const convertToObjectId = (id) => {
  return Types.ObjectId(id);
}

export const getObjectData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
}

export const getRandomString = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
}

// Other functions...
export const getSelectFields = (fields = []) => {
  return Object.fromEntries(fields.map(field => [field, 1]));
}

export const getUnSelectFields = (fields = []) => {
  return Object.fromEntries(fields.map(field => [field, 0]));
}

export const compactDeepObject = (object = {}) => {
  const flattenObject = flatten(object);
  return _.omitBy(flattenObject, _.isNil);
}

export const isDateBetween = ({ currentDate = new Date(), startDate, endDate }) => {
  return currentDate >= new Date(startDate) && currentDate <= new Date(endDate);
}
