(()=>{
    // request, lapi are global variables
    console.log("request=", request)
    
    // aid of the app
    let aid = request["aid"]
    console.log("aid=", aid)
    let mid = request["mid"]
    console.log("mid=", mid)

    let nodeId = request["nodeid"]
    console.log("hostId=", nodeId)
    
    var authSid = lapi.BELoginAsAuthor()
    var ppt = lapi.SignPPT(authSid, {"CertFor": "Self", "NodeId": nodeId}, 1440)
    return ppt
})()
    