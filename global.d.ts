// Global function handlers
interface Window {
    mmInfo: any       // add to window obj for testing convenience
    getParam: any
    hprose: any
    lapi: any         // Leither api handler
}

// User accounts are saved in Main DB in a seperate Mimei. Each user has an individual Mimei for its data.
// interface UserAccount {
//     username: string,
//     familyName: string,
//     givenName: string,
//     password: string,
//     mid: string,            // Mimei id for this user's db, everything of the user is stored in the Mimei
//     role: string,           // 用户身份：分析师，交易员，财务？
//     template: any,         // dictionary that hold user settings of LLM
//     subscription: boolean,  // whether the user is subscribed to the Mimei
//     token_count?: any,
//     token_usage?: any
// }
class UserAccount {
    username: string;
    familyName: string;
    givenName: string
    password: string
    mid: string                     // Mimei id for this user's db, everything of the user is stored in the Mimei
    role: string = "user"           // 用户身份：分析师，交易员，财务？
    template: any                   // dictionary that hold user settings of LLM
    subscription: boolean = false   // whether the user is subscribed to the Mimei
    token_count?: any
    token_usage?: any
}

interface Book {
    date: string,       // Date formated in YYMMDD
    token: number,      // number of tokens on the date
}

interface ChatItem {
    Q: string;      // query
    A: string;      // answer by AI
    tokens?: number;   // token cost for this chat
    cost?: number;    // cost in $US
}
interface ChatCase {       // chat
    // this.id is used as Key to the chat history Score_Pair
    // human ask, and AI reply. Within Mimei DB, each chat item is stored as ScorePair.
    // score: timestamp when the item is created, which means AI answered a question.
    id: string,             // id of the chat case, use sequence of timestamp which will be unique.
    timestamp: number,      // date and time this leagal case is created in the system. Updated every time change is made
                            // used to sort the chat case list
    brief: string,          // brief description of the case
    show?: boolean          // show or hide this case
}
// Mimei data structures
interface ScorePair { 
    score: number
    member: string 
}
// function ScorePair(score: number, member: string) {
//     return {score, member}
// }

interface FVPair {
    field: string       // usually the Mimei Id
    value: any          // Mimei object
}

// Mimei specific data types
type PulledMessage = {
    tm: string      //消息发生的时间
    from: string
    to: string
    appID?: string      //空表示系统消息
    msg: string      //表示命令，是由appid约定的，如果appid为空，则是系统消息?
    sign?: string      //发送者签名
    data?: any       //应用自定义的数据格式
    //如果考虑消息的自净，应当加入一个消息的有效期，到期自动删除
}
type DhtReply = {
    dhtName: string
    info: string
}

