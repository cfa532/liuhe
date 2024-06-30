(()=>{
//request是一个全局变量，由Leither在执行角本前生成，并记入到全局变量
console.log("request=", request)

//sid是一个session id，代表者角本执行的身份
let sid = request["sid"]
console.log("sid=", sid)

//aid是这个应用的id
let aid = request["aid"]
console.log("aid=", aid)

//ver是当前应用的版本
let ver = request["ver"]
console.log("ver=", ver)

//Leither api中的错误信息在js中都以异常的方式返回
try{
	//写数据库
	lapi.Set(appdatasid, "apkey", "lapi.set at auth.js");
	
	//应用数据有三个类型，这是应用在节点上的应用数据。
	//这个数据区是一个数据库类型的弥媒
	//返回值是一个mmsid,可以操作相应的弥媒数据库
	var appdatasid = lapi.BEOpenAppDataNode("cur")
	console.log("appdatasid=", appdatasid)
	
	//写数据库
	lapi.Set(appdatasid, "apkey", "lapi.set at auth.js");
	
	//读数据库
	let value = lapi.Get(appdatasid, "apkey");
	console.log("lapi.Get0 apkey value=", value)
} catch(e){
	console.log("OpenAppDataNode err=", e)
}



//创建一个session,返回值是session id
//可以通过这个session id对session进行读写
//session可以跨越不同入口的
let besid = lapi.CreateSession()
console.log("besid", besid)

//写一个变量到这个session上
lapi.SessionSet(besid, "appsid", appdatasid)
lapi.SessionSet(besid, "status", "auth ok")

//从
let value = lapi.SessionGet(besid, "appsid")
console.log("appsid", value)


var authSid = lapi.BELoginAsAuthor()
var ppt = lapi.SignPPT(authSid, {"CertFor":"Self", "NodeId":""}, 1440)
return ppt
// lapi.SessionSet(besid, "authSid", authSid)

//返回的应该是besid

// return besid
})()
