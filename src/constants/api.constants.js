const PORT = process.env.PORT || 5000
const HOST = `http://localhost:${PORT}`
const API_VERSION = 'v1'
const API_URL = `${HOST}/api/${API_VERSION}`

// Auth
const LOGIN_URL = '/auth/login'
const REGISTER_URL = '/auth/register'

export default API_URL
export { LOGIN_URL, REGISTER_URL }
