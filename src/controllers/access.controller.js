'use strict'

import { OkResponse } from '../core/success.response.js'
// import { BadRequestResponse } from '../core/error.response.js'
import AccessService from '../services/access.service.js'
import sendVerificationEmail from '../services/emailSend.service.js'
class AccessController {
    async getLogin(req, res) {
        res.render('login', { errorMessage: null })
    }
    async getSignUp(req, res) {
        res.render('signup', { errorMessage: null })
    }
    async getVerify(req, res) {
        res.render('verify', { errorMessage: null })
    }
    // TODO: API login
    async login(req, res) {
        const { email, password } = req.body;
        if (email === 'admin@gmail.com' && password === 'Ticketbox1234@') {
            return res.redirect('/adminPage-create');
        }
        try {
                const metadata = await AccessService.login(req.body)
                console.log('metadata:', metadata)
                // if(metadata && metadata.customer && metadata.tokens){
                req.session.customer = metadata.customer // Store user in session
                req.session.tokens = metadata.tokens
                //res.status(metadata.code).send({ message: 'Login successfully!' })
                res.redirect('/')
            } catch (error) {
                res.render('login', {errorMessage: error.message})
            }
    }

    // TODO: API signup
    async signUp(req, res) {
        try {
            const metadata = await AccessService.signUp(req.body)

            req.session.email = metadata.email
            req.session.password = metadata.password
            req.session.verificationCode = metadata.verificationCode
            console.log('metadata:', metadata)
            if (metadata) {
                res.redirect('/verify')
            }
            else {
                console.log('Email already existed')
                res.render('signup', { errorMessage: 'Email already existed' })}
        } catch (error) {
            res.render('signup', { errorMessage: error.message })
        }
    }
    
    async verify(req, res){
        const code = req.body.verification_code; // Lấy đúng trường từ req.body
        const email = req.session.email
        const password = req.session.password
        const verificationCode = req.session.verificationCode
        parseInt(verificationCode)
        console.log('code:', code)
        console.log('verificationCode:', verificationCode)
        if (code != verificationCode){
            res.render('verify', {errorMessage: 'Verification code is incorrect'})
        }
        else{
            try{
                const metadata = await AccessService.verify({email, password})
                if(metadata && metadata.customer && metadata.tokens){
                    res.redirect('/login')
                }
            } catch(error){
                res.render('verify', {errorMessage: error.message})
            }
        }
       
    }
    async resendCode(req, res){
            try {
                const email = req.session.email; // Lấy email từ session
        
                if (!email) {
                    res.render('verify', {errorMessage: 'No email found'});
                }
        
                // Tạo mã xác minh mới
                const newVerificationCode = Math.floor(100000 + Math.random() * 900000);
        
                // Lưu mã mới vào session
                req.session.verificationCode = newVerificationCode;
        
                // Gửi email xác minh mới
                await sendVerificationEmail(email, newVerificationCode);
        
                console.log(`Resent verification code to ${email}`);
                res.json({ success: true, message: 'Verification code resent' });
            } catch (error) {
                console.error('Failed to resend verification code:', error);
                res.status(500).json({ success: false, message: 'Failed to resend code' });
        }
    }
    // TODO: API logout
    async logout(req, res, next) {
        // new OkResponse({
        //   message: 'Logout successfully',
        //   metadata: await accessService.logout(req.keyStore) // keyStore is from middleware authentication
        // }).send(res)
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send("Error logging out");
            }
            res.redirect('/login'); // Redirect to login after logout
        });
    }

    // TODO: API refresh token
    async refreshToken(req, res, next) {
        // new OkResponse({
        //   message: 'Refresh token successfully',
        //   metadata: await accessService.refreshToken(req.body)
        // }).send(res)

        // TODO: v2 optimize
        new OkResponse({
            message: 'Refresh token successfully',
            metadata: await AccessService.refreshTokenV2({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore,
            }), // middleware authenticationV2
        }).send(res)
    }
}

export default new AccessController()
