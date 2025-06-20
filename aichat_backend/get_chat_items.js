((request, args)=>{
    try {
        const CHAT_HISTORY_KEY = "CHAT_HISTORY_"            // set of chat I
        let caseId = request["caseid"].toString()
        let userMid = request["mid"]
        let pageSize = request["pagesize"] ? request["pagesize"] : 30
        
        let mmsid = lapi.MMOpen("", userMid, "last")
        let keys = lapi.Hkeys(mmsid, CHAT_HISTORY_KEY+caseId)
            .sort((a, b) => b-a)
        let items = lapi.Hmget(mmsid, CHAT_HISTORY_KEY+caseId, ...keys.slice(0, pageSize))
        console.log("Items", JSON.stringify(items))
        return items
    } catch(e) {
        console.error("get_chat_items error:", JSON.stringify(request), e)
    }
})(request, args)