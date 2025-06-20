((request, args)=>{
    // Update user data upon login. Client will provide username.
    // create local user mid with the given username.
    try {
        const USER_DATA_KEY = "user_data_key"
        const APP_ID = request["aid"]       // App ID assigned by Leither upon publication
        const APP_EXT = "us.leither.aichat"
        let authSid = lapi.BELoginAsAuthor()
        let user = JSON.parse(request["user"])
        let userMid = lapi.MMCreate(authSid, APP_ID, APP_EXT, user.username, 2, 0x07276704)
        let mmsid = lapi.MMOpen(authSid, userMid, "cur")
        if (!lapi.MFIsExist(mmsid, userMid)) {
            console.log("Init mid", userMid)
            lapi.Set(mmsid, USER_DATA_KEY, user)
            lapi.MMBackup(authSid, userMid, "", "delref=true")
            lapi.MiMeiPublish(authSid, "", userMid)
            console.log(userMid, "inited.")
        } else {
            console.log("Syncing mid", userMid)
            // lapi.MiMeiSync(mmsid, "", userMid, {})
        }
        console.log(request["user"], userMid)
        return userMid
    } catch(e) {
        console.error("update_user error:", JSON.stringify(request), e)
    }
})(request, args)