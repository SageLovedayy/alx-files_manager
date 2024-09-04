import { ObjectId } from 'mongodb';

/**
 * Validates if a given string is a valid MongoDB ObjectID.
 *
 * This function provides a more robust check compared to simply using `ObjectId.isValid()`,
 * ensuring that the string not only has the correct format but also matches the ObjectId's
 * string representation.
 *
 * @param {string} id - The string to be validated as a MongoDB ObjectID.
 * @returns {boolean} - `true` if the `id` is a valid MongoDB ObjectID, `false` otherwise.
 */
function isValidObjectId(id) {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

export default isValidObjectId;
