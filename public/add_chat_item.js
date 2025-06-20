((request, args)=>{
    try {
        const CHAT_CASE_KEY = "CHAT_CASE_LIST"   // set of case IDs
        const CHAT_HISTORY_KEY = "CHAT_HISTORY_"            // set of chat I

        let userMid = request["mid"]
        let authSid = lapi.BELoginAsAuthor()
        let mmsid = lapi.MMOpen(authSid, userMid, "cur")

        // add a new ChatItem to the Case.
        let ci = JSON.parse(request["chatitem"])
        let caseId = request["caseid"].toString()
        let timestamp = Date.now().toString()
        lapi.Hset(mmsid, CHAT_HISTORY_KEY+caseId, timestamp, ci)

        // update timestamp of the current case
        let caseObj = lapi.Hget(mmsid, CHAT_CASE_KEY, caseId)
        caseObj.timestamp = timestamp
        lapi.Hset(mmsid, CHAT_CASE_KEY, caseId, caseObj)
        lapi.MMBackup(authSid, userMid, "", "delref=true")
        console.log("Item added", JSON.stringify(ci))
    } catch(e) {
        console.error("backup_mimei error:", JSON.stringify(request), e)
    }
})(request, args)