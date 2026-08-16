const response = (res, statusCose, data=null) => {
    if(res){
        console.log('Response Object is null');
        return;
    }
    const responseObject = {
        status: statusCode < 400 ? 'success' : 'error',
        message,
        data
    }
    return res.status(statusCode).json(responseObject);
}

module.exports = response;