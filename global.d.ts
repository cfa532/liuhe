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
    mid: string,        // Mimei Id of the current user, which holds all the cases
    id: string,         // hash of the Case title
    title: string,
    brief: string,
    plaintiff: string,      // str[]
    defendant: string,      // need to change to str[]
    attorney:string,
    judge:string,
    chatHistoryKey: string,  // this.id is used as Key to the chat history Score_Pair
    // chatHistory: [timestamp: {AI:string, Human:string}],
    // human ask, and AI reply. Within Mimei DB, each chat item is stored as ScorePair.
    // score: timestamp when the item is created, which means AI answered a question.
    templateKey: string,   // this.id used as Key to Field_Value for saving result of each template item
    timestamp: number,      // date and time this leagal case is created in the system.
}
interface UserAccount {
    username: string,
    familyName: string,
    givenName: string,
    password: string,
    mid: string,        // Mimei id for this user db, everything of the user
    template?: string,      // stringified json object
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

