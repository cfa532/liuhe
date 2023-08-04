// Global function handlers
interface Window {
    mmInfo: any       // add to window obj for testing convenience
    getParam: any
    hprose: any
    lapi: any         // Leither api handler
}

interface ChatItem {
    AI: string;
    Human: string;
}
interface LegalCase {
    id: string,         // hashed Id of this Case object
    title: string,
    brief: string,
    plaintiff: string,
    defendant: string,
    attorney:string,
    judge?:string,
    chatHistoryId?: string,  // Mimei id points to the chat history database
    // chatHistory: [{AI:string, Human:string}],
    // human ask, and AI reply. Within Mimei DB, each chat item is stored as ScorePair.
    // score: timestamp when the item is created, which means AI answered a question.
    timestamp: number,      // date and time this leagal case is created in the system.
}
interface UserAccount {
    username: string,
    familyName: string,
    givenName: string,
    password: string,
    caseMid?: string,        // mid of Case Mimei db
}

// Mimei data structures
declare class ScorePair {
    score: number;
    member: any;
    constructor(score: number, member: any) {
      this.score = score;
      this.member = member;
    }
};
// export const ScorePair = new  ScorePair()

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

