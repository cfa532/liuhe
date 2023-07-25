import { useAlertStore, useMainStore } from "@/stores";

export { leitherBackend };

// array in local storage for registered users
const usersKey = 'vue-3-pinia-registration-login-example-users';
const users = JSON.parse(localStorage.getItem(usersKey)!) || [];

function leitherBackend() {
    const realFetch = window.fetch;     // monkey patching
    window.fetch = function (url:string, opts:any) {
        return new Promise((resolve, reject) => {
            switch (true) {
                case url.endsWith('/users/authenticate') && opts.method === 'POST':
                    return authenticate();
                case url.endsWith('/users/register') && opts.method === 'POST':
                    return register();
                case url.endsWith('/users') && opts.method === 'GET':
                    return getUsers();
                case url.match(/\/users\/\d+$/) && opts.method === 'GET':
                    return getUserById();
                case url.match(/\/users\/\d+$/) && opts.method === 'PUT':
                    return updateUser();
                case url.match(/\/users\/\d+$/) && opts.method === 'DELETE':
                    return deleteUser();
                default:
                    // pass through any requests not handled above
                    // handle them with original window.fetch()
                    return realFetch(url, opts)
                        .then(response => resolve(response))
                        .catch(error => reject(error));
            }

            // route functions
            async function authenticate() {
                const { username, password } = body();
                try {
                    const user = await useMainStore().authenticate(username, password)
                    console.log(user, {
                        ...basicDetails(user),
                        token: 'fake-jwt-token'
                    })
                    return ok({
                        ...basicDetails(user),
                        token: 'fake-jwt-token'
                    });
                } catch(err) {
                    console.error("Login failed", err)
                    useAlertStore().error("Login error")
                }
            }

            function register() {
                const user = body();

                // check Main DB to see if username exists
                const userDb = useMainStore()
                const ua = {"username":user.username, "familyName":user.lastName, "givenName":user.firstName, "password":user.password}
                userDb.addUser(ua).then((u:UserAccount)=>{
                    console.log("New Leither user=", u)
                    users.push(u);
                    localStorage.setItem(usersKey, JSON.stringify(users));
                    return ok();
                }, err=>{
                    console.error("User register error,", err)
                })
            }

            function getUsers() {
                if (!isAuthenticated()) return unauthorized();
                return ok(users.map((x:any) => basicDetails(x)));
            }

            function getUserById() {
                if (!isAuthenticated()) return unauthorized();

                const user = users.find((x :any)  => x.id === idFromUrl());
                return ok(basicDetails(user));
            }

            function updateUser() {
                if (!isAuthenticated()) return unauthorized();

                const params = body();
                const user = users.find((x :any)  => x.id === idFromUrl());

                // only update password if entered
                if (!params.password) {
                    delete params.password;
                }

                // if username changed check if taken
                if (params.username !== user.username && users.find((x:any) => x.username === params.username)) {
                    return error('Username "' + params.username + '" is already taken')
                }

                // update and save user
                Object.assign(user, params);
                localStorage.setItem(usersKey, JSON.stringify(users));

                return ok("");
            }

            function deleteUser() {
                if (!isAuthenticated()) return unauthorized();

                users = users.filter((x :any)  => x.id !== idFromUrl());
                localStorage.setItem(usersKey, JSON.stringify(users));
                return ok("");
            }

            // helper functions

            function ok(body:any=null) {
                resolve({ ok: true, ...headers(), json: () => Promise.resolve(body) } as any)
            }

            function unauthorized() {
                resolve({ status: 401, ...headers(), json: () => Promise.resolve({ message: 'Unauthorized' }) } as any)
            }

            function error(message:string) {
                resolve({ status: 400, ...headers(), json: () => Promise.resolve({ message }) } as any)
            }

            function basicDetails(user: any) {
                const { username, familyName, givenName, caseMid } = user;
                return { username, familyName, givenName, caseMid };
            }

            function isAuthenticated() {
                return opts.headers['Authorization'] === 'Bearer fake-jwt-token';
            }

            function body() {
                console.log("return body=", opts)
                return opts.body && JSON.parse(opts.body);
            }

            function idFromUrl() {
                const urlParts = url.split('/');
                return parseInt(urlParts[urlParts.length - 1]);
            }

            function headers() {
                return {
                    headers: {
                        get() {
                            return ['application/json'];
                        }
                    }
                }
            }
        });
    }
}
