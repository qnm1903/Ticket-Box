'use strict'
import JWT, {decode} from 'jsonwebtoken';  // Importing the 'jsonwebtoken' package
import headerConfig from "../constants/header.config.js";
import KeyTokenService from '../services/keyToken.service.js';  // Importing the key token service
import ErrorResponses from "../core/error.response.js";  // Default import
import forwardError from '../utils/forwardError.js';  // Importing forwardError utility

// Access the HEADERS from the imported object
const { HEADERS } = headerConfig;

const { NotFoundRequest, UnauthorizedRequest } = ErrorResponses;  // Destructure from the imported object


const createTokenPair = (payload, publicKey, privateKey) => {

  // TODO: Create access token
  const accessToken = JWT.sign(payload, publicKey, {
    expiresIn: '2h',
  })

  // TODO: Create refresh token
  const refreshToken = JWT.sign(payload, privateKey, {
    expiresIn: '7 days',
  })

  return {
    accessToken,
    refreshToken
  }
}

const authenticationV2 = forwardError(async (req, res, next) => {
  /**
   * 1. Check userId is existed
   * 2. get Access Token from header
   * 3. Verify Access Token
   * 4. Check Access Token is existed in DB
   * 5. check Access Token in keys Store
   */

  // TODO: Step 1: Check userId and accessToken is existed
  const { tokens, customer } = req.session || {};
  console.log('Session:', req.session);
  if(!tokens || !customer) {
    return res.redirect('/login');
  }
  const refreshToken = tokens?.refreshToken;
  const userId = customer?._id;
  const accessToken = tokens.accessToken;


  // TODO: Step 2: Found key token
  const keyStore = await KeyTokenService.findKeyTokenByUserID(userId)
  if (!keyStore) {
    return res.redirect('/login');
  }

  //* In case refresh token
  if (refreshToken) {
    try {

      const decodeUser = JWT.verify(refreshToken, keyStore.privateKey);

      if (decodeUser.userId !== userId) {
        console.error('Mismatch userId in refreshToken:', decodeUser.userId);
        throw new UnauthorizedRequest('Invalid Refresh Token');
      }

      // Gắn thông tin vào req
      decodeUser._id = decodeUser.userId;
      req.session.keyStore = keyStore;
      req.session.customer = decodeUser;

      return next();
    } catch (error) {
      console.error('Refresh Token verification failed:', error);
      return res.redirect('/login');
    }
  }
      try {
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
        if (decodeUser.userId !== userId) {
          throw new UnauthorizedRequest('Invalid Request')
        }

        req.session.keyStore = keyStore;
        req.session.customer = decodeUser;

        return next();
      } catch (error) {
        throw new UnauthorizedRequest('Access Token verification failed', error);
        return res.redirect('/login');
      }
})

const verifyJWT = (token, keySecret) => {
  return JWT.verify(token, keySecret)
}
const ensureAuthen = (req, res, next) => {
  if (!req.session.customer) {
    return res.redirect('/login');
  }
  next();
};


export{
  createTokenPair,
  authenticationV2,
  verifyJWT,
    ensureAuthen
}