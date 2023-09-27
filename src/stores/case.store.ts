import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores';

const PAGE_SIZE = 50        // chat items diplayed per page
const CASE_FIELD_KEY = "CASE_FIELD_KEY"
const TEMPLATE_KEY = "case_template"
const CHAT_HISTORY_KEY = "chat_history"

export const useCaseStore = defineStore({
    // holding all cases of the current user, in a FV database
    id: "CaseMimei",
    state: ()=>({
        api: window.lapi,    // Leither api handle
        _mid: "",            // Mimei database to hold all the cases of a user
        _mmsid: "",          // session id for the current user Mimei
        _value: {} as LegalCase,
        chatHistory: [] as ChatItem[]
    }),
    getters: {
        id: function(): string {
            return this._value.id
        },
        mid: function(state) {
            if (!state._mid)
                state._mid = useAuthStore().user.mid
            return state._mid
        },
        case: function(state) {
            return state._value
        },
        // mimei sid for reading
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
        template: async function() {
            return useAuthStore().user.template
        }
    },
    actions: {
        async backup(mid: string="") {
            if (!mid) mid = this.mid;       // use this mid by default
            try {
                const newVer = await this.api.client.MMBackup(this.api.sid, mid, '')
                this.$state._mmsid = await this.api.client.MMOpen(this.api.sid, mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(this.api.sid, "", mid)
                console.log("Case Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
        async createCase(c:LegalCase):Promise<string> {
            // add a new Case to database FV and return the Field. Use
            const hk = await this.api.client.MMCreate(this.api.sid, "LeitherAI", '', c.title, 1, 0x07276705)
            if (await this.api.client.Hget(await this.mmsid, CASE_FIELD_KEY, hk)) {
                throw new Error("Case title already exists")
            }
            // also use this hashkey as chat_history key and template FV key
            c.id = hk
            c.mid = this._mid
            c.timestamp = Date.now()
            this._value = c
            await this.api.client.Hset(await this.mmsidCur, CASE_FIELD_KEY, hk, c); // to get case list quickly
            await this.api.client.Hset(await this.mmsidCur, hk, TEMPLATE_KEY, JSON.stringify(this.template))
            // await this.api.client.Hset(await this.mmsidCur, hk, CHAT_HISTORY_KEY, {})
            await this.backup()
            return hk
        },
        async editCase(c:LegalCase) {
            // reset case data with 
            c.timestamp = Date.now()
            await this.api.client.Hset(await this.mmsidCur, CASE_FIELD_KEY, c.id, c);
            await this.backup()
        },
        async updateTemplate(field: string, val:string, val_type="result") {
            // only update AI result for now.
            // Field = userRole:userTask:subTask, value is user approved content for this subtask
            const [userRole, userTask, subTask] = field.split(':')
            const template = useAuthStore().user.template
            template[userRole][userTask][val_type][subTask] = val
            await this.api.client.Hset(await this.mmsidCur, this.id, TEMPLATE_KEY, JSON.stringify(template))
            useAuthStore().update()
        },
        getTemplateItem(field: string, val_type="result") {
            const [userRole, userTask, subTask] = field.split(':')
            return useAuthStore().user.template[userRole][userTask][val_type][subTask]
        },
        async addChatItem(c: ChatItem) {
            // case id (its field id) is also used as Key of chat history Score-Pair
            // c.timestamp = Date.now()
            await this.api.client.Zadd(await this.mmsidCur, this.id, new ScorePair(Date.now(), JSON.stringify(c)))
            await this.backup()
        },
        async getChatHistory(pageNum?: number) {
            if (typeof pageNum === "undefined") {
                return await this.api.client.Zrevrange(await this.mmsid, this.id, 0, -1)
            }
            // get currut page of chat history
            const start = (pageNum!-1)*PAGE_SIZE
            const ch:ChatItem[] = await this.api.client.Zrevrange(await this.mmsid, CASE_FIELD_KEY, start, start+PAGE_SIZE-1)
            this.chatHistory.concat(ch)
        },
        async initCase(id: string) {
            this._value = await this.api.client.Hget(await this.mmsid, CASE_FIELD_KEY, id)
            await this.getChatHistory(1)
        }
    }
})

export const useCaseListStore = defineStore({
    id: "CaseListStore",
    state: ()=>({
        api: window.lapi,     // Leither api handle
        _mid: "", //user.user.mid,            // Mimei database to hold all the cases of a user
        _mmsid: "",         // session id for the current user Mimei
        _activeId: "",
    }),
    getters: {
        activeId: function():string {
            if (this._activeId)
                return this._activeId
            else
                if (localStorage["activeId"]) {
                    this._activeId = localStorage["activeId"]
                    return this._activeId
                }
            return ""
        },       // current working case
        mid: function(state) {
            state._mid = useAuthStore().user.mid
            return state._mid
        },
        // mimei sid for reading
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last")
            return state._mmsid
        },
        // mimei sid for writing
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
        allCases: async function() :Promise<LegalCase[]> {
            const cases:LegalCase[] = await this.api.client.Hgetall(await this.mmsid, CASE_FIELD_KEY).map((e:any)=>e.value)
            cases.sort((a,b)=> b.timestamp-a.timestamp)
            return cases
        }
    },
    actions: {
        setActiveId(id:string) {
            localStorage["activeId"] = id
            this._activeId = id
        }
    }
})