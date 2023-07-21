import { defineStore } from 'pinia';
// import { useRouter} from 'vue-router';
import { router } from '@/router'

// const router = useRouter();
// Hprose API
const ayApi = ["GetVarByContext", "Act", "Login", "Getvar", "Getnodeip", "SwarmLocal", "DhtGetAllKeys","MFOpenByPath",
    "DhtGet", "DhtGets", "SignPPT", "RequestService", "SwarmAddrs", "MFOpenTempFile", "MFTemp2MacFile", "MFSetData",
    "MFGetData", "MMCreate", "MMOpen", "Hset", "Hget", "Hmset", "Hmget", "Zadd", "Zrangebyscore", "Zrange", "MFOpenMacFile",
    "MFReaddir", "MFGetMimeType", "MFSetObject", "MFGetObject", "Zcount", "Zrevrange", "Hlen", "Hscan", "Hrevscan",
    "MMRelease", "MMBackup", "MFStat", "Zrem", "Zremrangebyscore", "MiMeiPublish", "PullMsg", "MFTemp2Ipfs", "MFSetCid",
    "MMSum", "MiMeiSync", "IpfsAdd", "MMAddRef"
];

// function getcurips() {
//     let ips = "127.0.0.1:4800"  //placeholder
//     // getParam is a Leither function
//     if (window.getParam != null){
//         let p=window.getParam()
//         ips = p["ips"][p.CurNode]
//         console.log("window.getParam", ips, p)
//     } else if (window.location.host != ""){
//         ips = window.location.host
//         console.log("window.location", ips)
//     }
//     { //for test
//         // ips = "192.168.0.3:4800"     //杭州盒子
//         // ips = "192.168.0.4:8000"     //台湾盒子
//         ips = "192.168.0.5:8002"        //gen8 ProLiant
//         // ips = '[240e:390:e6f:4fb0:e4a7:c56d:a055:2]:4800'
//         // ips = "125.120.29.190:8000"
//     }
//     return ips
// };
const ips = import.meta.env.VITE_LEITHER_IP

export const useLeither = defineStore({
    id: 'LeitherApiHandler', 
    state: ()=>({
        _sid: "",
        returnUrl: "",
        hostUrl: "ws://" + ips +"/ws/",
        baseUrl: "http://" + ips + "/",
    }),
    getters: {
        // console.log(state.hostUrl)
        client: (state) => window.hprose.Client.create(state.hostUrl, ayApi),
        sid: (state) => {
            if (sessionStorage.getItem("sid")) {
                state._sid = sessionStorage.getItem("sid")!
            }
            return state._sid;
        }
    },
    actions: {
        login(user="", pswd="") {
            return new Promise<string>((resolve, reject)=>{
                // if (user=="") {
                //     // guest user
                //     console.log("user=",user, "psd=", pswd)
                //     resolve(true)
                //     return
                // }
                this.client.Login(user, pswd, "byname").then(
                    // this.client.Login("lsb", "123456", "byname").then(
                    (result:any)=>{ 
                        this._sid = result.sid
                        sessionStorage.setItem("sid", result.sid)
                        this.client.SignPPT(this._sid, {
                            CertFor: "Self",
                            Userid: result.uid,
                            RequestService: "mimei"
                        }, 1).then(
                            (ppt:any)=>{
                            console.log("ppt=", JSON.parse(ppt))
                            this.client.RequestService(ppt).then(
                                (map:any)=>{
                                    console.log("Request service, ", map)
                                    console.log("return url", this.returnUrl)
                                    resolve(this.returnUrl.slice(2))         // remove the leading #/
                                    // router.push(this.returnUrl.slice(2))   
                                }, (err:Error)=>{
                                    console.error("Request service error=", err)
                                    reject("Request service error")
                                })
                        }, (err:Error)=>{
                            console.error("Sign PPT error=", err)
                            reject("Sign PPT error")
                        })
                    }, (e:Error) => {
                        console.error("Login error=", e)
                        reject("Login error")
                    }
                )
            })
        },
        logout() {
            sessionStorage.setItem("sid", "");
            this._sid = "";
            router.push({name: "main"});
        }
    }
})

export const useMimei = defineStore({
    // manager persistent state variables
    id: 'MMInfo',
    state: ()=>({
        api: {} as any,      // leither api handler
        mid: import.meta.env.VITE_MIMEI_DB,             // pratum
        _mmsid: "",
    }),
    getters: {
        mmsid: async function(state) :Promise<string> {
            state._mmsid = state._mmsid? state._mmsid : await this.api.client.MMOpen(this.api.sid, this.mid, "last");
            return state._mmsid;
        },
        mmsidCur: async function() :Promise<string> {
            return await this.api.client.MMOpen(this.api.sid, this.mid, "cur");
        },
    },
    actions: {
        init(api: any) {        // leither api object
            this.$state.api = api;
            window.mmInfo = this.$state;    // for easy testing
        },
        async backup(mid: string="") {
            if (!mid) mid = this.mid;
            try {
                const newVer = await this.api.client.MMBackup(this.api.sid, mid, '')
                this.$state._mmsid = await this.api.client.MMOpen(this.api.sid, mid, "last");
                // now publish a new version of database Mimei
                const ret:DhtReply = this.api.client.MiMeiPublish(this.api.sid, "", mid)
                console.log("Mimei publish []DhtReply=", ret, this._mmsid, "newVer="+newVer)
            } catch(err:any) {
                throw new Error(err)
            }
        },
    }
});
