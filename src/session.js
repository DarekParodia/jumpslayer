
function middleware(req, res, next) {
    console.log('Request Type:', req.method)
    next()
}

const session = {
    middleware: middleware
}

export default session;