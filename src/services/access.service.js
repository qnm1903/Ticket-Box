'use strict';

// TODO: External modules
import bcrypt from 'bcrypt';


// TODO: Internal modules
import customerModel from '../models/customer.model.js';
import KeyTokenService from './keyToken.service.js';
// Importing from auth.js
import { createTokenPair, verifyJWT } from '../middlewares/auth.js';
import { getObjectData, getRandomString } from '../utils/index.js';
import ErrorResponses from '../core/error.response.js';
import customerService from './customer.service.js';

const { NotFoundRequest, BadRequest, UnauthorizedRequest, ForbiddenRequest } = ErrorResponses;
import sendVerificationEmail from './emailSend.service.js';
const SALTY_ROUNDS = 10;

const validatePassword = (password) => {
  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  // regex không hoạt động
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new BadRequest('Password must contain at least one uppercase letter, one number, and one special character.');
  }
  return true;
};

// Function to prompt user for verification code
async function promptUserForCode() {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question('Please enter the verification code sent to your email: ', (code) => {
      readline.close();
      resolve(code);
    });
  });
}

class AccessService {

  static async login({ email, password }) {
    // TODO: Step 1: Check email is existed
    const foundCustomer = await customerService.findByEmail({ email })
    if (!foundCustomer) {
      throw new NotFoundRequest('Customer is not registered')
    }

    // TODO: Step 2: Check password
    const match = await bcrypt.compare(password, foundCustomer.password);
    if (!match) {
      throw new UnauthorizedRequest('Password is incorrect')
    }

    // TODO: Step 3: Create accessToken and refreshToken
    const privateKey = getRandomString(64)
    const publicKey = getRandomString(64)

    const tokenPayload = {
      userId: foundCustomer._id,
      email: foundCustomer.email,
    }
    const tokens = createTokenPair(tokenPayload, publicKey, privateKey)

    // TODO: Step 4: Save key token
    await KeyTokenService.createKeyToken({
      userId: foundCustomer._id,
      publicKey,
      privateKey,
      refreshToken: tokens.refreshToken
    })

    return {
      customer: getObjectData({ fields: ['_id', 'email'], object: foundCustomer }),
      tokens
    }

  }
  static async signUp({ email, password, confirm_password }) {
    if (email === "" || password === "") {
      throw new BadRequest('Username or password cannot be empty');
    }

    if (!validatePassword(password) || password !== confirm_password) {
      throw new BadRequest('Confirm password does not match');
    }
    try {
      // Step 1: Check if email exists
      const holderShop = await customerService.findByEmail({ email });

      if (holderShop) {
        throw new BadRequest('Email already exists');
      }
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      await sendVerificationEmail(email, verificationCode);

      console.log(`A verification code has been sent to ${email}. Please check your email.`);

      return {
        code: 201, verificationCode,
        email, password
      }
    } catch (error) {
      console.error('signup failed:', error);
      throw error; // Re-throw the error to ensure the appropriate response is returned
    }
  }

  static async verify({email, password}) {

    // Step 2: Create new customer
    const passwordHash = await bcrypt.hash(password, SALTY_ROUNDS);
    const newCustomer = await customerModel.create({
      email, password: passwordHash
    });
    let tokens
    // Step 3: Maybe grant token for new customer
    if (newCustomer) {
      // Step 3.1: Generate random keys
      const publicKey = getRandomString(64);
      const privateKey = getRandomString(64);

      // Step 3.2: Create JWT token
      const tokenPayload = {
        userId: newCustomer._id,
        email: newCustomer.email,
      };

      tokens = createTokenPair(tokenPayload, publicKey, privateKey);

      // Step 3.3: Save key token in database
      const keyStore = await KeyTokenService.createKeyToken({
        userId: newCustomer._id,
        publicKey,
        privateKey,
        refreshToken: tokens.refreshToken
      });

      if (!keyStore) {
        throw new NotFoundRequest('Cannot create key token');
      }
    }

    return {
      code: 201,
      customer: getObjectData({ fields: ['_id',  'email'], object: newCustomer }),
      tokens
    };
  }
  static async logout(keyStore) {
    await KeyTokenService.removeKeyByID(keyStore._id)
    return true
  }

  static async refreshToken({ refreshToken }) {
    // TODO: check token is used
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)

    // TODO: Token maybe use by hacker
    if (foundToken) {
      const { userId } = verifyJWT(refreshToken, foundToken.privateKey)

      // TODO: Delete all token in keyStore
      await KeyTokenService.removeKeyByUserId(userId)

      throw new ForbiddenRequest('Something went wrong! Please login again')
    }

    // TODO: Check token is valid
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)

    if (!holderToken) {
      throw new UnauthorizedRequest('Invalid token')
    }

    const { userId, email } = verifyJWT(refreshToken, holderToken.privateKey)
    const foundShop = await customerService.findByEmail({ email })

    if (!foundShop) {
      throw new UnauthorizedRequest('Shop is not registered')
    }

    const tokens = await createTokenPair({ userId, email }, holderToken.publicKey, holderToken.privateKey)

    // TODO: Update new refreshToken and refreshTokenUsed
    // TODO Atomistic update
    await KeyTokenService.findByIdAndModify(holderToken._id, { newRefreshToken: tokens.refreshToken, oldRefreshToken: refreshToken})

    return {
      customer: { userId, email },
      tokens
    }
  }

  static async refreshTokenV2({ refreshToken, user, keyStore }) {
    const { userId, email } = user

    // TODO: check token is used
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      // TODO: Delete all token in keyStore
      await KeyTokenService.removeKeyByUserId(userId)

      throw new ForbiddenRequest('Something went wrong! Please login again')
    }

    // TODO: Check token is valid
    if (keyStore.refreshToken !== refreshToken) throw new UnauthorizedRequest('Invalid token')

    const foundShop = await customerService.findByEmail({ email })

    if (!foundShop) {
      throw new UnauthorizedRequest('Shop is not registered')
    }

    const tokens = createTokenPair({ userId, email }, keyStore.publicKey, keyStore.privateKey)

    // TODO: Update new refreshToken and refreshTokenUsed
    // TODO: Atomistic update
    await KeyTokenService.findByIdAndModify(keyStore._id, { newRefreshToken: tokens.refreshToken, oldRefreshToken: refreshToken })

    return {
      user,
      tokens
    }
  }

}

export default AccessService;
