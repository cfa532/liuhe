import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores';

// Hprose API
const ayApi = ["GetVarByContext", "Act", "Login", "Getvar", "SwarmLocal", "DhtGetAllKeys","MFOpenByPath",
    "DhtGet", "DhtGets", "SignPPT", "RequestService", "SwarmAddrs", "MFOpenTempFile", "MFTemp2MacFile", "MFSetData",
    "MFGetData", "MMCreate", "MMOpen", "Hset", "Hget", "Hmset", "Hmget", "Zadd", "Zrangebyscore", "Zrange", "MFOpenMacFile",
    "MFReaddir", "MFGetMimeType", "MFSetObject", "MFGetObject", "Zcount", "Zrevrange", "Hlen", "Hscan", "Hrevscan",
    "MMRelease", "MMBackup", "MFStat", "Zrem", "Zremrangebyscore", "MiMeiPublish", "PullMsg", "MFTemp2Ipfs", "MFSetCid",
    "MMSum", "MiMeiSync", "IpfsAdd", "MMAddRef", "MMDelRef", "MMDelVers", "MMRelease", "MMGetRef", "MMGetRefs", "Hdel",
    "Hgetall", "Hkeys", "Del", "MiMeiSync", "MMSetRight", "RunMApp"
];

function getcurips() {
    let ips = "127.0.0.1:4800"
    // getParam is a Leither function
    if (window.getParam != null){
        const p=window.getParam()
        ips = p["ips"][p.CurNode]
        console.log("window.getParam", ips, p)
    } else if (window.location.host != ""){
        ips = window.location.host
        console.log("window.location", ips, window.location)
    }
    // If there is testing IP set in .env, use it. Otherwise use IP returned by server.
    return import.meta.env.VITE_LEITHER_IP ? import.meta.env.VITE_LEITHER_IP : ips
};
const ips = getcurips();    // web server's IP. Leither might be on different node, assigned by authentication server.

export const useLeitherStore = defineStore({
    id: 'LeitherApiHandler',
    state: () => ({
        ips: ips,
        client: window.hprose.Client.create("ws://" + ips + "/ws/", ayApi),
        appId: import.meta.env.VITE_APP_ID,
    }),
    getters: {
        hostId: async (state)=>{
            return await state.client.Getvar("", "hostid")
        }
    },
    actions: {
    }
})
