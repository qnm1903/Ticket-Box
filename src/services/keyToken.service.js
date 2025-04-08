// import { Types } from 'mongoose'; // Import Types from mongoose
// import keyTokenModel from '../models/keyToken.model.js';
//
// const { ObjectId } = Types; // Destructure ObjectId from Types
//
// class KeyTokenService {
//   static async createKeyToken({ userId, publicKey, privateKey, refreshToken }) {
//
//     const filter = { user: userId }
//     const update = { publicKey, privateKey, refreshToken, refreshTokensUsed: [] }
//     const options = { upsert: true, new: true, setDefaultsOnInsert: true }
//     const tokens = await keyTokenModel.findOneAndUpdate(filter, update, options).lean()
//     return tokens ? tokens.publicKey : null
//   }
//
//   static async findKeyTokenByUserID(userId) {
//     return await keyTokenModel.findOne({ user: new ObjectId(userId) }) // .lean()
//   }
//
//   static async removeKeyByID(id) {
//     return await keyTokenModel.deleteOne(id)
//   }
//
//   static async findByRefreshTokenUsed(refreshToken) {
//     return await keyTokenModel.findOne({ refreshTokensUsed: { $in: [refreshToken] } }).lean()
//   }
//
//   static async findByRefreshToken(refreshToken) {
//     return await keyTokenModel.findOne({ refreshToken }).lean()
//   }
//
//   static async removeKeyByUserId(userId) {
//     return await keyTokenModel.deleteOne({ user: new ObjectId(userId) })
//   }
//
//   static async findByIdAndModify(id, { oldRefreshToken, newRefreshToken }) {
//     return await keyTokenModel.findByIdAndUpdate(id, {
//       $set: {
//         refreshToken: newRefreshToken,
//       },
//       $addToSet: {
//         refreshTokensUsed: oldRefreshToken
//       }
//     })
//   }
//
// }
//
// export default KeyTokenService
import mongoose from 'mongoose';
import keyTokenModel from '../models/keyToken.model.js';
import bcrypt from 'bcrypt';

const { ObjectId } = mongoose.Types;

class KeyTokenService {
  // Create or update key token for a user
  static async createKeyToken({ userId, publicKey, privateKey, refreshToken }) {
    try {
      // Encrypt the private key before storing it (for better security)

      const filter = { user: userId };
      const update = {
        publicKey,
        privateKey,
        refreshToken,
        refreshTokensUsed: [],
      };
      const options = { upsert: true, new: true, setDefaultsOnInsert: true };

      // Update or create the key token record
      const tokens = await keyTokenModel.findOneAndUpdate(filter, update, options).lean();
      return tokens ? tokens.publicKey : null;
    } catch (error) {
      console.error('Error creating key token:', error);
      throw new Error('Error creating or updating key token');
    }
  }

  // Find key token by user ID
  static async findKeyTokenByUserID(userId) {
    try {
      return await keyTokenModel.findOne({ user: new ObjectId(userId) }).lean();
    } catch (error) {
      console.error('Error finding key token by user ID:', error);
      throw new Error('Error finding key token by user ID');
    }
  }

  // Remove key token by ID
  static async removeKeyByID(id) {
    try {
      return await keyTokenModel.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error removing key by ID:', error);
      throw new Error('Error removing key by ID');
    }
  }

  // Find key token by refresh token that has already been used
  static async findByRefreshTokenUsed(refreshToken) {
    try {
      return await keyTokenModel.findOne({ refreshTokensUsed: { $in: [refreshToken] } }).lean();
    } catch (error) {
      console.error('Error finding key token by used refresh token:', error);
      throw new Error('Error finding key token by used refresh token');
    }
  }

  // Find key token by refresh token
  static async findByRefreshToken(refreshToken) {
    try {
      return await keyTokenModel.findOne({ refreshToken }).lean();
    } catch (error) {
      console.error('Error finding key token by refresh token:', error);
      throw new Error('Error finding key token by refresh token');
    }
  }

  // Remove key token by user ID
  static async removeKeyByUserId(userId) {
    try {
      return await keyTokenModel.deleteOne({ user: new ObjectId(userId) });
    } catch (error) {
      console.error('Error removing key token by user ID:', error);
      throw new Error('Error removing key token by user ID');
    }
  }

  // Find and update key token by ID
  static async findByIdAndModify(id, { oldRefreshToken, newRefreshToken }) {
    try {
      return await keyTokenModel.findByIdAndUpdate(id, {
        $set: {
          refreshToken: newRefreshToken,
        },
        $addToSet: {
          refreshTokensUsed: oldRefreshToken,
        },
      });
    } catch (error) {
      console.error('Error updating key token by ID:', error);
      throw new Error('Error updating key token by ID');
    }
  }
}

export default KeyTokenService;
