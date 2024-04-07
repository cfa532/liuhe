import { reactive } from "vue";
import { io } from "socket.io-client";

export const state = reactive({
    connected: false,
    fooEvents: [] as any[],
    barEvents: [] as any[]
});

// "undefined" means the URL will be computed from the `window.location` object
// const URL = "http://localhost:8080";
// const URL = "http://125.229.161.122:4800";
const URL = "http://52.221.183.236:8505"

export const socket = io(URL, {
    withCredentials: true,
    autoConnect: false
  });

// socket.on("connect", () => {
//     console.log("Connected")
//     state.connected = true;
// });

// socket.on("disconnect", () => {
//     console.log("Disconnected")
//     state.connected = false;
// });

// socket.on("foo", (...args) => {
//     state.fooEvents.push(args);
// });

// socket.on("bar", (...args) => {
//     state.barEvents.push(args);
// });