((request, args)=>{
    try {
        /**
         * Case list of a user is stored in Hashset.
         * Each item is a Field-value pair.
         */
        const CHAT_CASE_KEY = "CHAT_CASE_LIST"
        let userMid = request["mid"].toString()
        let mmsid = lapi.MMOpen("", userMid, "last")
        let fvs = lapi.Hgetall(mmsid, CHAT_CASE_KEY)
        let allCases = fvs.map( e => e.Value)
        console.log(JSON.stringify(allCases))
        return allCases ? allCases : []
    } catch(e) {
        console.error("get_cases error:", JSON.stringify(request), e)
    }
})(request, args)