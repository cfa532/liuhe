((request, args)=>{
    try {
        /**
         * Case list of a user is stored in Hashset.
         * Each item is a Field-value pair.
         */
        const CHAT_CASE_KEY = "CHAT_CASE_LIST"
        let userMid = request["mid"]
        let caseObj = JSON.parse(request["case"])
        let authSid = lapi.BELoginAsAuthor()

        let mmsid = lapi.MMOpen(authSid, userMid, "cur")
        lapi.Hset(mmsid, CHAT_CASE_KEY, caseObj.id, caseObj)
        lapi.MMBackup(authSid, userMid, "", "delref=true")
    } catch(e) {
        console.error("add_case error:", JSON.stringify(request), e)
    }
})(request, args)