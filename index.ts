import { Socket, io } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";
import readLine from "readline-sync";

const WEBHOOK_TESTER_URL = "https://webhook.eduartepaiva.com";

async function main() {
    try {
        // credentials questions, if you wish you can hardcode them.
        const EMAIL = readLine.questionEMail("Type your email: ");
        const PASSWORD = readLine.question("Type your password: ", {
            hideEchoBack: true,
        });
        const POST_URL = readLine.question(
            "Type the URL that the app will redirect to, for exemple (http://localhost:3000): "
        );
        // ---------------------

        const response = await fetch(`${WEBHOOK_TESTER_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({
                email: EMAIL,
                password: PASSWORD,
            }),
            headers: {
                "content-type": "application/json; charset=utf-8",
            },
        });
        if (response.status != 201) {
            throw new Error(`Response fetch status: ${response.status}, ${await response.text()}`);
        }
        const resJson = await response.json();
        const accessToken = resJson.accessToken;
        if (typeof accessToken !== "string") {
            throw new Error("could not get accessToken");
        }
        const webhookURL = resJson.webhookURL;
        if (typeof webhookURL !== "string") {
            throw new Error("could not get webhookURL");
        }
        console.log(`Your webhookURL is: ${webhookURL}`);
        console.log("Use it in your application");

        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(WEBHOOK_TESTER_URL, {
            auth: {
                token: accessToken,
            },
            transports: ["websocket"],
            path: "/api/socket.io/",
        });
        socket.on("connect_error", (error) => {
            // ...
            console.log("A error happened: ", error);
        });
        // socket.auth
        socket.on("connect", () => {
            console.log(`you connected with ${socket.id}`);
        });

        const headersList = {
            Accept: "*/*",
            "Content-Type": "application/json",
        };

        socket.on("message", (data) => {
            const stringifiedData = JSON.stringify(data.payload);
            console.log(stringifiedData);
            const fetchURL = POST_URL + data.extra_url;
            console.log("Posting on URL: " + fetchURL);

            fetch(fetchURL, {
                method: "POST",
                body: stringifiedData,
                headers: headersList,
            })
                .then((res) => console.log(`The fetch result to (${fetchURL}) was : ${res.status}`))
                .catch((err) => console.error(err));
        });
    } catch (err) {
        console.log("error: ", err);
    }
}

main();
