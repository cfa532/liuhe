((request, args)=>{
    // Update user data. Usually after login.
    try {
        let authSid = lapi.BELoginAsAuthor()
        let userMid = request["userid"]
        lapi.MMBackup(authSid, userMid, "", "delref=true")
        let ret = lapi.MiMeiPublish(authSid, "", userMid)
        console.log("Logout", userMid, JSON.stringify(ret))
        return userMid
    } catch(e) {
        console.error("Logout error:", e, userMid, JSON.stringify(request))
    }
})(request, args)